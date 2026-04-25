package com.ptit.mobile.backend.dto.request.flashcard;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SubmitReviewRequest {

    @NotNull(message = "vocabularyId is required")
    private Long vocabularyId;

    /**
     * Điểm user tự chấm theo thang SM-2:
     * 0 - Quên hoàn toàn
     * 1 - Quên, nhưng nhớ lại khi thấy đáp án
     * 2 - Quên, nhưng đáp án có vẻ quen
     * 3 - Khó nhớ (nhớ ra nhưng phải cố)
     * 4 - Nhớ (trả lời đúng dễ dàng)
     * 5 - Dễ (trả lời ngay lập tức)
     */
    @NotNull(message = "quality is required")
    @Min(value = 0, message = "quality must be between 0 and 5")
    @Max(value = 5, message = "quality must be between 0 and 5")
    private Integer quality;
}
