package com.ptit.mobile.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "lesson_vocab")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonVocab {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(length = 100)
    private String name;

    @Column(name = "create_by", length = 100)
    private String createBy;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "level_id")
    private Integer levelId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "delete_flag")
    private Boolean deleteFlag;
}
