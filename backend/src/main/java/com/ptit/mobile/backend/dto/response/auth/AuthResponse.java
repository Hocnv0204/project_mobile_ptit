package com.ptit.mobile.backend.dto.response.auth;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {

    private String accessToken;
    private String refreshToken;

    @Builder.Default
    private String tokenType = "Bearer";

    /** Thời gian hết hạn của accessToken (giây) */
    private Long accessTokenExpiresIn;

    /** Thông tin cơ bản về user đang đăng nhập */
    private UserInfo user;

    @Data
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UserInfo {
        private Long id;
        private String email;
        private String username;
        private String fullName;
        private List<String> roles;
    }
}
