package com.ptit.mobile.backend.dto.request.writing;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GradingRequest {
    
    @NotBlank(message = "Câu hỏi không được để trống")
    private String question; // Câu tiếng Việt
    
    @NotBlank(message = "Câu trả lời không được để trống")
    private String answer; // Câu tiếng Anh

    private List<String> suggestVocabularies;
    
    private String aiProvider; // "gemini" hoặc "groq" - nếu null sẽ dùng default
}

