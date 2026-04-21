package com.ptit.mobile.backend.dto.response.quiz;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class FillBlankSessionResponse {
    private Long lessonVocabId;
    private List<FillBlankQuestionResponse> questions;
}
