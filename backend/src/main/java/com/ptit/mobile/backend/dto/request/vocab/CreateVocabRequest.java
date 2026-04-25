package com.ptit.mobile.backend.dto.request.vocab;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateVocabRequest {
    private String term;
    private String vi;
    private String type;
    private String pronunciation;
    private String example;
}
