package com.ptit.mobile.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "lesson_writing")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonWriting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String paragraph;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 50)
    private String status;

    @Column(length = 50)
    private String type;

    @Column(name = "delete_flag")
    private Boolean deleteFlag;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "topic_id")
    private Integer topicId;

    @Column(name = "level_id")
    private Integer levelId;
}
