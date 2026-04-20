package com.ptit.mobile.backend.dto.request.lessonvocab;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateLessonVocabRequest {
    @NotBlank(message = "name is required")
    @Size(max = 100, message = "name must be <= 100 characters")
    private String name;

    @NotNull(message = "levelId is required")
    private Integer levelId;
}

