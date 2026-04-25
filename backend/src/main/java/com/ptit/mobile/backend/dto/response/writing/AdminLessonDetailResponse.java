package com.ptit.mobile.backend.dto.response.writing;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class AdminLessonDetailResponse {
    private Integer id;
    private String name;
    private String description;
    private String status;
    private Boolean deleteFlag;
    private Integer totalSentences;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer topicId;
    private String topicName;
    private Integer levelId;
    private String levelName;
    private List<LessonSentenceResponse> sentences;
    private List<SuggestVocabularyResponse> suggestVocabularies;
}