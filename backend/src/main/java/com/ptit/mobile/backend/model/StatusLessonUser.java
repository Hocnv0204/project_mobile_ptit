package com.ptit.mobile.backend.model;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "status_leson_user")
@Getter
@Setter
public class StatusLessonUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id")
    private Lesson lesson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status")
    private StatusLesson statusLesson;

    public StatusLessonUser() {}

    @Override
    public String toString() {
        return "StatusLessonUser{" +
                "id=" + id +
                '}';
    }
}
