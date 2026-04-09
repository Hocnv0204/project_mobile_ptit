package com.ptit.mobile.backend.model;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "level")
@Getter
@Setter
public class Level {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "delete_flag")
    private Boolean deleteFlag;

    public Level() {
    }

    @Override
    public String toString() {
        return "Level{" + "deleteFlag=" + deleteFlag + ", updatedAt=" + updatedAt + ", createdAt=" + createdAt + ", description='" + description + '\'' + ", name='" + name + '\'' + ", id=" + id + '}';
    }
}