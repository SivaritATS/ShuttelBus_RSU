package com.rsu.shuttle.driver.data.preferences

import android.content.Context
import android.content.SharedPreferences

class AppPreferences(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

    var baseUrl: String
        get() = prefs.getString(KEY_BASE_URL, DEFAULT_BASE_URL) ?: DEFAULT_BASE_URL
        set(value) = prefs.edit().putString(KEY_BASE_URL, value).apply()

    var socketUrl: String
        get() = prefs.getString(KEY_SOCKET_URL, DEFAULT_SOCKET_URL) ?: DEFAULT_SOCKET_URL
        set(value) = prefs.edit().putString(KEY_SOCKET_URL, value).apply()

    var vehicleId: Int
        get() = prefs.getInt(KEY_VEHICLE_ID, -1)
        set(value) = prefs.edit().putInt(KEY_VEHICLE_ID, value).apply()

    var vehicleToken: String
        get() = prefs.getString(KEY_VEHICLE_TOKEN, "") ?: ""
        set(value) = prefs.edit().putString(KEY_VEHICLE_TOKEN, value).apply()

    var vehicleName: String
        get() = prefs.getString(KEY_VEHICLE_NAME, "") ?: ""
        set(value) = prefs.edit().putString(KEY_VEHICLE_NAME, value).apply()

    var driverName: String
        get() = prefs.getString(KEY_DRIVER_NAME, "") ?: ""
        set(value) = prefs.edit().putString(KEY_DRIVER_NAME, value).apply()

    var isTracking: Boolean
        get() = prefs.getBoolean(KEY_IS_TRACKING, false)
        set(value) = prefs.edit().putBoolean(KEY_IS_TRACKING, value).apply()

    var updateIntervalMs: Long
        get() = prefs.getLong(KEY_UPDATE_INTERVAL, 3000L)
        set(value) = prefs.edit().putLong(KEY_UPDATE_INTERVAL, value).apply()

    fun clearSession() {
        prefs.edit()
            .remove(KEY_VEHICLE_TOKEN)
            .remove(KEY_VEHICLE_ID)
            .remove(KEY_VEHICLE_NAME)
            .remove(KEY_DRIVER_NAME)
            .putBoolean(KEY_IS_TRACKING, false)
            .apply()
    }

    companion object {
        private const val PREF_NAME = "rsu_shuttle_driver_prefs"
        const val DEFAULT_BASE_URL = "https://shuttelbus-rsu-backend.onrender.com"
        const val DEFAULT_SOCKET_URL = "https://shuttelbus-rsu-backend.onrender.com"

        private const val KEY_BASE_URL = "base_url"
        private const val KEY_SOCKET_URL = "socket_url"
        private const val KEY_VEHICLE_ID = "vehicle_id"
        private const val KEY_VEHICLE_TOKEN = "vehicle_token"
        private const val KEY_VEHICLE_NAME = "vehicle_name"
        private const val KEY_DRIVER_NAME = "driver_name"
        private const val KEY_IS_TRACKING = "is_tracking"
        private const val KEY_UPDATE_INTERVAL = "update_interval_ms"

        @Volatile
        private var instance: AppPreferences? = null

        fun getInstance(context: Context): AppPreferences {
            return instance ?: synchronized(this) {
                instance ?: AppPreferences(context.applicationContext).also { instance = it }
            }
        }
    }
}

