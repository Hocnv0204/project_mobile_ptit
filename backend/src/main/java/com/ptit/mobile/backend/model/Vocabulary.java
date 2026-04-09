package com.ptit.mobile.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "vocabulary")
@Getter
@Setter
public class Vocabulary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(length = 100)
    private String term;

    @Column(columnDefinition = "TEXT")
    private String vi;

    @Column(length = 50)
    private String type;

    @Column(length = 100)
    private String pronunciation;

    @Column(columnDefinition = "TEXT")
    private String example;
    @Column
    private String audioUrl ;
    @Column
    private String imageUrl ;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collection_id")
    private CollectionVocab collection;

    @Column(name = "created_at")
    private LocalDateTime createdAt ;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    public Vocabulary() {}

    @Override
    public String toString() {
        return "Vocabulary{" +
                "example='" + example + '\'' +
                ", pronunciation='" + pronunciation + '\'' +
                ", type='" + type + '\'' +
                ", vi='" + vi + '\'' +
                ", term='" + term + '\'' +
                ", id=" + id +
                '}';
    }
}
