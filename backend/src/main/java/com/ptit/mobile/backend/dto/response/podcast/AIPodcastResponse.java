package com.ptit.mobile.backend.dto.response.podcast;

import lombok.Data;
import java.util.List;

@Data
public class AIPodcastResponse {
    private String title;
    private String description;
    private List<Dialogue> dialogues;
    private List<Vocab> vocab;

    @Data
    public static class Dialogue {
        private String speaker;
        private String content;
    }

    @Data
    public static class Vocab {
        private String term;
        private String definition;
        private String example;
        private String pronunciation;
        private String wordType;
        private String vocabType;
    }
}