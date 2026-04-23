package com.ptit.mobile.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "card_reviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CardReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "vocabulary_id", nullable = false)
    private Long vocabularyId;

    /** Số lần trả lời đúng liên tiếp */
    @Column(nullable = false)
    @Builder.Default
    private Integer repetition = 0;

    /** Hệ số dễ/khó, mặc định 2.5, tối thiểu 1.3 */
    @Column(name = "ease_factor", nullable = false)
    @Builder.Default
    private Double easeFactor = 2.5;

    /** Khoảng cách (ngày) của lần ôn vừa rồi — dùng nhân EF lần tiếp theo */
    @Column(name = "interval_days", nullable = false)
    @Builder.Default
    private Integer intervalDays = 1;

    /** Ngày cần ôn tiếp theo */
    @Column(name = "next_review_date", nullable = false)
    @Builder.Default
    private LocalDate nextReviewDate = LocalDate.now();

    /** Lần cuối cùng ôn thẻ */
    @Column(name = "last_reviewed_at")
    private LocalDateTime lastReviewedAt;
}
