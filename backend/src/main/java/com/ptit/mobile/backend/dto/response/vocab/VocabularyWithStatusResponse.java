package com.ptit.mobile.backend.dto.response.vocab;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class VocabularyWithStatusResponse {
    private Integer id;
    private String term;
    private String vi;
    private String type;
    private String pronunciation;
    private String example;
    private String audioUrl;
    private String imageUrl;

    /** NEW, DUE_TODAY, OVERDUE, UPCOMING */
    private String status;
}

