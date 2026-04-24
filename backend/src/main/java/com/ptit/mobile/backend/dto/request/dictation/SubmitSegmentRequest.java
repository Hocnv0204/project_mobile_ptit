package com.ptit.mobile.backend.dto.request.dictation;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubmitSegmentRequest {

    @NotNull(message = "sequenceOrder is required")
    private Integer sequenceOrder;

    @NotEmpty(message = "userInput must not be empty")
    private List<String> userInput;
}
