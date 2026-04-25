package com.ptit.mobile.backend.dto.request.writing;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminCreateSentenceRequest {

    @NotNull(message = "ID bài học không được để trống")
    private Integer lessonWritingId;

    @NotBlank(message = "Câu tiếng Việt không được để trống")
    private String sentenceVi;

    private Integer orderIndex;
}
