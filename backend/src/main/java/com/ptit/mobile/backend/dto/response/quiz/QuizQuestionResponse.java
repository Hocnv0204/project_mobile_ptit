package com.ptit.mobile.backend.dto.response.quiz;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class QuizQuestionResponse {
    private int questionIndex;      // Số thứ tự câu hỏi (0-based)
    private int total;              // Tổng số câu
    private Integer vocabularyId;   // Id của vocab đang hỏi (để gửi lên khi check)
    private String mode;            // "EN_TO_VI" | "VI_TO_EN"
    private String question;        // Từ/nghĩa cần đoán
    private List<String> options;   // 4 lựa chọn đã shuffle (trắc nghiệm)
}
