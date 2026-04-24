package com.ptit.mobile.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "review_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "card_review_id", nullable = false)
    private Long cardReviewId;

    /** Điểm user tự chấm: 0-5 */
    @Column(nullable = false)
    private Integer quality;

    @Column(name = "ease_factor_before", nullable = false)
    private Double easeFactorBefore;

    @Column(name = "ease_factor_after", nullable = false)
    private Double easeFactorAfter;

    @Column(name = "interval_before", nullable = false)
    private Integer intervalBefore;

    @Column(name = "interval_after", nullable = false)
    private Integer intervalAfter;

    @Column(name = "reviewed_at", nullable = false)
    @Builder.Default
    private LocalDateTime reviewedAt = LocalDateTime.now();
}
