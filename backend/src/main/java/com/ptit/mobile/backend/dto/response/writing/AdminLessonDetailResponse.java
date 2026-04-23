package com.ptit.mobile.backend.dto.response.writing;

import com.ptit.mobile.backend.dto.response.writing.SuggestVocabularyResponse;
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
    private Boolean deleteFlag;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String topicName;
    private String levelName;
    private List<SuggestVocabularyResponse> suggestVocabularies;
}