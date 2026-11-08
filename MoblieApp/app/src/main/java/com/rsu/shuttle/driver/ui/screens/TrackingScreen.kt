package com.rsu.shuttle.driver.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rsu.shuttle.driver.data.preferences.AppPreferences
import com.rsu.shuttle.driver.data.realtime.SocketManager
import com.rsu.shuttle.driver.data.realtime.SocketState
import com.rsu.shuttle.driver.service.LocationTrackingService
import com.rsu.shuttle.driver.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TrackingScreen(
    onLogout: () -> Unit,
    onOpenSettings: () -> Unit
) {
    val context = LocalContext.current
    val prefs = remember { AppPreferences.getInstance(context) }
    val socketManager = remember { SocketManager.getInstance() }

    val isRunning by LocationTrackingService.isServiceRunning.collectAsState()
    val liveLocation by LocationTrackingService.liveLocation.collectAsState()
    val socketState by socketManager.state.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("สถานะการขับรถ", fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(onClick = onOpenSettings) {
                        Icon(Icons.Default.Settings, contentDescription = "Settings", tint = TextPrimary)
                    }
                    IconButton(onClick = {
                        LocationTrackingService.stop(context)
                        prefs.clearSession()
                        onLogout()
                    }) {
                        Icon(Icons.Default.ExitToApp, contentDescription = "Logout", tint = ShuttleRed)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = BackgroundDark,
                    titleContentColor = TextPrimary
                )
            )
        },
        containerColor = BackgroundDark
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {

                // Status Bar: Vehicle info & Socket state
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceDark)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(
                                text = prefs.vehicleName.ifEmpty { "RSU Shuttle" },
                                style = MaterialTheme.typography.titleLarge,
                                color = TextPrimary
                            )
                            Text(
                                text = "รหัสรถ: #${prefs.vehicleId} | คนขับ: ${prefs.driverName.ifEmpty { "Driver" }}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = TextSecondary
                            )
                        }

                        // Socket indicator
                        val (statusText, statusColor) = when (socketState) {
                            is SocketState.Registered -> "เชื่อมต่อแล้ว" to ShuttleGreen
                            is SocketState.Connected -> "กำลังส่งสัญญาณ" to ShuttleLightBlue
                            is SocketState.Connecting -> "กำลังเชื่อม..." to ShuttleAmber
                            is SocketState.Error -> "ผิดพลาด" to ShuttleRed
                            is SocketState.Disconnected -> if (isRunning) "ออฟไลน์" to ShuttleAmber else "สแตนด์บาย" to TextSecondary
                        }

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .background(statusColor.copy(alpha = 0.15f), RoundedCornerShape(20.dp))
                                .padding(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(statusColor)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = statusText,
                                color = statusColor,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Big Speed Gauge
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (isRunning) ShuttleBlue.copy(alpha = 0.12f) else SurfaceDark
                    ),
                    border = CardDefaults.outlinedCardBorder().copy(
                        brush = androidx.compose.ui.graphics.SolidColor(
                            if (isRunning) ShuttleBlue else CardBorder
                        )
                    )
                ) {
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = if (isRunning) String.format("%.1f", liveLocation.speedKmh) else "0.0",
                            fontSize = 64.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = if (isRunning) ShuttleLightBlue else TextSecondary
                        )
                        Text(
                            text = "กิโลเมตร / ชั่วโมง (km/h)",
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextSecondary
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        if (isRunning) {
                            Text(
                                text = "อัปเดตแล้ว ${liveLocation.updateCount} ครั้ง",
                                color = ShuttleGreen,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // GPS Details Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceDark)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text("ละติจูด (Lat)", color = TextSecondary, fontSize = 12.sp)
                                Text(
                                    text = if (liveLocation.latitude != 0.0) String.format("%.6f", liveLocation.latitude) else "—",
                                    color = TextPrimary,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                            Column {
                                Text("ลองจิจูด (Lng)", color = TextSecondary, fontSize = 12.sp)
                                Text(
                                    text = if (liveLocation.longitude != 0.0) String.format("%.6f", liveLocation.longitude) else "—",
                                    color = TextPrimary,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                            Column {
                                Text("ทิศทาง (Heading)", color = TextSecondary, fontSize = 12.sp)
                                Text(
                                    text = if (isRunning) "${liveLocation.heading.toInt()}°" else "—",
                                    color = TextPrimary,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }

                        if (liveLocation.lastUpdated > 0) {
                            Spacer(modifier = Modifier.height(8.dp))
                            val sdf = remember { SimpleDateFormat("HH:mm:ss", Locale.getDefault()) }
                            Text(
                                text = "พิกัดล่าสุดเมื่อ: ${sdf.format(Date(liveLocation.lastUpdated))}",
                                color = TextSecondary,
                                fontSize = 11.sp
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Background Service Alert Banner
                AnimatedVisibility(visible = isRunning) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = ShuttleGreen.copy(alpha = 0.15f))
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = ShuttleGreen)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "ระบบกำลังแชร์ตำแหน่งในเบื้องหลัง (Background Service Active) คุณสามารถสลับไปใช้แอปอื่นหรือพักหน้าจอได้",
                                color = ShuttleGreen,
                                fontSize = 12.sp
                            )
                        }
                    }
                }
            }

            // Big Start/Stop Button
            Button(
                onClick = {
                    if (isRunning) {
                        LocationTrackingService.stop(context)
                    } else {
                        LocationTrackingService.start(context)
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(64.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isRunning) ShuttleRed else ShuttleGreen
                )
            ) {
                Icon(
                    imageVector = if (isRunning) Icons.Default.Stop else Icons.Default.PlayArrow,
                    contentDescription = null,
                    modifier = Modifier.size(28.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = if (isRunning) "หยุดแชร์ตำแหน่ง (Stop Driving)" else "เริ่มแชร์ตำแหน่ง (Start Driving)",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

