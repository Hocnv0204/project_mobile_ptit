package com.ptit.mobile.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_translation_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserTranslationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "lesson_writing_id")
    private Integer lessonWritingId;

    @Column(name = "sentence_id")
    private Integer sentenceId;

    @Column(name = "user_answer", columnDefinition = "TEXT")
    private String userAnswer;

    @Column(name = "ai_feedback_json", columnDefinition = "jsonb")
    private String aiFeedbackJson;

    @Column(name = "accuracy_score")
    private Integer accuracyScore;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
