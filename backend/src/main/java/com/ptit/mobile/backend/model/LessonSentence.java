package com.ptit.mobile.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "lesson_sentence")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonSentence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "lesson_writing_id")
    private Integer lessonWritingId;

    @Column(name = "sentence_vi", columnDefinition = "TEXT")
    private String sentenceVi;

    @Column(name = "order_index")
    private Integer orderIndex;
}
