package com.ptit.mobile.backend.dto.response.vocab;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VocabHomeStatsResponse {
    private Long total;
    private Long newWords;
    private Long dueToday;
    private Long overdue;
    private Long upcoming;
    private Long upcoming7d;
}

