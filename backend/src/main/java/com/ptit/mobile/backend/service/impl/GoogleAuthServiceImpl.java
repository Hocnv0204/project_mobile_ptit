package com.ptit.mobile.backend.service.impl;

import com.ptit.mobile.backend.dto.external.GoogleTokenInfo;
import com.ptit.mobile.backend.dto.response.auth.AuthResponse;
import com.ptit.mobile.backend.exception.BusinessException;
import com.ptit.mobile.backend.exception.ErrorCode;
import com.ptit.mobile.backend.model.OauthAccount;
import com.ptit.mobile.backend.model.User;
import com.ptit.mobile.backend.model.UserRole;
import com.ptit.mobile.backend.repository.*;
import com.ptit.mobile.backend.security.JwtTokenProvider;
import com.ptit.mobile.backend.service.GoogleAuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleAuthServiceImpl implements GoogleAuthService {

    private static final String GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";
    private static final String PROVIDER             = "GOOGLE";
    private static final String DEFAULT_ROLE         = "ROLE_USER";

    private final UserRepository           userRepository;
    private final UserRoleRepository       userRoleRepository;
    private final RoleRepository           roleRepository;
    private final OauthAccountRepository   oauthAccountRepository;
    private final RedisTokenRepository     redisTokenRepository;
    private final JwtTokenProvider         jwtTokenProvider;

    @Value("${google.client-id}")
    private String googleClientId;

    /** OAuth client Android — id_token từ app Android có thể có aud = client này thay vì web client-id. */
    @Value("${google.android-client-id:}")
    private String googleAndroidClientId;

    // ── RestClient (Spring Boot 3.2+, no-arg factory) ────────────────────────
    private final RestClient restClient = RestClient.create();

    @Override
    @Transactional
    public AuthResponse loginWithGoogle(String idToken) {
        // 1. Verify ID Token với Google
        GoogleTokenInfo tokenInfo = verifyGoogleToken(idToken);

        // 2. Kiểm tra token hợp lệ
        if (!tokenInfo.isValid()) {
            log.warn("Google tokeninfo returned error: {}", tokenInfo.getErrorDescription());
            throw new BusinessException(ErrorCode.GOOGLE_TOKEN_INVALID);
        }

        // 3. Kiểm tra email đã được Google xác thực
        if (!tokenInfo.isEmailVerified()) {
            throw new BusinessException(ErrorCode.GOOGLE_EMAIL_NOT_VERIFIED);
        }

        // 4. Kiểm tra audience — bỏ qua nếu client-id chưa được cấu hình (dev mode)
        validateAudience(tokenInfo.getAud());

        String googleId = tokenInfo.getSub();
        String email    = tokenInfo.getEmail().toLowerCase().trim();

        // 5. Tìm OauthAccount theo googleId
        Optional<OauthAccount> existingOauth = oauthAccountRepository
                .findByProviderAndProviderUserId(PROVIDER, googleId);

        User user;
        if (existingOauth.isPresent()) {
            // User đã từng đăng nhập Google → lấy thẳng user
            user = userRepository.findById(existingOauth.get().getUserId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        } else {
            // Lần đầu đăng nhập Google → tìm hoặc tạo user theo email
            user = userRepository.findByEmail(email)
                    .orElseGet(() -> createGoogleUser(email, tokenInfo));

            // Tạo OauthAccount mới
            saveOauthAccount(user.getId(), googleId);
        }

        // 6. Kiểm tra tài khoản không bị khoá
        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new BusinessException(ErrorCode.USER_INACTIVE);
        }

        // 7. Cập nhật last_login
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        // 8. Lấy roles và trả tokens
        List<String> roles = getUserRoles(user.getId());
        log.info("Google login successful for email={}", email);
        return buildAuthResponse(user, roles);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Gọi Google tokeninfo API để verify ID token.
     */
    private GoogleTokenInfo verifyGoogleToken(String idToken) {
        try {
            return restClient.get()
                    .uri(GOOGLE_TOKENINFO_URL + "?id_token={token}", idToken)
                    .retrieve()
                    .body(GoogleTokenInfo.class);
        } catch (RestClientException e) {
            log.error("Failed to verify Google token: {}", e.getMessage());
            throw new BusinessException(ErrorCode.GOOGLE_TOKEN_INVALID);
        }
    }

    /**
     * Kiểm tra audience của token có khớp với client-id không.
     * Bỏ qua validation nếu client-id chưa được cấu hình (placeholder).
     */
    private void validateAudience(String aud) {
        if (googleClientId == null
                || googleClientId.isBlank()
                || googleClientId.contains("YOUR_GOOGLE_CLIENT_ID")) {
            log.warn("Google client-id not configured — skipping audience validation (dev mode)");
            return;
        }
        if (googleClientId.equals(aud)) {
            return;
        }
        if (googleAndroidClientId != null && !googleAndroidClientId.isBlank() && googleAndroidClientId.equals(aud)) {
            return;
        }
        log.warn("Google token audience mismatch: expected web or android client-id, got={}", aud);
        throw new BusinessException(ErrorCode.GOOGLE_TOKEN_AUDIENCE_MISMATCH);
    }

    /**
     * Tạo User mới từ thông tin Google (auto-verified, active).
     */
    private User createGoogleUser(String email, GoogleTokenInfo tokenInfo) {
        String username = generateUniqueUsername(email);

        User newUser = User.builder()
                .email(email)
                .username(username)
                .fullName(tokenInfo.getName())
                .isActive(true)           // Google đã xác thực → kích hoạt ngay
                .isEmailVerified(true)    // Google đã xác thực email
                .deleteFlag(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        newUser = userRepository.save(newUser);

        // Assign ROLE_USER
        final Long userId = newUser.getId();
        roleRepository.findByName(DEFAULT_ROLE).ifPresent(role ->
                userRoleRepository.save(UserRole.builder()
                        .userId(userId)
                        .roleId(role.getId())
                        .build()));

        log.info("New user created via Google OAuth: email={}, username={}", email, username);
        return newUser;
    }

    /**
     * Sinh username duy nhất từ phần trước '@' của email.
     * Nếu đã tồn tại → thêm số ngẫu nhiên.
     */
    private String generateUniqueUsername(String email) {
        String base = email.split("@")[0]
                .replaceAll("[^a-zA-Z0-9_]", "")
                .toLowerCase();
        if (base.isBlank()) base = "user";

        String candidate = base;
        int attempt = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = base + attempt++;
        }
        return candidate;
    }

    /**
     * Tạo OauthAccount lưu liên kết Google ↔ User.
     */
    private void saveOauthAccount(Long userId, String googleId) {
        OauthAccount account = OauthAccount.builder()
                .userId(userId)
                .provider(PROVIDER)
                .providerUserId(googleId)
                .build();
        oauthAccountRepository.save(account);
    }

    private List<String> getUserRoles(Long userId) {
        return userRoleRepository.findAllByUserId(userId).stream()
                .map(ur -> roleRepository.findById(ur.getRoleId())
                        .map(com.ptit.mobile.backend.model.Role::getName)
                        .orElse(null))
                .filter(Objects::nonNull)
                .toList();
    }

    private AuthResponse buildAuthResponse(User user, List<String> roles) {
        String rawRefresh       = jwtTokenProvider.generateRefreshToken();
        String compositeRefresh = user.getId() + ":" + rawRefresh;
        redisTokenRepository.saveRefreshToken(
                user.getId(), rawRefresh, user.getEmail(),
                jwtTokenProvider.getRefreshTokenExpirationMs());

        return AuthResponse.builder()
                .accessToken(jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail(), roles))
                .refreshToken(compositeRefresh)
                .tokenType("Bearer")
                .accessTokenExpiresIn(jwtTokenProvider.getAccessTokenExpirationMs() / 1000)
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .username(user.getUsername())
                        .fullName(user.getFullName())
                        .levelId(user.getLevelId())
                        .roles(roles)
                        .build())
                .build();
    }
}
