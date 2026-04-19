package com.ptit.mobile.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "podcast_dialogues")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PodcastDialogue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "podcast_id", nullable = false)
    private Integer podcastId;

    @Column(length = 10)
    private String speaker;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "order_index")
    private Integer orderIndex;

    @Column(name = "timestamp_start")
    private Integer timestampStart;
}
