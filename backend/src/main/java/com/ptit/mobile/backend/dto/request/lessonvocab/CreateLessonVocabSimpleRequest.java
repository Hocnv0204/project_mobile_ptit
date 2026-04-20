package com.ptit.mobile.backend.dto.request.lessonvocab;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateLessonVocabSimpleRequest {
    @NotBlank(message = "name is required")
    @Size(max = 100, message = "name must be <= 100 characters")
    private String name;
}

