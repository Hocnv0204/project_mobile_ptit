package com.ptit.mobile.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "dictation_segments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DictationSegment {

    @Id
    private UUID id;

    @Column(name = "dictation_id")
    private UUID dictationId;

    @Column(name = "sequence_order")
    private Integer sequenceOrder;

    @Column(name = "start_time")
    private Float startTime;

    @Column(name = "end_time")
    private Float endTime;

    @Column(name = "english_text", columnDefinition = "TEXT")
    private String englishText;

    @Column(name = "translation_text", columnDefinition = "TEXT")
    private String translationText;
}
