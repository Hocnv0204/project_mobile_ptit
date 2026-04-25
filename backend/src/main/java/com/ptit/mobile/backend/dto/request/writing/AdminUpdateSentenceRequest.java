package com.ptit.mobile.backend.dto.request.writing;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUpdateSentenceRequest {

    private String sentenceVi;

    private Integer orderIndex;
}
