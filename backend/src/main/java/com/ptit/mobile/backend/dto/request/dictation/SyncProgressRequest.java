package com.ptit.mobile.backend.dto.request.dictation;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SyncProgressRequest {

    @NotNull(message = "dictationId is required")
    private UUID dictationId;

    @NotNull(message = "currentSequence is required")
    private Integer currentSequence;

    @NotNull(message = "completedSegments is required")
    private Integer completedSegments;
}
