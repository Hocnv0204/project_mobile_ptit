package com.ptit.mobile.backend.dto.request.quiz;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CheckAnswerRequest {
    @NotNull(message = "vocabularyId is required")
    private Integer vocabularyId;   // Id vocab đang hỏi

    @NotBlank(message = "mode is required")
    private String mode;            // "EN_TO_VI" | "VI_TO_EN"

    @NotBlank(message = "answer is required")
    private String answer;          // Đáp án user chọn / gõ
}
