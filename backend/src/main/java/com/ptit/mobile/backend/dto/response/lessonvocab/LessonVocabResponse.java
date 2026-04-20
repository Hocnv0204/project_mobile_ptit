package com.ptit.mobile.backend.dto.response.lessonvocab;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class LessonVocabResponse {
    private Integer id;
    private String name;
    private Integer levelId;
    private Long userId;
    private String createBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

