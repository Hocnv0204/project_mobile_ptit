package com.ptit.mobile.backend.dto.response.flashcard;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CardReviewResponse {
    private Long id;
    private Long vocabularyId;
    private String term;
    private String vi;
    private String type;
    private String pronunciation;
    private String example;
    private String audioUrl;
    private String imageUrl;

    /** Trạng thái SM-2 */
    private Integer repetition;
    private Double easeFactor;
    private Integer intervalDays;
    private LocalDate nextReviewDate;
    private LocalDateTime lastReviewedAt;

    /**
     * Label hiển thị trạng thái thẻ:
     * NEW       — chưa từng ôn
     * DUE_TODAY — đến hạn hôm nay
     * OVERDUE   — quá hạn
     * UPCOMING  — chưa đến hạn
     */
    private String status;
}
