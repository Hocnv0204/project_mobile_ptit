package com.ptit.mobile.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "streak_activities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StreakActivity {

    @Id
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "activity_type", length = 50)
    private String activityType;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
