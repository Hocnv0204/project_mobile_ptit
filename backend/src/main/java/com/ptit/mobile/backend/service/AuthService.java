package com.ptit.mobile.backend.service;

import com.ptit.mobile.backend.dto.request.auth.LoginRequest;
import com.ptit.mobile.backend.dto.request.auth.RefreshTokenRequest;
import com.ptit.mobile.backend.dto.request.auth.RegisterRequest;
import com.ptit.mobile.backend.dto.request.auth.ResendOtpRequest;
import com.ptit.mobile.backend.dto.request.auth.VerifyOtpRequest;
import com.ptit.mobile.backend.dto.request.auth.ChangePasswordRequest;
import com.ptit.mobile.backend.dto.response.auth.AuthResponse;

public interface AuthService {

   
    void register(RegisterRequest request);

    
    AuthResponse verifyOtp(VerifyOtpRequest request);

    
    void resendOtp(ResendOtpRequest request);

   
    AuthResponse login(LoginRequest request);

   
    AuthResponse refreshToken(RefreshTokenRequest request);

    
    void logout(String refreshToken);

    void logoutAll(Long userId);

    void changePassword(Long userId, ChangePasswordRequest request);
}
