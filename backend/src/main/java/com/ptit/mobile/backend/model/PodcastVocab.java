package com.ptit.mobile.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "podcast_vocab")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PodcastVocab {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "podcast_id", nullable = false)
    private Integer podcastId;

    @Column(length = 100)
    private String term;

    @Column(columnDefinition = "TEXT")
    private String definition;

    @Column(length = 100)
    private String pronunciation;

    @Column(columnDefinition = "TEXT")
    private String example;

    @Column(name = "word_type", length = 50)
    private String wordType;

    @Column(name = "vocab_type", length = 20)
    private String vocabType;

    @Column(name = "order_index")
    private Integer orderIndex;
}
