package com.ptit.mobile.backend.dto.response.writing;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserTranslationHistoryResponse {
    private Long id;
    private Long userId;
    private Integer lessonWritingId;
    private Integer sentenceId;
    private String userAnswer;
    private String aiFeedbackJson;
    private Integer accuracyScore;
    private LocalDateTime createdAt;
    private String sentenceVi;
}
