package com.ptit.mobile.backend.controller;

import com.ptit.mobile.backend.dto.request.flashcard.SubmitReviewRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;
import com.ptit.mobile.backend.service.FlashcardService;
import com.ptit.mobile.backend.service.StreakService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/flashcard")
@RequiredArgsConstructor
@Tag(name = "Flashcard (SM-2)", description = "Ôn tập từ vựng theo thuật toán SM-2 (Anki)")
public class FlashcardController {

    private final FlashcardService flashcardService;
    private final StreakService streakService;

    @Operation(
        summary = "Lấy phiên flashcard của một bài học",
        description = "Trả về danh sách thẻ đến hạn hôm nay (NEW / DUE_TODAY / OVERDUE). " +
                      "Thẻ chưa có card_review sẽ được khởi tạo tự động với giá trị mặc định.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @GetMapping("/{lessonVocabId}/session")
    public BaseResponse getSession(
            @PathVariable Long lessonVocabId,
            @RequestParam(value = "mode", required = false, defaultValue = "DUE") String mode,
            Authentication authentication
    ) {
        Long userId = (Long) authentication.getDetails();
        streakService.updateStreak(userId);
        return flashcardService.getSession(lessonVocabId, mode);
    }

    @Operation(
        summary = "Gửi kết quả ôn một thẻ (SM-2)",
        description = """
            quality: điểm tự chấm 0–5
            - 0: Quên hoàn toàn
            - 1: Quên nhưng nhớ lại khi thấy đáp án
            - 2: Quên nhưng đáp án có vẻ quen
            - 3: Khó (nhớ ra nhưng phải cố)
            - 4: Nhớ (trả lời đúng dễ dàng)
            - 5: Dễ (trả lời ngay lập tức)
            """,
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @PostMapping("/review")
    public BaseResponse submitReview(@Valid @RequestBody SubmitReviewRequest request) {
        return flashcardService.submitReview(request);
    }
}
