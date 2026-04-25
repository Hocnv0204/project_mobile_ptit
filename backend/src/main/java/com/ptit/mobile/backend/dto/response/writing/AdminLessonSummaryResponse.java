package com.ptit.mobile.backend.dto.response.writing;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AdminLessonSummaryResponse {
    private Integer id;
    private String name;
    private String status;
    private Boolean deleteFlag;
    private Integer topicId;
    private String topicName;
    private Integer levelId;
    private String levelName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}