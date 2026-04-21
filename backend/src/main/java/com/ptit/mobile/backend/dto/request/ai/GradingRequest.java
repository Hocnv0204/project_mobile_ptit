package com.ptit.mobile.backend.dto.request.ai;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GradingRequest {
    
    @NotBlank(message = "Câu hỏi không được để trống")
    private String question; // Câu tiếng Việt
    
    @NotBlank(message = "Câu trả lời không được để trống")
    private String answer; // Câu tiếng Anh
    
    private String aiProvider; // "gemini" hoặc "groq" - nếu null sẽ dùng default
}

