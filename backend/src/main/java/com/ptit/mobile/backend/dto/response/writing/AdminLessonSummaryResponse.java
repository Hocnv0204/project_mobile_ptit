package com.ptit.mobile.backend.dto.response.writing;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AdminLessonSummaryResponse {
    private Integer id;
    private String name;
    private String topicName;
    private String levelName;
    private LocalDateTime createdAt;
    private Boolean deleteFlag;
}