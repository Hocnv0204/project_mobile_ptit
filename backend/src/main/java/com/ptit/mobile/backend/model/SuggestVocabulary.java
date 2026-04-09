package com.ptit.mobile.backend.model;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "suggest_vocabulary")
@Getter
@Setter
public class SuggestVocabulary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(length = 100)
    private String term;

    @Column(columnDefinition = "TEXT")
    private String vietnamese;

    @Column(length = 50)
    private String type;

    @Column(length = 100)
    private String pronunciation;

    @Column(columnDefinition = "TEXT")
    private String example;

    @Column(name = "delete_flag")
    private Boolean deleteFlag;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id")
    private Lesson lesson;

    public SuggestVocabulary() {}

    @Override
    public String toString() {
        return "SuggestVocabulary{" +
                "example='" + example + '\'' +
                ", pronunciation='" + pronunciation + '\'' +
                ", type='" + type + '\'' +
                ", vietnamese='" + vietnamese + '\'' +
                ", term='" + term + '\'' +
                ", id=" + id +
                '}';
    }
}
