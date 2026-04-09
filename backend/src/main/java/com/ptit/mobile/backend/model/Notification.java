package com.ptit.mobile.backend.model;


import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "notification")
@Getter
@Setter
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_sender")
    private User userSender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_receive")
    private User userReceive;

    public Notification() {}

    @Override
    public String toString() {
        return "Notification{" +
                "isReaded=" + isRead +
                ", createdAt=" + createdAt +
                ", link='" + link + '\'' +
                ", message='" + message + '\'' +
                ", type='" + type + '\'' +
                ", id=" + id +
                '}';
    }
}
