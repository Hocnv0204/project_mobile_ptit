package com.ptit.mobile.backend.dto.request.auth;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateUserLevelRequest {
    @NotNull(message = "Level ID is required")
    private Long levelId;
}
