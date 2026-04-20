package com.ptit.mobile.backend.service.impl;

import com.ptit.mobile.backend.dto.request.auth.LoginRequest;
import com.ptit.mobile.backend.dto.request.auth.RefreshTokenRequest;
import com.ptit.mobile.backend.dto.request.auth.RegisterRequest;
import com.ptit.mobile.backend.dto.request.auth.ResendOtpRequest;
import com.ptit.mobile.backend.dto.request.auth.VerifyOtpRequest;
import com.ptit.mobile.backend.dto.response.auth.AuthResponse;
import com.ptit.mobile.backend.exception.BusinessException;
import com.ptit.mobile.backend.exception.ErrorCode;
import com.ptit.mobile.backend.model.Role;
import com.ptit.mobile.backend.model.User;
import com.ptit.mobile.backend.model.UserCredential;
import com.ptit.mobile.backend.model.UserRole;
import com.ptit.mobile.backend.repository.*;
import com.ptit.mobile.backend.security.JwtTokenProvider;
import com.ptit.mobile.backend.service.AuthService;
import com.ptit.mobile.backend.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final String DEFAULT_ROLE          = "ROLE_USER";
    private static final long   OTP_RESEND_COOLDOWN_MS = 60_000L; // 60 giây

    private final UserRepository           userRepository;
    private final UserCredentialRepository userCredentialRepository;
    private final UserRoleRepository       userRoleRepository;
    private final RoleRepository           roleRepository;
    private final RedisTokenRepository     redisTokenRepository;
    private final RedisOtpRepository       redisOtpRepository;
    private final JwtTokenProvider         jwtTokenProvider;
    private final PasswordEncoder          passwordEncoder;
    private final EmailService             emailService;

    @Value("${otp.expiration}")
    private long otpExpirationMs;

    @Value("${otp.length}")
    private int otpLength;



    @Override
    @Transactional
    public void register(RegisterRequest request) {
        // 1. Kiểm tra email đã tồn tại chưa
        if (userRepository.existsByEmail(request.getEmail())) {
            // Nếu email tồn tại nhưng chưa xác thực → cho phép gửi lại OTP
            userRepository.findByEmail(request.getEmail()).ifPresent(existing -> {
                if (Boolean.FALSE.equals(existing.getIsEmailVerified())) {
                    sendOtpToEmail(existing.getEmail(), existing.getFullName());
                    throw new BusinessException(ErrorCode.REGISTRATION_PENDING);
                }
            });
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        // 2. Kiểm tra username trùng (nếu có)
        if (request.getUsername() != null && !request.getUsername().isBlank()
                && userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException(ErrorCode.USERNAME_ALREADY_EXISTS);
        }

        // 3. Tạo User (chưa kích hoạt, chưa xác thực email)
        User user = User.builder()
                .email(request.getEmail())
                .username(request.getUsername())
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .dateBirth(request.getDateBirth())
                .isActive(false)        // ← chưa kích hoạt cho đến khi xác thực OTP
                .isEmailVerified(false)
                .deleteFlag(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        user = userRepository.save(user);

        // 4. Lưu password hash
        final Long userId = user.getId();
        UserCredential credential = UserCredential.builder()
                .userId(userId)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .updatedAt(LocalDateTime.now())
                .build();
        userCredentialRepository.save(credential);

        // 5. Gửi OTP về email
        sendOtpToEmail(user.getEmail(), user.getFullName());
        log.info("User registered (pending OTP): email={}", user.getEmail());
    }

  

    @Override
    @Transactional
    public AuthResponse verifyOtp(VerifyOtpRequest request) {
        String email    = request.getEmail().trim().toLowerCase();
        String inputOtp = request.getOtp().trim();

        // 1. Tìm user theo email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 2. Kiểm tra đã xác thực chưa
        if (Boolean.TRUE.equals(user.getIsEmailVerified())) {
            throw new BusinessException(ErrorCode.USER_ALREADY_VERIFIED);
        }

        // 3. Lấy OTP từ Redis
        String storedOtp = redisOtpRepository.getOtp(email);
        if (storedOtp == null) {
            throw new BusinessException(ErrorCode.OTP_EXPIRED);
        }

        // 4. So sánh OTP
        if (!storedOtp.equals(inputOtp)) {
            throw new BusinessException(ErrorCode.OTP_INVALID);
        }

        // 5. Kích hoạt tài khoản
        user.setIsActive(true);
        user.setIsEmailVerified(true);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        // 6. Xóa OTP đã dùng khỏi Redis
        redisOtpRepository.deleteOtp(email);

        // 7. Assign ROLE_USER
        assignDefaultRole(user.getId());

        // 8. Tạo và trả về tokens
        List<String> roles = getUserRoles(user.getId());
        log.info("User email verified and account activated: email={}", email);
        return buildAuthResponse(user, roles);
    }

 

    @Override
    public void resendOtp(ResendOtpRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (Boolean.TRUE.equals(user.getIsEmailVerified())) {
            throw new BusinessException(ErrorCode.USER_ALREADY_VERIFIED);
        }

        if (redisOtpRepository.isResendOnCooldown(email)) {
            throw new BusinessException(ErrorCode.OTP_RESEND_TOO_SOON);
        }

        sendOtpToEmail(email, user.getFullName());
        log.info("OTP resent for email={}", email);
    }

  

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        // 1. Tìm user theo username
        User user = userRepository.findByUsername(request.getUsername().trim())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));

        // 2. Kiểm tra email đã xác thực chưa
        if (Boolean.FALSE.equals(user.getIsEmailVerified())) {
            throw new BusinessException(ErrorCode.USER_EMAIL_NOT_VERIFIED);
        }

        // 3. Kiểm tra tài khoản có active không
        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new BusinessException(ErrorCode.USER_INACTIVE);
        }

        // 4. Xác minh password
        UserCredential credential = userCredentialRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(request.getPassword(), credential.getPasswordHash())) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        // 5. Cập nhật last_login
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        // 6. Tạo tokens
        List<String> roles = getUserRoles(user.getId());
        return buildAuthResponse(user, roles);
    }

    

    @Override
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String incoming = request.getRefreshToken();
        String[] parts  = incoming.split(":", 2);
        if (parts.length != 2) throw new BusinessException(ErrorCode.TOKEN_INVALID);

        Long   userId;
        String tokenValue;
        try {
            userId     = Long.parseLong(parts[0]);
            tokenValue = parts[1];
        } catch (NumberFormatException e) {
            throw new BusinessException(ErrorCode.TOKEN_INVALID);
        }

        String email = redisTokenRepository.getEmailByRefreshToken(userId, tokenValue);
        if (email == null) throw new BusinessException(ErrorCode.TOKEN_NOT_FOUND);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (Boolean.FALSE.equals(user.getIsActive())) throw new BusinessException(ErrorCode.USER_INACTIVE);

        List<String> roles       = getUserRoles(userId);
        String       newAccess   = jwtTokenProvider.generateAccessToken(userId, email, roles);

        return AuthResponse.builder()
                .accessToken(newAccess)
                .refreshToken(incoming)
                .tokenType("Bearer")
                .accessTokenExpiresIn(jwtTokenProvider.getAccessTokenExpirationMs() / 1000)
                .user(buildUserInfo(user, roles))
                .build();
    }


    @Override
    public void logout(String refreshToken) {
        String[] parts = refreshToken.split(":", 2);
        if (parts.length != 2) throw new BusinessException(ErrorCode.TOKEN_INVALID);
        try {
            Long userId = Long.parseLong(parts[0]);
            redisTokenRepository.deleteRefreshToken(userId, parts[1]);
            log.info("User {} logged out", userId);
        } catch (NumberFormatException e) {
            throw new BusinessException(ErrorCode.TOKEN_INVALID);
        }
    }

    @Override
    public void logoutAll(Long userId) {
        redisTokenRepository.deleteAllRefreshTokensByUserId(userId);
        log.info("User {} logged out from all devices", userId);
    }

    @Override
    @Transactional
    public void updateUserLevel(Long userId, Long levelId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        user.setLevelId(levelId);
        userRepository.save(user);
    }

    

    private void sendOtpToEmail(String email, String fullName) {
        String otp = generateOtp();
        redisOtpRepository.saveOtp(email, otp, otpExpirationMs);
        redisOtpRepository.markResendCooldown(email, OTP_RESEND_COOLDOWN_MS);
        emailService.sendOtpVerificationEmail(email, otp, fullName);
    }

    private String generateOtp() {
        SecureRandom   random = new SecureRandom();
        StringBuilder  sb     = new StringBuilder();
        for (int i = 0; i < otpLength; i++) sb.append(random.nextInt(10));
        return sb.toString();
    }

    private void assignDefaultRole(Long userId) {
        if (!userRoleRepository.findAllByUserId(userId).isEmpty()) return;
        Role role = roleRepository.findByName(DEFAULT_ROLE)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        userRoleRepository.save(UserRole.builder().userId(userId).roleId(role.getId()).build());
    }

    private List<String> getUserRoles(Long userId) {
        return userRoleRepository.findAllByUserId(userId).stream()
                .map(ur -> roleRepository.findById(ur.getRoleId()).map(Role::getName).orElse(null))
                .filter(Objects::nonNull)
                .toList();
    }

    private AuthResponse buildAuthResponse(User user, List<String> roles) {
        String rawRefresh       = jwtTokenProvider.generateRefreshToken();
        String compositeRefresh = user.getId() + ":" + rawRefresh;
        redisTokenRepository.saveRefreshToken(user.getId(), rawRefresh, user.getEmail(),
                jwtTokenProvider.getRefreshTokenExpirationMs());
        return AuthResponse.builder()
                .accessToken(jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail(), roles))
                .refreshToken(compositeRefresh)
                .tokenType("Bearer")
                .accessTokenExpiresIn(jwtTokenProvider.getAccessTokenExpirationMs() / 1000)
                .user(buildUserInfo(user, roles))
                .build();
    }

    private AuthResponse.UserInfo buildUserInfo(User user, List<String> roles) {
        return AuthResponse.UserInfo.builder()
                .id(user.getId()).email(user.getEmail())
                .username(user.getUsername()).fullName(user.getFullName())
                .roles(roles)
                .levelId(user.getLevelId())
                .build();
    }
}
