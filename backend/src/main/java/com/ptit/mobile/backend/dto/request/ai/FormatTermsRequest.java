package com.ptit.mobile.backend.dto.request.ai;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FormatTermsRequest {
    @NotBlank(message = "input is required")
    private String input;
}

