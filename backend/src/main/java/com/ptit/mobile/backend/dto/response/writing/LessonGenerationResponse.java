package com.ptit.mobile.backend.dto.response.writing;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class LessonGenerationResponse {
    private Integer lessonId;
    private String status;
    private String message;
}