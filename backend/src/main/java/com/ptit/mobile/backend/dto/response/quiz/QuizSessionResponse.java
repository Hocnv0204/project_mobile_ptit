package com.ptit.mobile.backend.dto.response.quiz;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class QuizSessionResponse {
    private Long lessonVocabId;
    private String mode;                         // mode đã chọn
    private List<QuizQuestionResponse> questions; // danh sách câu hỏi đã sinh & shuffle
}
