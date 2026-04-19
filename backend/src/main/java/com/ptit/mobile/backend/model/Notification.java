package com.ptit.mobile.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notification")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(length = 50)
    private String type;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(length = 255)
    private String link;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "is_read")
    private Boolean isRead;

    @Column(name = "user_sender")
    private Long userSender;

    @Column(name = "user_receive")
    private Long userReceive;
}
