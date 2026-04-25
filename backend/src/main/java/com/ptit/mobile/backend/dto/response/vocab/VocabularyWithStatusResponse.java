package com.ptit.mobile.backend.dto.response.vocab;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class VocabularyWithStatusResponse {
    private Integer id;
    private String term;
    private String vi;
    private String type;
    private String pronunciation;
    private String example;
    private String audioUrl;
    private String imageUrl;

    /** NEW, DUE_TODAY, OVERDUE, UPCOMING */
    private String status;

    /** Ngày ôn tiếp theo (nếu chưa từng ôn thì mặc định hôm nay) */
    private LocalDate nextReviewDate;

    /** Số ngày đến lần ôn tiếp theo (>=0). 0 nghĩa là ôn hôm nay */
    private Long daysUntilReview;
}

