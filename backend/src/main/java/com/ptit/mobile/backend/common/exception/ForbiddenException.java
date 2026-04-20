package com.ptit.mobile.backend.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception được ném ra khi một người dùng cố gắng truy cập
 * hoặc sửa đổi một tài nguyên mà họ không có quyền.
 *
 * Annotation @ResponseStatus(HttpStatus.FORBIDDEN) sẽ tự động
 * trả về mã trạng thái HTTP 403 Forbidden cho client khi exception này được ném ra
 * từ một controller mà không được xử lý bởi một @ExceptionHandler cụ thể nào khác.
 */
@ResponseStatus(HttpStatus.FORBIDDEN)
public class ForbiddenException extends RuntimeException {

    /**
     * Constructor mặc định.
     */
    public ForbiddenException() {
        super();
    }

    /**
     * Constructor với một thông báo lỗi cụ thể.
     *
     * @param message Thông báo lỗi giải thích lý do từ chối quyền truy cập.
     */
    public ForbiddenException(String message) {
        super(message);
    }

    /**
     * Constructor với thông báo lỗi và nguyên nhân gốc.
     *
     * @param message Thông báo lỗi.
     * @param cause   Exception gốc đã gây ra lỗi này.
     */
    public ForbiddenException(String message, Throwable cause) {
        super(message, cause);
    }
}