package com.ptit.mobile.backend.model;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Entity
@Table(name = "status_lesson")
@Getter
@Setter
public class StatusLesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "name_status", length = 20)
    private String nameStatus;

    @OneToMany(mappedBy = "statusLesson", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<StatusLessonUser> statusLessonUsers;

    public StatusLesson() {}

    @Override
    public String toString() {
        return "StatusLesson{" +
                "nameStatus='" + nameStatus + '\'' +
                ", id=" + id +
                '}';
    }
}