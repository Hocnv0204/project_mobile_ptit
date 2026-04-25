package com.ptit.mobile.backend.dto.request.topic;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminCreateTopicRequest {

    @NotBlank(message = "Tên topic không được để trống")
    private String name;

    private String description;

    private String note;
}
