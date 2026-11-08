package com.rsu.shuttle.driver

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import com.rsu.shuttle.driver.data.preferences.AppPreferences
import com.rsu.shuttle.driver.service.LocationTrackingService
import com.rsu.shuttle.driver.ui.screens.LoginScreen
import com.rsu.shuttle.driver.ui.screens.SettingsScreen
import com.rsu.shuttle.driver.ui.screens.TrackingScreen
import com.rsu.shuttle.driver.ui.theme.BackgroundDark
import com.rsu.shuttle.driver.ui.theme.RSUShuttleDriverTheme

enum class AppScreen {
    LOGIN,
    TRACKING,
    SETTINGS
}

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            RSUShuttleDriverTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = BackgroundDark
                ) {
                    val prefs = remember { AppPreferences.getInstance(this) }
                    var currentScreen by remember {
                        mutableStateOf(
                            if (prefs.vehicleId > 0 && (prefs.vehicleToken.isNotEmpty() || prefs.isTracking)) {
                                AppScreen.TRACKING
                            } else {
                                AppScreen.LOGIN
                            }
                        )
                    }

                    var previousScreen by remember { mutableStateOf(AppScreen.LOGIN) }

                    // Runtime Permission Request for Location & Notifications
                    val permissionsToRequest = mutableListOf(
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION
                    ).apply {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            add(Manifest.permission.POST_NOTIFICATIONS)
                        }
                    }

                    val permissionLauncher = rememberLauncherForActivityResult(
                        contract = ActivityResultContracts.RequestMultiplePermissions()
                    ) { permissions ->
                        val fineLocationGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] ?: false
                        if (!fineLocationGranted) {
                            Toast.makeText(this, "จำเป็นต้องเปิดสิทธิ์พิกัด GPS เพื่อแชร์ตำแหน่งรถบัส", Toast.LENGTH_LONG).show()
                        }
                    }

                    LaunchedEffect(Unit) {
                        val hasLocationPermission = ContextCompat.checkSelfPermission(
                            this@MainActivity,
                            Manifest.permission.ACCESS_FINE_LOCATION
                        ) == PackageManager.PERMISSION_GRANTED

                        if (!hasLocationPermission) {
                            permissionLauncher.launch(permissionsToRequest.toTypedArray())
                        }
                    }

                    when (currentScreen) {
                        AppScreen.LOGIN -> {
                            LoginScreen(
                                onLoginSuccess = {
                                    currentScreen = AppScreen.TRACKING
                                },
                                onOpenSettings = {
                                    previousScreen = AppScreen.LOGIN
                                    currentScreen = AppScreen.SETTINGS
                                }
                            )
                        }

                        AppScreen.TRACKING -> {
                            TrackingScreen(
                                onLogout = {
                                    currentScreen = AppScreen.LOGIN
                                },
                                onOpenSettings = {
                                    previousScreen = AppScreen.TRACKING
                                    currentScreen = AppScreen.SETTINGS
                                }
                            )
                        }

                        AppScreen.SETTINGS -> {
                            BackHandler {
                                currentScreen = previousScreen
                            }
                            SettingsScreen(
                                onBack = {
                                    currentScreen = previousScreen
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}

