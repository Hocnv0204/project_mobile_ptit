package com.ptit.mobile.backend.dto.request.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleAuthRequest {

    /**
     * Google ID Token nhận được từ Google Sign-In SDK trên Android.
     * Client gửi token này lên backend để xác thực.
     */
    @NotBlank(message = "Google ID token is required")
    private String idToken;
}
