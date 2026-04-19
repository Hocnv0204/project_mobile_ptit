package com.ptit.mobile.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "status_lesson_writing_user")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatusLessonWritingUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "lesson_id")
    private Integer lessonId;

    @Column
    private Integer status;
}
