package com.ptit.mobile.backend.dto.request.user;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateLevelRequest {
    @NotNull(message = "Level ID is required")
    private Long levelId;
}
