package com.ptit.mobile.backend.dto.response.writing;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserLessonProgressResponse {
    private Long id;
    private Long userId;
    private Integer lessonWritingId;
    private Integer currentOrderIndex;
    private Integer totalSentences;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
