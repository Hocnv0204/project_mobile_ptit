package com.ptit.mobile.backend.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class GeminiApiException extends RuntimeException {

    private final HttpStatus statusCode;
    private final String apiErrorCode; // Mã lỗi cụ thể từ API (nếu có)
    private final String apiErrorMessage; // Message lỗi từ API

    public GeminiApiException(String message, HttpStatus statusCode, String apiErrorCode, String apiErrorMessage, Throwable cause) {
        super(message, cause);
        this.statusCode = statusCode;
        this.apiErrorCode = apiErrorCode;
        this.apiErrorMessage = apiErrorMessage;
    }

    public GeminiApiException(String message, HttpStatus statusCode, String apiErrorMessage) {
        super(message);
        this.statusCode = statusCode;
        this.apiErrorCode = null;
        this.apiErrorMessage = apiErrorMessage;
    }
}