package com.ptit.mobile.backend.exception;

import lombok.Data;
import lombok.Getter;

@Getter
public enum ErrorCode {
    // ── HTTP chuẩn ──────────────────────────────────────
    SUCCESS(200, "Success"),
    BAD_REQUEST(400, "Bad request"),
    UNAUTHORIZED(401, "Unauthorized"),
    FORBIDDEN(403, "Forbidden"),
    NOT_FOUND(404, "Resource not found"),
    INTERNAL_ERROR(500, "Internal server error"),

    // ── Validation (1xxx) ────────────────────────────────
    INVALID_INPUT(1001, "Invalid input data"),
    NULL_VALUE(1002, "Required field is null or empty"),
    INVALID_FORMAT(1003, "Invalid data format"),

    // ── Personal Info Service (2xxx) ─────────────────────
    TEMPLATE_NOT_FOUND(2001, "Personal info template not found"),
    TEMPLATE_ALREADY_EXISTS(2002, "Template already exists"),

    // ── OCR Extraction Service (3xxx) ────────────────────
    IMAGE_NOT_FOUND(3001, "Image not found"),
    OCR_PROCESSING_FAILED(3002, "OCR processing failed"),
    INVALID_IMAGE_FORMAT(3003, "Invalid image format. Allowed: jpg, png, jpeg"),

    // ── Statistics Service (4xxx) ────────────────────────
    STAT_NOT_FOUND(4001, "Statistics data not found"),

    // ── Authentication (5xxx) ────────────────────────────
    EMAIL_ALREADY_EXISTS(5001, "Email already exists"),
    USERNAME_ALREADY_EXISTS(5002, "Username already exists"),
    INVALID_CREDENTIALS(5003, "Invalid email or password"),
    TOKEN_EXPIRED(5004, "Token has expired"),
    TOKEN_INVALID(5005, "Token is invalid"),
    TOKEN_NOT_FOUND(5006, "Refresh token not found or revoked"),
    USER_NOT_FOUND(5007, "User not found"),
    USER_INACTIVE(5008, "User account is inactive"),
    USER_EMAIL_NOT_VERIFIED(5009, "Email has not been verified"),

    // ── OTP (6xxx) ───────────────────────────────────────
    OTP_INVALID(6001, "Invalid OTP code"),
    OTP_EXPIRED(6002, "OTP has expired, please request a new one"),
    OTP_RESEND_TOO_SOON(6003, "Please wait before requesting a new OTP"),
    USER_ALREADY_VERIFIED(6004, "Email is already verified"),
    REGISTRATION_PENDING(6005, "Account is pending email verification");

    private final int code;
    private final String message;

    ErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
    }
}
