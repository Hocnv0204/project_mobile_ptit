package com.ptit.mobile.backend.service;

import com.ptit.mobile.backend.dto.response.auth.AuthResponse;

public interface GoogleAuthService {

    /**
     * Xác thực Google ID Token từ Android client và trả về JWT tokens của hệ thống.
     *
     * <p>Luồng:
     * <ol>
     *   <li>Verify idToken với Google tokeninfo API</li>
     *   <li>Kiểm tra audience khớp với google.client-id</li>
     *   <li>Tìm hoặc tạo user theo email</li>
     *   <li>Tạo/cập nhật OauthAccount</li>
     *   <li>Trả về accessToken + refreshToken của hệ thống</li>
     * </ol>
     *
     * @param idToken Google ID Token nhận từ Android SDK
     * @return AuthResponse chứa tokens của hệ thống
     */
    AuthResponse loginWithGoogle(String idToken);
}
