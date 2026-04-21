package com.ptit.mobile.backend.dto.response.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GradingResponse {
    private Integer score;
    private String status; // perfect, good, needs_improvement
    private String message;
    private String comment;
    private String improvementSuggestions;
    private String correctAnswer;
}
