package com.ptit.mobile.backend.dto.response.podcast;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PodcastDetailResponse {
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

    private List<DialogueItem> dialogues;
    private List<VocabItem> vocab;

    @Data
    @Builder
    public static class DialogueItem {
        private Integer id;
        private String speaker;
        private String content;
        private Integer orderIndex;
        private Integer timestampStart;
    }

    @Data
    @Builder
    public static class VocabItem {
        private Integer id;
        private String term;
        private String definition;
        private String pronunciation;
        private String example;
        private String wordType;
        private String vocabType;
        private Integer orderIndex;
    }
}
