package com.rsu.shuttle.driver

import android.app.Application
import android.util.Log
import com.rsu.shuttle.driver.data.preferences.AppPreferences

class RSUShuttleApp : Application() {

    override fun onCreate() {
        super.onCreate()
        Log.i("RSUShuttleApp", "RSU Shuttle Driver Application initialized")
        AppPreferences.getInstance(this)
    }
}

