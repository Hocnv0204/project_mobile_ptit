package com.ptit.mobile.backend.controller;

import com.ptit.mobile.backend.dto.request.auth.LoginRequest;
import com.ptit.mobile.backend.dto.request.auth.RefreshTokenRequest;
import com.ptit.mobile.backend.dto.request.auth.RegisterRequest;
import com.ptit.mobile.backend.dto.request.auth.ResendOtpRequest;
import com.ptit.mobile.backend.dto.request.auth.VerifyOtpRequest;
import com.ptit.mobile.backend.dto.request.auth.GoogleAuthRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;
import com.ptit.mobile.backend.dto.response.auth.AuthResponse;
import com.ptit.mobile.backend.exception.BusinessException;
import com.ptit.mobile.backend.exception.ErrorCode;
import com.ptit.mobile.backend.model.User;
import com.ptit.mobile.backend.repository.UserRepository;
import com.ptit.mobile.backend.service.AuthService;
import com.ptit.mobile.backend.service.GoogleAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Đăng ký, xác thực OTP, đăng nhập, Google OAuth2, refresh token, đăng xuất")
public class AuthController {

    private final AuthService       authService;
    private final GoogleAuthService googleAuthService;
    private final UserRepository    userRepository;


    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/auth/register  — Bước 1: Đăng ký, gửi OTP
    // ─────────────────────────────────────────────────────────────────────────

    @Operation(summary = "Bước 1 — Đăng ký tài khoản, gửi OTP về email")
    @PostMapping("/register")
    public ResponseEntity<BaseResponse> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(BaseResponse.builder()
                        .code(201L)
                        .message("Registration successful. Please check your email for the OTP verification code.")
                        .build());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/auth/verify-otp  — Bước 2: Xác thực OTP
    // ─────────────────────────────────────────────────────────────────────────

    @Operation(summary = "Bước 2 — Xác thực OTP, kích hoạt tài khoản và nhận tokens")
    @PostMapping("/verify-otp")
    public BaseResponse verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        AuthResponse authResponse = authService.verifyOtp(request);
        return BaseResponse.success(authResponse);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/auth/resend-otp  — Gửi lại OTP
    // ─────────────────────────────────────────────────────────────────────────

    @Operation(summary = "Gửi lại mã OTP (giới hạn 60 giây/lần)")
    @PostMapping("/resend-otp")
    public BaseResponse resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        authService.resendOtp(request);
        return BaseResponse.builder()
                .code(200L)
                .message("A new OTP has been sent to your email.")
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/auth/login
    // ─────────────────────────────────────────────────────────────────────────

    @Operation(summary = "Đăng nhập bằng username và mật khẩu")
    @PostMapping("/login")
    public BaseResponse login(@Valid @RequestBody LoginRequest request) {
        AuthResponse authResponse = authService.login(request);
        return BaseResponse.success(authResponse);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/auth/google  — Đăng nhập / đăng ký bằng Google
    // ─────────────────────────────────────────────────────────────────────────

    @Operation(
        summary = "Đăng nhập bằng Google (dành cho Android)",
        description = "Gửi Google ID Token nhận từ Google Sign-In SDK. " +
                      "Backend sẽ verify token, tự động tạo tài khoản nếu lần đầu đăng nhập."
    )
    @PostMapping("/google")
    public BaseResponse loginWithGoogle(@Valid @RequestBody GoogleAuthRequest request) {
        AuthResponse authResponse = googleAuthService.loginWithGoogle(request.getIdToken());
        return BaseResponse.success(authResponse);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/auth/refresh

    // ─────────────────────────────────────────────────────────────────────────

    @Operation(summary = "Làm mới accessToken bằng refreshToken")
    @PostMapping("/refresh")
    public BaseResponse refresh(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse authResponse = authService.refreshToken(request);
        return BaseResponse.success(authResponse);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/auth/logout
    // ─────────────────────────────────────────────────────────────────────────

    @Operation(summary = "Đăng xuất (thu hồi refreshToken)")
    @PostMapping("/logout")
    public BaseResponse logout(@Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request.getRefreshToken());
        return BaseResponse.builder().code(200L).message("Logged out successfully").build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/auth/logout-all
    // ─────────────────────────────────────────────────────────────────────────

    @Operation(summary = "Đăng xuất tất cả thiết bị", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/logout-all")
    public BaseResponse logoutAll() {
        Long userId = getCurrentUserId();
        authService.logoutAll(userId);
        return BaseResponse.builder().code(200L).message("Logged out from all devices").build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/auth/me
    // ─────────────────────────────────────────────────────────────────────────

    @Operation(summary = "Lấy thông tin user đang đăng nhập", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/me")
    public BaseResponse getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        AuthResponse.UserInfo userInfo = AuthResponse.UserInfo.builder()
                .id(user.getId()).email(user.getEmail())
                .username(user.getUsername()).fullName(user.getFullName())
                .build();
        return BaseResponse.success(userInfo);
    }

    // ─────────────────────────────────────────────────────────────────────────

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getDetails() == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return (Long) auth.getDetails();
    }
}
