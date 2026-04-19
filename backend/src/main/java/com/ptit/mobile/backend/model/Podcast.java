package com.ptit.mobile.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "podcasts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Podcast {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "audio_url", nullable = false)
    private String audioUrl;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @Column(name = "level_id")
    private Integer levelId;

    @Column(name = "topic_id")
    private Integer topicId;

    @Column
    private Integer duration;

    @Column(name = "order_index")
    private Integer orderIndex;

    @Column(name = "delete_flag")
    private Boolean deleteFlag = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
