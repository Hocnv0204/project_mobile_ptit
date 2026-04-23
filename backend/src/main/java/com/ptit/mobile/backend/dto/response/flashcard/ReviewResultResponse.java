package com.ptit.mobile.backend.dto.response.flashcard;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class ReviewResultResponse {
    private Long vocabularyId;
    private Integer quality;

    /** EF trước và sau khi tính */
    private Double easeFactorBefore;
    private Double easeFactorAfter;

    /** Interval trước và sau khi tính */
    private Integer intervalBefore;
    private Integer intervalAfter;

    /** Ngày ôn tiếp theo */
    private LocalDate nextReviewDate;

    /** Số lần đúng liên tiếp sau lần này */
    private Integer repetition;
}
