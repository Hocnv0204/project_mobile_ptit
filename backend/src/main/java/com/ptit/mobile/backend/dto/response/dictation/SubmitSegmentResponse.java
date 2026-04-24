package com.ptit.mobile.backend.dto.response.dictation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitSegmentResponse {
    private Boolean isCorrect;
    private List<String> correctAnswers;
}
