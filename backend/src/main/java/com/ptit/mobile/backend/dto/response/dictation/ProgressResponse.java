package com.ptit.mobile.backend.dto.response.dictation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProgressResponse {
    private UUID id;
    private UUID dictationId;
    private Integer currentSequence;
    private Integer completedSegments;
    private String status;
    private Double progressPercent;
    private LocalDateTime updatedAt;
}
