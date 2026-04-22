package com.ptit.mobile.backend.dto.response.quiz;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FillBlankQuestionResponse {
    private int questionIndex;
    private int total;
    private Integer vocabularyId;
    private String sentence;
    private String hint;
    private int wordLength;
}
