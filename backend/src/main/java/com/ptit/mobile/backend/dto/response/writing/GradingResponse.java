package com.ptit.mobile.backend.dto.response.writing;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    private String status;
    private String message;
    private String comment;

    @JsonProperty("improvement_suggestions")
    private String improvementSuggestions;

    @JsonProperty("correct_answer")
    private String correctAnswer;
}
