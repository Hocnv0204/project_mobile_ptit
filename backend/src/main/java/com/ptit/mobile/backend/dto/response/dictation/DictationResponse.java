package com.ptit.mobile.backend.dto.response.dictation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DictationResponse {
    private UUID id;
    private String title;
    private String mediaUrl;
    private Integer totalSegments;

    /**
     * User's progress percentage (0–100).
     * null if the user has not started this dictation.
     */
    private Double progressPercent;
}
