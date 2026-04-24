package com.ptit.mobile.backend.dto.response.dictation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SegmentResponse {
    private UUID id;
    private Integer sequenceOrder;
    private Float startTime;   // seconds (float)
    private Float endTime;     // seconds (float)
    private String englishText; // full sentence — used for "show answer" mode
    private String blankText;  // sentence with ** placeholders
    private List<String> answerKeys;
}
