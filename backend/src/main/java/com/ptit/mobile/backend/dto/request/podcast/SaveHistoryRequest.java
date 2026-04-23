package com.ptit.mobile.backend.dto.request.podcast;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaveHistoryRequest {
    private Integer podcastId;
    private Integer progressSeconds;
    private Boolean isCompleted;
}
