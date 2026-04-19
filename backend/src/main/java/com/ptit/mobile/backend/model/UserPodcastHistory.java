package com.ptit.mobile.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_podcast_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPodcastHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "podcast_id")
    private Integer podcastId;

    @Column(name = "progress_seconds")
    private Integer progressSeconds = 0;

    @Column(name = "is_completed")
    private Boolean isCompleted = false;

    @Column(name = "listened_at")
    private LocalDateTime listenedAt;
}
