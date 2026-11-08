package com.rsu.shuttle.driver.data.model

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    @SerializedName("username") val username: String,
    @SerializedName("password") val password: String
)

data class LoginResponse(
    @SerializedName("user") val user: UserDto
)

data class UserDto(
    @SerializedName("id") val id: Int,
    @SerializedName("username") val username: String,
    @SerializedName("role") val role: String
)

data class VehicleAuthRequest(
    @SerializedName("vehicleId") val vehicleId: Int? = null,
    @SerializedName("name") val name: String? = null
)

data class VehicleAuthResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("token") val token: String,
    @SerializedName("vehicle") val vehicle: VehicleDto
)

data class VehicleDto(
    @SerializedName("id") val id: Int,
    @SerializedName("name") val name: String,
    @SerializedName("type") val type: String,
    @SerializedName("routeId") val routeId: Int?,
    @SerializedName("route") val route: RouteDto?,
    @SerializedName("isActive") val isActive: Boolean
)

data class RouteDto(
    @SerializedName("id") val id: Int,
    @SerializedName("name") val name: String,
    @SerializedName("color") val color: String?
)

data class LocationUpdatePayload(
    @SerializedName("vehicleId") val vehicleId: Int,
    @SerializedName("token") val token: String,
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double,
    @SerializedName("speed") val speed: Float? = null,
    @SerializedName("heading") val heading: Float? = null,
    @SerializedName("tripId") val tripId: Int? = null
)

data class HealthResponse(
    @SerializedName("status") val status: String,
    @SerializedName("service") val service: String?
)

