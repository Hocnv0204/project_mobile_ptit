package com.ptit.mobile.backend.dto.response.flashcard;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class FlashcardSessionResponse {
    private Long lessonVocabId;

    /** Số thẻ đến hạn (NEW + DUE_TODAY + OVERDUE) */
    private int dueCount;

    /** Số thẻ chưa đến hạn */
    private int upcomingCount;

    /** Danh sách thẻ cần ôn hôm nay (sắp xếp: OVERDUE → DUE_TODAY → NEW) */
    private List<CardReviewResponse> dueCards;
}
