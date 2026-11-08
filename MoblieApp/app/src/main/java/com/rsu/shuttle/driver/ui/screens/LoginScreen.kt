package com.rsu.shuttle.driver.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DirectionsBus
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rsu.shuttle.driver.data.api.RetrofitClient
import com.rsu.shuttle.driver.data.model.LoginRequest
import com.rsu.shuttle.driver.data.model.VehicleAuthRequest
import com.rsu.shuttle.driver.data.preferences.AppPreferences
import com.rsu.shuttle.driver.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    onOpenSettings: () -> Unit
) {
    val context = LocalContext.current
    val prefs = remember { AppPreferences.getInstance(context) }
    val scope = rememberCoroutineScope()

    var username by remember { mutableStateOf(prefs.driverName.ifEmpty { "driver1" }) }
    var password by remember { mutableStateOf("") }
    var vehicleIdInput by remember { mutableStateOf(if (prefs.vehicleId > 0) prefs.vehicleId.toString() else "1") }
    var vehicleTokenInput by remember { mutableStateOf(prefs.vehicleToken) }

    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var isQuickMode by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("RSU Shuttle Driver", fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(onClick = onOpenSettings) {
                        Icon(Icons.Default.Settings, contentDescription = "Settings", tint = TextPrimary)
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
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = Icons.Default.DirectionsBus,
                contentDescription = "Bus",
                tint = ShuttleLightBlue,
                modifier = Modifier.size(72.dp)
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "เข้าสู่ระบบคนขับรถ",
                style = MaterialTheme.typography.headlineMedium,
                color = TextPrimary
            )

            Text(
                text = "แชร์ตำแหน่งรถบัส ม.รังสิต แบบ Realtime",
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary
            )

            Spacer(modifier = Modifier.height(28.dp))

            // โหมดสลับระหว่าง ล็อกอินปกติ กับ ใส่ Vehicle Token ตรงๆ
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SurfaceDark, RoundedCornerShape(12.dp))
                    .padding(4.dp),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                FilterChip(
                    selected = !isQuickMode,
                    onClick = { isQuickMode = false },
                    label = { Text("ล็อกอินคนขับ") }
                )
                FilterChip(
                    selected = isQuickMode,
                    onClick = { isQuickMode = true },
                    label = { Text("ระบุ Token รถโดยตรง") }
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            if (!isQuickMode) {
                // Username
                OutlinedTextField(
                    value = username,
                    onValueChange = { username = it },
                    label = { Text("ชื่อผู้ใช้งาน (Username)") },
                    leadingIcon = { Icon(Icons.Default.Person, contentDescription = null) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = ShuttleBlue,
                        unfocusedBorderColor = CardBorder,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Password
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("รหัสผ่าน (Password)") },
                    leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null) },
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = ShuttleBlue,
                        unfocusedBorderColor = CardBorder,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                // เลือกรถด่วน
                Text(
                    text = "เลือกรถประจำคันที่จะขับ:",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(4.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = vehicleIdInput == "1",
                        onClick = { vehicleIdInput = "1" },
                        label = { Text("#1 รถราง 1", fontSize = 12.sp) },
                        modifier = Modifier.weight(1f)
                    )
                    FilterChip(
                        selected = vehicleIdInput == "2",
                        onClick = { vehicleIdInput = "2" },
                        label = { Text("#2 รถราง 2", fontSize = 12.sp) },
                        modifier = Modifier.weight(1f)
                    )
                    FilterChip(
                        selected = vehicleIdInput == "3",
                        onClick = { vehicleIdInput = "3" },
                        label = { Text("#3 มินิบัส 3", fontSize = 12.sp) },
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Vehicle ID
                OutlinedTextField(
                    value = vehicleIdInput,
                    onValueChange = { vehicleIdInput = it },
                    label = { Text("หมายเลขรถประจำคัน (Vehicle ID)") },
                    leadingIcon = { Icon(Icons.Default.DirectionsBus, contentDescription = null) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = ShuttleBlue,
                        unfocusedBorderColor = CardBorder,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    )
                )
            } else {
                // Quick Mode: Vehicle ID + Token
                OutlinedTextField(
                    value = vehicleIdInput,
                    onValueChange = { vehicleIdInput = it },
                    label = { Text("Vehicle ID (เช่น 1)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = ShuttleBlue,
                        unfocusedBorderColor = CardBorder,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = vehicleTokenInput,
                    onValueChange = { vehicleTokenInput = it },
                    label = { Text("Vehicle Signed Token") },
                    singleLine = false,
                    maxLines = 3,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = ShuttleBlue,
                        unfocusedBorderColor = CardBorder,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    )
                )
            }

            if (errorMessage != null) {
                Spacer(modifier = Modifier.height(12.dp))
                Card(
                    colors = CardDefaults.cardColors(containerColor = ShuttleRed.copy(alpha = 0.15f)),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = errorMessage ?: "",
                        color = ShuttleRed,
                        fontSize = 13.sp,
                        modifier = Modifier.padding(12.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            Button(
                onClick = {
                    val vid = vehicleIdInput.toIntOrNull() ?: 1
                    if (isQuickMode) {
                        if (vehicleTokenInput.isBlank()) {
                            errorMessage = "กรุณากรอก Vehicle Token"
                            return@Button
                        }
                        prefs.vehicleId = vid
                        prefs.vehicleToken = vehicleTokenInput.trim()
                        prefs.vehicleName = "RSU Shuttle #$vid"
                        onLoginSuccess()
                    } else {
                        // ดำเนินการล็อกอินผ่าน API
                        scope.launch {
                            isLoading = true
                            errorMessage = null
                            try {
                                val api = RetrofitClient.getService(prefs.baseUrl)
                                val loginRes = api.login(LoginRequest(username.trim(), password.trim()))

                                if (loginRes.isSuccessful && loginRes.body() != null) {
                                    val user = loginRes.body()!!.user
                                    prefs.driverName = user.username

                                    // เรียกขอ Vehicle Token
                                    val tokenRes = api.authenticateVehicle(
                                        authHeader = null,
                                        body = VehicleAuthRequest(vehicleId = vid)
                                    )

                                    if (tokenRes.isSuccessful && tokenRes.body() != null) {
                                        val vData = tokenRes.body()!!
                                        prefs.vehicleId = vData.vehicle.id
                                        prefs.vehicleToken = vData.token
                                        prefs.vehicleName = vData.vehicle.name
                                        onLoginSuccess()
                                    } else {
                                        // ถ้าขอ vehicle token ไม่ผ่าน อาจใช้ ID แล้วข้ามไปหน้า Tracking ได้เลย (fallback)
                                        prefs.vehicleId = vid
                                        prefs.vehicleName = "RSU Shuttle #$vid"
                                        onLoginSuccess()
                                    }
                                } else {
                                    val err = loginRes.errorBody()?.string() ?: "เข้าสู่ระบบไม่สำเร็จ"
                                    errorMessage = err
                                }
                            } catch (e: Exception) {
                                errorMessage = "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้: ${e.localizedMessage}"
                            } finally {
                                isLoading = false
                            }
                        }
                    }
                },
                enabled = !isLoading,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = ShuttleBlue)
            ) {
                if (isLoading) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                } else {
                    Text(
                        text = if (isQuickMode) "บันทึกและเข้าสู่หน้าแชร์พิกัด" else "เข้าสู่ระบบ",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

