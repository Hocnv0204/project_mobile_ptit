package com.ptit.mobile.backend.dto.response.ai;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TermFormatResult {
    private String term;
    private String vi;
    private String type;
    private String pronunciation;
    private String example;
}

