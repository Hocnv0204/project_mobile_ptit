package com.ptit.mobile.backend.dto.response.writing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonGenerationResult {
    private String lessonTitle;
    private String lessonDescription;
    private String vietnameseParagraph;
    private List<SuggestVocabularyItem> suggestVocabularyList;
    
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SuggestVocabularyItem {
        private String term;
        private String vi;
        private String type;
        private String pronunciation;
        private String example;
    }
}
