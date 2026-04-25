package com.ptit.mobile.backend.dto.request.writing;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProgressRequest {

    @NotNull(message = "Lesson writing ID không được để trống")
    private Integer lessonWritingId;

    @NotNull(message = "Current order index không được để trống")
    private Integer currentOrderIndex;
}