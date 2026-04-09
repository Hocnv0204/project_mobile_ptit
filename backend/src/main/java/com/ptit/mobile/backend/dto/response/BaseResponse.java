package com.ptit.mobile.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BaseResponse {
    private String message;
    private Long code;
    private Object data;

    public static  BaseResponse success(Object data) {
        return BaseResponse.builder().message("Success").code(200L).data(data).build();
    }

    public static  BaseResponse success(String message, Long code) {
        return BaseResponse.builder().message(message).code(code).build();
    }

    public static BaseResponse error(Long code, String message) {
        return BaseResponse.builder()
                .code(code)
                .message(message)
                .build();
    }
}
