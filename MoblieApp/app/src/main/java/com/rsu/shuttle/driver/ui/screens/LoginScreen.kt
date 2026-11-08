package com.rsu.shuttle.driver.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rsu.shuttle.driver.data.api.RetrofitClient
import com.rsu.shuttle.driver.data.model.LoginRequest
import com.rsu.shuttle.driver.data.model.VehicleAuthRequest
import com.rsu.shuttle.driver.data.preferences.AppPreferences
import com.rsu.shuttle.driver.ui.theme.*
import kotlinx.coroutines.launch

data class VehicleOption(
    val id: Int,
    val name: String,
    val type: String = "",
    val routeName: String = ""
)

private val DEFAULT_VEHICLES = listOf(
    VehicleOption(1, "RSU Shuttle 01 (รถรางไฟฟ้า 1)", "Electric Tram", "สาย Main Campus Loop"),
    VehicleOption(2, "RSU Shuttle 02 (รถรางไฟฟ้า 2)", "Electric Tram", "สาย North-South Line"),
    VehicleOption(3, "RSU Shuttle 03 (รถมินิบัสรับส่ง)", "Mini Bus", "สาย Special Express")
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    onOpenSettings: () -> Unit
) {
    val context = LocalContext.current
    val prefs = remember { AppPreferences.getInstance(context) }
    val scope = rememberCoroutineScope()
    val focusManager = LocalFocusManager.current

    // ฟิลด์ผู้ใช้งานและรหัสผ่านเริ่มต้นเป็นค่าว่าง
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isPasswordVisible by remember { mutableStateOf(false) }

    // รายการรถดึงจากดาต้าเบส
    var vehicleList by remember { mutableStateOf(DEFAULT_VEHICLES) }
    var selectedVehicle by remember {
        mutableStateOf(
            DEFAULT_VEHICLES.find { it.id == prefs.vehicleId } ?: DEFAULT_VEHICLES.first()
        )
    }
    var isDropdownExpanded by remember { mutableStateOf(false) }

    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    // ดึงรายชื่อรถจากฐานข้อมูลเซิร์ฟเวอร์แบบอัตโนมัติ
    LaunchedEffect(Unit) {
        try {
            val api = RetrofitClient.getService(prefs.baseUrl)
            val res = api.getVehicles()
            if (res.isSuccessful && !res.body().isNullOrEmpty()) {
                val fetched = res.body()!!.map { v ->
                    VehicleOption(
                        id = v.id,
                        name = v.name,
                        type = v.type ?: "",
                        routeName = v.route?.name ?: ""
                    )
                }
                vehicleList = fetched
                selectedVehicle = fetched.find { it.id == prefs.vehicleId } ?: fetched.first()
            }
        } catch (_: Exception) {
            // ใช้ fallback เริ่มต้นถ้าติดต่อเซิร์ฟเวอร์ยังไม่ได้
        }
    }

    val handleLogin: () -> Unit = {
        if (username.isBlank() || password.isBlank()) {
            errorMessage = "กรุณากรอก username และ password ให้ครบถ้วน"
        } else {
            scope.launch {
                isLoading = true
                errorMessage = null
                try {
                    val api = RetrofitClient.getService(prefs.baseUrl)
                    val loginRes = api.login(LoginRequest(username.trim(), password.trim()))

                    if (loginRes.isSuccessful && loginRes.body() != null) {
                        val user = loginRes.body()!!.user
                        prefs.driverName = user.username

                        // เชื่อมโยงรถที่คนขับเลือกจากดรอปดาวน์
                        val targetVehicleId = selectedVehicle.id
                        val tokenRes = api.authenticateVehicle(
                            authHeader = null,
                            body = VehicleAuthRequest(vehicleId = targetVehicleId)
                        )

                        if (tokenRes.isSuccessful && tokenRes.body() != null) {
                            val vData = tokenRes.body()!!
                            prefs.vehicleId = vData.vehicle.id
                            prefs.vehicleToken = vData.token
                            prefs.vehicleName = vData.vehicle.name
                        } else {
                            // บันทึก ID รถและชื่อรถที่เลือกไว้
                            prefs.vehicleId = targetVehicleId
                            prefs.vehicleName = selectedVehicle.name
                        }

                        onLoginSuccess()
                    } else {
                        errorMessage = "username หรือ password ไม่ถูกต้อง"
                    }
                } catch (e: Exception) {
                    errorMessage = "ไม่สามารถเชื่อมต่อระบบได้: ${e.localizedMessage ?: "เครือข่ายขัดข้อง"}"
                } finally {
                    isLoading = false
                }
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(10.dp)
                                .clip(CircleShape)
                                .background(ShuttleGreen)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "RSU Shuttle Driver",
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp,
                            color = TextPrimary
                        )
                    }
                },
                actions = {
                    IconButton(onClick = onOpenSettings) {
                        Icon(
                            Icons.Default.Settings,
                            contentDescription = "Settings",
                            tint = TextSecondary
                        )
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
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 24.dp, vertical = 16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                // Header Badge & App Title
                Box(
                    modifier = Modifier
                        .size(80.dp)
                        .clip(RoundedCornerShape(24.dp))
                        .background(
                            Brush.linearGradient(
                                colors = listOf(ShuttleBlue, ShuttleLightBlue)
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.DirectionsBus,
                        contentDescription = "RSU Shuttle",
                        tint = Color.White,
                        modifier = Modifier.size(44.dp)
                    )
                }

                Spacer(modifier = Modifier.height(18.dp))

                Text(
                    text = "เข้าสู่ระบบคนขับรถ",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )

                Text(
                    text = "ระบบติดตามรถราง มหาวิทยาลัยรังสิต",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary,
                    modifier = Modifier.padding(top = 4.dp)
                )

                Spacer(modifier = Modifier.height(28.dp))

                // Card Container สำหรับฟอร์มล็อกอิน
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                    border = CardDefaults.outlinedCardBorder().copy(
                        brush = Brush.verticalGradient(
                            listOf(CardBorder, CardBorder.copy(alpha = 0.3f))
                        )
                    )
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp)
                    ) {
                        // 1. ดรอปดาวน์เลือกรถประจำคันที่จะขับ
                        Text(
                            text = "เลือกรถประจำคันที่จะขับ",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = TextPrimary
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        ExposedDropdownMenuBox(
                            expanded = isDropdownExpanded,
                            onExpandedChange = { isDropdownExpanded = !isDropdownExpanded },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            OutlinedTextField(
                                value = selectedVehicle.name,
                                onValueChange = {},
                                readOnly = true,
                                trailingIcon = {
                                    ExposedDropdownMenuDefaults.TrailingIcon(expanded = isDropdownExpanded)
                                },
                                leadingIcon = {
                                    Icon(
                                        Icons.Default.DirectionsBus,
                                        contentDescription = null,
                                        tint = ShuttleLightBlue
                                    )
                                },
                                modifier = Modifier
                                    .menuAnchor()
                                    .fillMaxWidth(),
                                shape = RoundedCornerShape(14.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = ShuttleBlue,
                                    unfocusedBorderColor = CardBorder,
                                    focusedTextColor = TextPrimary,
                                    unfocusedTextColor = TextPrimary,
                                    focusedContainerColor = BackgroundDark.copy(alpha = 0.5f),
                                    unfocusedContainerColor = BackgroundDark.copy(alpha = 0.5f)
                                )
                            )

                            ExposedDropdownMenu(
                                expanded = isDropdownExpanded,
                                onDismissRequest = { isDropdownExpanded = false },
                                modifier = Modifier
                                    .background(SurfaceDark)
                                    .border(1.dp, CardBorder, RoundedCornerShape(12.dp))
                            ) {
                                vehicleList.forEach { option ->
                                    DropdownMenuItem(
                                        text = {
                                            Column {
                                                Text(
                                                    text = option.name,
                                                    fontWeight = if (option.id == selectedVehicle.id) FontWeight.Bold else FontWeight.Normal,
                                                    color = if (option.id == selectedVehicle.id) ShuttleLightBlue else TextPrimary,
                                                    fontSize = 14.sp
                                                )
                                                if (option.routeName.isNotEmpty() || option.type.isNotEmpty()) {
                                                    Text(
                                                        text = "${option.type.ifEmpty { "รถรับส่ง" }} · ${option.routeName.ifEmpty { "ทั่วไป" }}",
                                                        fontSize = 12.sp,
                                                        color = TextSecondary
                                                    )
                                                }
                                            }
                                        },
                                        leadingIcon = {
                                            Icon(
                                                Icons.Default.DirectionsTransit,
                                                contentDescription = null,
                                                tint = if (option.id == selectedVehicle.id) ShuttleLightBlue else TextSecondary
                                            )
                                        },
                                        onClick = {
                                            selectedVehicle = option
                                            isDropdownExpanded = false
                                        },
                                        contentPadding = ExposedDropdownMenuDefaults.ItemContentPadding
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(18.dp))

                        // 2. ฟิลด์ Username
                        Text(
                            text = "ผู้ใช้งาน",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = TextPrimary
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        OutlinedTextField(
                            value = username,
                            onValueChange = {
                                username = it
                                errorMessage = null
                            },
                            placeholder = {
                                Text("username", color = TextSecondary.copy(alpha = 0.6f))
                            },
                            leadingIcon = {
                                Icon(Icons.Default.Person, contentDescription = null, tint = ShuttleLightBlue)
                            },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Text,
                                imeAction = ImeAction.Next
                            ),
                            keyboardActions = KeyboardActions(
                                onNext = { focusManager.moveFocus(FocusDirection.Down) }
                            ),
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(14.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = ShuttleBlue,
                                unfocusedBorderColor = CardBorder,
                                focusedTextColor = TextPrimary,
                                unfocusedTextColor = TextPrimary,
                                focusedContainerColor = BackgroundDark.copy(alpha = 0.5f),
                                unfocusedContainerColor = BackgroundDark.copy(alpha = 0.5f)
                            )
                        )

                        Spacer(modifier = Modifier.height(18.dp))

                        // 3. ฟิลด์ Password
                        Text(
                            text = "พาสเวิร์ด",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = TextPrimary
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        OutlinedTextField(
                            value = password,
                            onValueChange = {
                                password = it
                                errorMessage = null
                            },
                            placeholder = {
                                Text("password", color = TextSecondary.copy(alpha = 0.6f))
                            },
                            leadingIcon = {
                                Icon(Icons.Default.Lock, contentDescription = null, tint = ShuttleLightBlue)
                            },
                            trailingIcon = {
                                IconButton(onClick = { isPasswordVisible = !isPasswordVisible }) {
                                    Icon(
                                        imageVector = if (isPasswordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                        contentDescription = "Toggle password visibility",
                                        tint = TextSecondary
                                    )
                                }
                            },
                            visualTransformation = if (isPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Password,
                                imeAction = ImeAction.Done
                            ),
                            keyboardActions = KeyboardActions(
                                onDone = {
                                    focusManager.clearFocus()
                                    handleLogin()
                                }
                            ),
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(14.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = ShuttleBlue,
                                unfocusedBorderColor = CardBorder,
                                focusedTextColor = TextPrimary,
                                unfocusedTextColor = TextPrimary,
                                focusedContainerColor = BackgroundDark.copy(alpha = 0.5f),
                                unfocusedContainerColor = BackgroundDark.copy(alpha = 0.5f)
                            )
                        )

                        // แสดงข้อความข้อผิดพลาดถ้ามี
                        AnimatedVisibility(visible = errorMessage != null) {
                            Card(
                                colors = CardDefaults.cardColors(containerColor = ShuttleRed.copy(alpha = 0.15f)),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 16.dp)
                            ) {
                                Row(
                                    modifier = Modifier.padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        Icons.Default.ErrorOutline,
                                        contentDescription = null,
                                        tint = ShuttleRed,
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = errorMessage ?: "",
                                        color = ShuttleRed,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Medium
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        // ปุ่มเข้าสู่ระบบ
                        Button(
                            onClick = handleLogin,
                            enabled = !isLoading,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(54.dp),
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = ShuttleBlue
                            )
                        ) {
                            if (isLoading) {
                                CircularProgressIndicator(
                                    color = Color.White,
                                    modifier = Modifier.size(24.dp),
                                    strokeWidth = 2.5.dp
                                )
                                Spacer(modifier = Modifier.width(10.dp))
                                Text(
                                    text = "กำลังตรวจสอบสิทธิ์…",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            } else {
                                Icon(
                                    Icons.Default.Login,
                                    contentDescription = null,
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "เข้าสู่ระบบ",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // ท้ายหน้าจอ
                Text(
                    text = "มหาวิทยาลัยรังสิต · Rangsit University",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary.copy(alpha = 0.7f)
                )
            }
        }
    }
}
