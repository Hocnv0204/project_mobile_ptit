package com.ptit.mobile.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "vocabulary")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vocabulary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(length = 100)
    private String term;

    @Column(columnDefinition = "TEXT")
    private String vi;

    @Column(length = 50)
    private String type;

    @Column(length = 100)
    private String pronunciation;

    @Column(columnDefinition = "TEXT")
    private String example;

    @Column(name = "audio_url")
    private String audioUrl;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "lesson_vocab_id")
    private Long lessonVocabId;
}
