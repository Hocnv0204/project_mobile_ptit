package com.ptit.mobile.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_dictation_progress")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDictationProgress {

    @Id
    private UUID id;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "dictation_id")
    private UUID dictationId;

    @Column(name = "current_sequence")
    private Integer currentSequence;

    @Column(name = "completed_segments")
    private Integer completedSegments;

    @Column
    private String status;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
