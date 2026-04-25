package com.ptit.mobile.backend.dto.response.podcast;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PodcastResponse {
    private Integer id;
    private String title;
    private String description;
    private String audioUrl;
    private String thumbnailUrl;
    private Integer levelId;
    private Integer topicId;
    private Integer duration;
    private Integer orderIndex;
    private LocalDateTime createdAt;
}
