package com.ptit.mobile.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "suggest_vocabulary")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuggestVocabulary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(length = 100)
    private String term;

    @Column(columnDefinition = "TEXT")
    private String vietnamese;

    @Column(length = 50)
    private String type;

    @Column(length = 100)
    private String pronunciation;

    @Column(columnDefinition = "TEXT")
    private String example;

    @Column(name = "lesson_sentence_id")
    private Integer lessonSentenceId;
}
