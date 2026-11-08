package com.rsu.shuttle.driver.data.realtime

import android.util.Log
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONObject

sealed class SocketState {
    object Disconnected : SocketState()
    object Connecting : SocketState()
    object Connected : SocketState()
    data class Registered(val vehicleId: Int) : SocketState()
    data class Error(val message: String) : SocketState()
}

class SocketManager {

    private var socket: Socket? = null
    private val _state = MutableStateFlow<SocketState>(SocketState.Disconnected)
    val state: StateFlow<SocketState> = _state.asStateFlow()

    private var currentVehicleId: Int = -1
    private var currentToken: String = ""

    fun connect(serverUrl: String, vehicleId: Int, token: String) {
        if (socket?.connected() == true && currentVehicleId == vehicleId) {
            Log.d(TAG, "Socket already connected for vehicleId: $vehicleId")
            return
        }

        disconnect()

        currentVehicleId = vehicleId
        currentToken = token
        _state.value = SocketState.Connecting

        try {
            val options = IO.Options().apply {
                transports = arrayOf("websocket", "polling")
                reconnection = true
                reconnectionAttempts = 20
                reconnectionDelay = 2000
                timeout = 15000
                forceNew = true
            }

            val socketInstance = IO.socket(serverUrl, options)
            socket = socketInstance

            socketInstance.on(Socket.EVENT_CONNECT) {
                Log.i(TAG, "Socket connected: ${socketInstance.id()}")
                _state.value = SocketState.Connected
                // ส่ง event ลงทะเบียนประจำคัน
                registerVehicle(vehicleId, token)
            }

            socketInstance.on(Socket.EVENT_DISCONNECT) { args ->
                val reason = args.firstOrNull()?.toString() ?: "unknown"
                Log.w(TAG, "Socket disconnected: $reason")
                _state.value = SocketState.Disconnected
            }

            socketInstance.on(Socket.EVENT_CONNECT_ERROR) { args ->
                val err = args.firstOrNull()?.toString() ?: "Connection error"
                Log.e(TAG, "Socket connection error: $err")
                _state.value = SocketState.Error(err)
            }

            socketInstance.on("vehicle:registered") { args ->
                Log.i(TAG, "Vehicle successfully registered on socket: ID $vehicleId")
                _state.value = SocketState.Registered(vehicleId)
            }

            socketInstance.on("vehicle:error") { args ->
                val errorMsg = (args.firstOrNull() as? JSONObject)?.optString("message") ?: "Vehicle registration error"
                Log.e(TAG, "Vehicle registration error: $errorMsg")
                _state.value = SocketState.Error(errorMsg)
            }

            socketInstance.on("vehicle:location:error") { args ->
                val errorMsg = (args.firstOrNull() as? JSONObject)?.optString("message") ?: "Location update rejected"
                Log.w(TAG, "Location error from server: $errorMsg")
            }

            socketInstance.connect()

        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize socket: ${e.message}", e)
            _state.value = SocketState.Error(e.message ?: "Failed to connect")
        }
    }

    private fun registerVehicle(vehicleId: Int, token: String) {
        val payload = JSONObject().apply {
            put("vehicleId", vehicleId)
            put("token", token)
        }
        socket?.emit("vehicle:register", payload)
        Log.d(TAG, "Emitted vehicle:register for ID $vehicleId")
    }

    fun emitLocation(
        vehicleId: Int,
        token: String,
        latitude: Double,
        longitude: Double,
        speed: Float? = null,
        heading: Float? = null,
        tripId: Int? = null
    ): Boolean {
        val s = socket
        if (s == null || !s.connected()) {
            return false
        }

        val json = JSONObject().apply {
            put("vehicleId", vehicleId)
            put("token", token)
            put("latitude", latitude)
            put("longitude", longitude)
            if (speed != null) put("speed", speed)
            if (heading != null) put("heading", heading)
            if (tripId != null) put("tripId", tripId)
        }

        s.emit("vehicle:location:update", json)
        Log.d(TAG, "Sent GPS update: ($latitude, $longitude), speed: $speed km/h")
        return true
    }

    fun disconnect() {
        try {
            socket?.off()
            socket?.disconnect()
            socket?.close()
        } catch (e: Exception) {
            Log.e(TAG, "Error closing socket: ${e.message}")
        } finally {
            socket = null
            _state.value = SocketState.Disconnected
        }
    }

    companion object {
        private const val TAG = "SocketManager"

        @Volatile
        private var instance: SocketManager? = null

        fun getInstance(): SocketManager {
            return instance ?: synchronized(this) {
                instance ?: SocketManager().also { instance = it }
            }
        }
    }
}

