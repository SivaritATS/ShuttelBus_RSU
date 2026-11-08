package com.rsu.shuttle.driver.service

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.location.Location
import android.os.Build
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.*
import com.rsu.shuttle.driver.MainActivity
import com.rsu.shuttle.driver.R
import com.rsu.shuttle.driver.data.api.RetrofitClient
import com.rsu.shuttle.driver.data.model.LocationUpdatePayload
import com.rsu.shuttle.driver.data.preferences.AppPreferences
import com.rsu.shuttle.driver.data.realtime.SocketManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class LiveLocationState(
    val latitude: Double = 0.0,
    val longitude: Double = 0.0,
    val speedKmh: Float = 0f,
    val heading: Float = 0f,
    val updateCount: Long = 0,
    val lastUpdated: Long = 0
)

class LocationTrackingService : Service() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private lateinit var prefs: AppPreferences
    private val socketManager = SocketManager.getInstance()
    private var wakeLock: PowerManager.WakeLock? = null

    private var updateCounter: Long = 0

    override fun onCreate() {
        super.onCreate()
        prefs = AppPreferences.getInstance(this)
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)

        createNotificationChannel()

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                val location = result.lastLocation ?: return
                onNewLocation(location)
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action

        when (action) {
            ACTION_STOP -> {
                Log.i(TAG, "Stopping Location Tracking Service")
                stopTracking()
            }
            ACTION_START -> {
                Log.i(TAG, "Starting Location Tracking Service")
                startTracking()
            }
            else -> {
                if (prefs.isTracking) {
                    startTracking()
                }
            }
        }

        return START_STICKY
    }

    @SuppressLint("MissingPermission")
    private fun startTracking() {
        prefs.isTracking = true
        _isServiceRunning.value = true

        acquireWakeLock()

        val notification = buildNotification("กำลังเริ่มต้นระบบ GPS...")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        // เชื่อมต่อ Socket.IO
        val vehicleId = prefs.vehicleId
        val token = prefs.vehicleToken
        if (vehicleId > 0) {
            if (token.isNotEmpty()) {
                socketManager.connect(prefs.socketUrl, vehicleId, token)
            } else {
                serviceScope.launch {
                    try {
                        val api = RetrofitClient.getService(prefs.baseUrl)
                        val res = api.authenticateVehicle(null, com.rsu.shuttle.driver.data.model.VehicleAuthRequest(vehicleId = vehicleId))
                        if (res.isSuccessful && res.body() != null) {
                            val newToken = res.body()!!.token
                            prefs.vehicleToken = newToken
                            socketManager.connect(prefs.socketUrl, vehicleId, newToken)
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed to auto-fetch vehicle token: ${e.message}")
                    }
                }
            }
        }

        // เริ่มดึงพิกัด GPS แบบความแม่นยำสูง
        val interval = prefs.updateIntervalMs
        val locationRequest = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, interval)
            .setMinUpdateIntervalMillis(interval / 2)
            .setMinUpdateDistanceMeters(0f)
            .build()

        try {
            fusedLocationClient.requestLocationUpdates(
                locationRequest,
                locationCallback,
                Looper.getMainLooper()
            )
            Log.i(TAG, "Location updates requested at interval ${interval}ms")
        } catch (e: SecurityException) {
            Log.e(TAG, "Missing location permission: ${e.message}")
        }
    }

    private fun onNewLocation(location: Location) {
        val lat = location.latitude
        val lng = location.longitude
        val speedKmh = if (location.hasSpeed()) location.speed * 3.6f else 0f
        val heading = if (location.hasBearing()) location.bearing else 0f

        updateCounter++

        _liveLocation.value = LiveLocationState(
            latitude = lat,
            longitude = lng,
            speedKmh = speedKmh,
            heading = heading,
            updateCount = updateCounter,
            lastUpdated = System.currentTimeMillis()
        )

        val vehicleId = prefs.vehicleId
        val token = prefs.vehicleToken

        if (vehicleId > 0 && token.isNotEmpty()) {
            // 1. ส่งผ่าน Socket.IO (Primary)
            val sentViaSocket = socketManager.emitLocation(
                vehicleId = vehicleId,
                token = token,
                latitude = lat,
                longitude = lng,
                speed = speedKmh,
                heading = heading
            )

            // 2. ถ้า Socket ไม่ติด ให้ส่งผ่าน HTTP REST Fallback
            if (!sentViaSocket) {
                sendHttpFallback(vehicleId, token, lat, lng, speedKmh, heading)
            }
        } else if (vehicleId > 0 && token.isEmpty()) {
            serviceScope.launch {
                try {
                    val api = RetrofitClient.getService(prefs.baseUrl)
                    val res = api.authenticateVehicle(null, com.rsu.shuttle.driver.data.model.VehicleAuthRequest(vehicleId = vehicleId))
                    if (res.isSuccessful && res.body() != null) {
                        val newToken = res.body()!!.token
                        prefs.vehicleToken = newToken
                        socketManager.connect(prefs.socketUrl, vehicleId, newToken)
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Auto-fetch token retry error: ${e.message}")
                }
            }
        }

        updateNotification(
            "ความเร็ว: ${String.format("%.1f", speedKmh)} km/h | อัปเดตครั้งที่ $updateCounter"
        )
    }

    private fun sendHttpFallback(
        vehicleId: Int,
        token: String,
        lat: Double,
        lng: Double,
        speed: Float,
        heading: Float
    ) {
        serviceScope.launch {
            try {
                val api = RetrofitClient.getService(prefs.baseUrl)
                val payload = LocationUpdatePayload(
                    vehicleId = vehicleId,
                    token = token,
                    latitude = lat,
                    longitude = lng,
                    speed = speed,
                    heading = heading
                )
                api.sendLocationHttp(token, payload)
                Log.d(TAG, "Fallback HTTP location update sent")
            } catch (e: Exception) {
                Log.w(TAG, "HTTP Fallback failed: ${e.message}")
            }
        }
    }

    private fun stopTracking() {
        prefs.isTracking = false
        _isServiceRunning.value = false

        try {
            fusedLocationClient.removeLocationUpdates(locationCallback)
        } catch (e: Exception) {
            Log.e(TAG, "Error removing location updates: ${e.message}")
        }

        socketManager.disconnect()
        releaseWakeLock()

        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun acquireWakeLock() {
        if (wakeLock == null) {
            val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "RSUShuttle::LocationWakeLock").apply {
                setReferenceCounted(false)
                acquire(10 * 60 * 1000L) // 10 minutes timeout safety
            }
        }
    }

    private fun releaseWakeLock() {
        try {
            if (wakeLock?.isHeld == true) {
                wakeLock?.release()
            }
        } catch (e: Exception) {
            Log.w(TAG, "Error releasing wake lock: ${e.message}")
        } finally {
            wakeLock = null
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                getString(R.string.notification_channel_name),
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = getString(R.string.notification_channel_desc)
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(contentText: String): Notification {
        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingOpenApp = PendingIntent.getActivity(
            this, 0, openAppIntent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val stopIntent = Intent(this, LocationTrackingService::class.java).apply {
            action = ACTION_STOP
        }
        val pendingStop = PendingIntent.getService(
            this, 1, stopIntent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("${getString(R.string.tracking_notification_title)} (${prefs.vehicleName})")
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentIntent(pendingOpenApp)
            .setOngoing(true)
            .addAction(android.R.drawable.ic_media_pause, getString(R.string.action_stop_tracking), pendingStop)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun updateNotification(contentText: String) {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, buildNotification(contentText))
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
        releaseWakeLock()
        _isServiceRunning.value = false
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        private const val TAG = "LocationTrackingService"
        private const val CHANNEL_ID = "rsu_shuttle_tracking_channel"
        private const val NOTIFICATION_ID = 1001

        const val ACTION_START = "com.rsu.shuttle.driver.ACTION_START"
        const val ACTION_STOP = "com.rsu.shuttle.driver.ACTION_STOP"

        private val _isServiceRunning = MutableStateFlow(false)
        val isServiceRunning: StateFlow<Boolean> = _isServiceRunning.asStateFlow()

        private val _liveLocation = MutableStateFlow(LiveLocationState())
        val liveLocation: StateFlow<LiveLocationState> = _liveLocation.asStateFlow()

        fun start(context: Context) {
            val intent = Intent(context, LocationTrackingService::class.java).apply {
                action = ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, LocationTrackingService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }
    }
}

