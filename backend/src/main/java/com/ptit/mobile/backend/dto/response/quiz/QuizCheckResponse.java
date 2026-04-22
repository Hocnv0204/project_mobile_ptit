package com.ptit.mobile.backend.dto.response.quiz;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class QuizCheckResponse {
    private boolean correct;          // Đúng hay sai
    private String correctAnswer;     // Đáp án đúng (hiển thị khi user sai)
    private String explanation;       // Câu ví dụ (example) của vocab
}
