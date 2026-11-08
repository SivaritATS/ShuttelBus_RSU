package com.rsu.shuttle.driver.data.api

import com.rsu.shuttle.driver.data.model.*
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST

interface DriverApiService {

    @POST("/api/auth/login")
    suspend fun login(
        @Body body: LoginRequest
    ): Response<LoginResponse>

    @POST("/api/auth/vehicle")
    suspend fun authenticateVehicle(
        @Header("Authorization") authHeader: String?,
        @Body body: VehicleAuthRequest
    ): Response<VehicleAuthResponse>

    @POST("/api/vehicles/location")
    suspend fun sendLocationHttp(
        @Header("x-vehicle-token") vehicleToken: String,
        @Body body: LocationUpdatePayload
    ): Response<Map<String, Any>>

    @GET("/health")
    suspend fun checkHealth(): Response<HealthResponse>
}

