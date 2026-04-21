package com.ptit.mobile.backend.controller;

import com.ptit.mobile.backend.dto.request.quiz.CheckAnswerRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;
import com.ptit.mobile.backend.service.QuizService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/quiz")
@RequiredArgsConstructor
@Tag(name = "Quiz", description = "Luyện tập từ vựng: trắc nghiệm và tự luận")
public class QuizController {

    private final QuizService quizService;

    /**
     * Sinh toàn bộ session câu hỏi trắc nghiệm cho 1 bài học.
     *
     * @param lessonVocabId Id bài học
     * @param mode          EN_TO_VI | VI_TO_EN | MIXED (default: MIXED)
     */
    @Operation(
            summary = "Sinh session câu hỏi trắc nghiệm",
            description = "Trả về danh sách câu hỏi đã shuffle với 4 đáp án mỗi câu. mode: EN_TO_VI | VI_TO_EN | MIXED",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @GetMapping("/lesson/{lessonVocabId}/session")
    public BaseResponse generateSession(
            @PathVariable Long lessonVocabId,
            @RequestParam(value = "mode", defaultValue = "MIXED") String mode) {
        return quizService.generateSession(lessonVocabId, mode);
    }

    /**
     * Chấm điểm 1 câu trả lời (dùng cho cả trắc nghiệm và tự luận).
     */
    @Operation(
            summary = "Chấm điểm 1 câu trả lời",
            description = "Nhận vocabularyId + mode + answer, trả về đúng/sai và đáp án đúng",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @PostMapping("/check")
    public BaseResponse checkAnswer(@Valid @RequestBody CheckAnswerRequest request) {
        return quizService.checkAnswer(request);
    }

    /**
     * Sinh session câu hỏi điền từ vào chỗ trống (AI).
     */
    @Operation(
            summary = "Sinh session điền từ vào chỗ trống (AI)",
            description = "AI tự động tạo câu tiếng Anh với chỗ trống tương ứng với từ vựng",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @GetMapping("/lesson/{lessonVocabId}/fill-blank")
    public BaseResponse generateFillBlankSession(@PathVariable Long lessonVocabId) {
        return quizService.generateFillBlankSession(lessonVocabId);
    }
}
