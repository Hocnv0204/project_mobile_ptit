package com.ptit.mobile.backend.dto.response.topic;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class AdminTopicResponse {

    private Integer id;
    private String name;
    private String description;
    private LocalDateTime createdAt;
    private Boolean deleteFlag;
}
