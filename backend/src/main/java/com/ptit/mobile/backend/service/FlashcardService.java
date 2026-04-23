package com.ptit.mobile.backend.service;

import com.ptit.mobile.backend.dto.request.flashcard.SubmitReviewRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;

public interface FlashcardService {

    /**
     * Lấy phiên flashcard cho một bài học:
     * - Nếu thẻ chưa tồn tại trong card_reviews thì tự khởi tạo với giá trị mặc định.
     * - Trả về danh sách thẻ đến hạn hôm nay (OVERDUE + DUE_TODAY + NEW).
     */
    BaseResponse getSession(Long lessonVocabId);

    /**
     * Gửi kết quả ôn một thẻ (SM-2):
     * - Tính EF mới, interval mới, next_review_date.
     * - Lưu review_log.
     * - Cập nhật card_review.
     */
    BaseResponse submitReview(SubmitReviewRequest request);
}
