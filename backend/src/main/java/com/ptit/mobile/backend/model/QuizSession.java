package com.ptit.mobile.backend.model;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizSession {
    private String sessionId;
    private Integer userId;
    private Integer collectionId;
    private Integer totalQuestions;
    private Integer currentQuestionIndex;
    private List<QuizQuestion> questions;
    private Map<String, Integer> questionAttempts; // questionId -> attempts
    private LocalDateTime createdAt;
    private LocalDateTime lastActivityAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuizQuestion {
        private String questionId;
        private Integer vocabularyId;
        private String question;
        private String correctAnswer;
        private List<String> options;
        private boolean isAnswered;
    }
}

