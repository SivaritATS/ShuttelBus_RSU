package com.rsu.shuttle.driver.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CloudDone
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rsu.shuttle.driver.data.api.RetrofitClient
import com.rsu.shuttle.driver.data.preferences.AppPreferences
import com.rsu.shuttle.driver.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val prefs = remember { AppPreferences.getInstance(context) }
    val scope = rememberCoroutineScope()

    var baseUrl by remember { mutableStateOf(prefs.baseUrl) }
    var socketUrl by remember { mutableStateOf(prefs.socketUrl) }
    var intervalMs by remember { mutableStateOf(prefs.updateIntervalMs.toString()) }

    var testStatus by remember { mutableStateOf<String?>(null) }
    var isTesting by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("ตั้งค่าระบบเชื่อมต่อ", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = TextPrimary)
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
                .padding(20.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "เลือกเซิร์ฟเวอร์ปลายทาง",
                style = MaterialTheme.typography.titleLarge,
                color = TextPrimary
            )

            // Preset Buttons
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = {
                        baseUrl = AppPreferences.DEFAULT_BASE_URL
                        socketUrl = AppPreferences.DEFAULT_SOCKET_URL
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Render Cloud (Direct Neon)")
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = {
                            baseUrl = "http://10.0.2.2:3000"
                            socketUrl = "http://10.0.2.2:3001"
                        },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Local Emulator", fontSize = 12.sp)
                    }

                    OutlinedButton(
                        onClick = {
                            baseUrl = "http://192.168.1.236:3000"
                            socketUrl = "http://192.168.1.236:3001"
                        },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Wi-Fi วงเดียวกับ PC", fontSize = 12.sp)
                    }
                }
            }

            // Base URL Input
            OutlinedTextField(
                value = baseUrl,
                onValueChange = { baseUrl = it },
                label = { Text("Backend REST API URL") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = ShuttleBlue,
                    unfocusedBorderColor = CardBorder,
                    focusedTextColor = TextPrimary,
                    unfocusedTextColor = TextPrimary
                )
            )

            // Socket URL Input
            OutlinedTextField(
                value = socketUrl,
                onValueChange = { socketUrl = it },
                label = { Text("Socket.IO Realtime URL") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = ShuttleBlue,
                    unfocusedBorderColor = CardBorder,
                    focusedTextColor = TextPrimary,
                    unfocusedTextColor = TextPrimary
                )
            )

            // Update Interval Input
            OutlinedTextField(
                value = intervalMs,
                onValueChange = { intervalMs = it },
                label = { Text("ความถี่ในการส่งพิกัด GPS (มิลลิวินาที)") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = ShuttleBlue,
                    unfocusedBorderColor = CardBorder,
                    focusedTextColor = TextPrimary,
                    unfocusedTextColor = TextPrimary
                )
            )

            // Test Connection Button
            OutlinedButton(
                onClick = {
                    scope.launch {
                        isTesting = true
                        testStatus = null
                        try {
                            val api = RetrofitClient.getService(baseUrl.trim())
                            val res = api.checkHealth()
                            if (res.isSuccessful) {
                                testStatus = "✅ เชื่อมต่อสำเร็จ! (${res.body()?.service ?: "Online"})"
                            } else {
                                testStatus = "❌ เซิร์ฟเวอร์ตอบกลับผิดพลาด: HTTP ${res.code()}"
                            }
                        } catch (e: Exception) {
                            testStatus = "❌ เชื่อมต่อไม่ได้: ${e.localizedMessage}"
                        } finally {
                            isTesting = false
                        }
                    }
                },
                enabled = !isTesting,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(10.dp)
            ) {
                if (isTesting) {
                    CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                    Spacer(modifier = Modifier.width(8.dp))
                }
                Text("ทดสอบการเชื่อมต่อ (Test Health Check)")
            }

            if (testStatus != null) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = SurfaceDark)
                ) {
                    Text(
                        text = testStatus ?: "",
                        modifier = Modifier.padding(12.dp),
                        fontSize = 13.sp,
                        color = TextPrimary
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Save Button
            Button(
                onClick = {
                    prefs.baseUrl = baseUrl.trim()
                    prefs.socketUrl = socketUrl.trim()
                    val ms = intervalMs.toLongOrNull() ?: 3000L
                    prefs.updateIntervalMs = ms.coerceAtLeast(1000L)
                    onBack()
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = ShuttleBlue)
            ) {
                Icon(Icons.Default.CloudDone, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("บันทึกการตั้งค่า", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }
        }
    }
}

