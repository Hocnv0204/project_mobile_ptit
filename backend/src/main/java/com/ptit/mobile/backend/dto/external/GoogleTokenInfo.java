package com.ptit.mobile.backend.dto.external;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Ánh xạ response từ Google tokeninfo endpoint.
 * <p>GET https://oauth2.googleapis.com/tokeninfo?id_token={token}
 */
@Data
public class GoogleTokenInfo {

    /** Google account ID (subject) — dùng làm providerUserId */
    private String sub;

    /** Email của user */
    private String email;

    /** true nếu Google đã xác thực email */
    @JsonProperty("email_verified")
    private String emailVerified;

    /** Tên đầy đủ */
    private String name;

    /** Họ */
    @JsonProperty("family_name")
    private String familyName;

    /** Tên */
    @JsonProperty("given_name")
    private String givenName;

    /** URL ảnh avatar */
    private String picture;

    /**
     * Audience — phải khớp với google.client-id trong config.
     * Với Android app, đây là Android client ID.
     */
    private String aud;

    /** Thời điểm hết hạn (Unix timestamp) */
    private String exp;

    /** Error message nếu token không hợp lệ */
    private String error;

    @JsonProperty("error_description")
    private String errorDescription;

    public boolean isValid() {
        return error == null && sub != null && email != null;
    }

    public boolean isEmailVerified() {
        return "true".equalsIgnoreCase(emailVerified);
    }
}
