package com.ptit.mobile.backend.common.exception;

/**
 * Lớp exception tùy chỉnh cho các lỗi liên quan đến việc gọi API.
 * Kế thừa từ RuntimeException để đây là một unchecked exception,
 * giúp đơn giản hóa việc xử lý lỗi ở các lớp service.
 */
public class ApiException extends RuntimeException {

    /**
     * Constructor với một thông điệp lỗi.
     *
     * @param message Thông điệp mô tả lỗi.
     */
    public ApiException(String message) {
        super(message);
    }

    /**
     * Constructor với một thông điệp lỗi và nguyên nhân gốc rễ (cause).
     *
     * @param message Thông điệp mô tả lỗi.
     * @param cause   Exception gốc đã gây ra lỗi này.
     */
    public ApiException(String message, Throwable cause) {
        super(message, cause);
    }
}
