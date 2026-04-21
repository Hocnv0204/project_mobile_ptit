package com.ptit.mobile.backend.service;

import com.ptit.mobile.backend.dto.request.quiz.CheckAnswerRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;

public interface QuizService {

    /**
     * Sinh toàn bộ session câu hỏi trắc nghiệm cho 1 bài học.
     *
     * @param lessonVocabId Id bài học từ vựng
     * @param mode          "EN_TO_VI" | "VI_TO_EN" | "MIXED"
     * @return QuizSessionResponse chứa danh sách câu hỏi đã shuffle
     */
    BaseResponse generateSession(Long lessonVocabId, String mode);

    /**
     * Chấm điểm 1 câu (dùng cho cả trắc nghiệm và tự luận).
     *
     * @param request vocabularyId + mode + answer của user
     * @return QuizCheckResponse: correct, correctAnswer, explanation
     */
    BaseResponse checkAnswer(CheckAnswerRequest request);
}
