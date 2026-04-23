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
    private Float startTime;
    private Float endTime;
    private String blankText;
    private List<String> answerKeys;
}
