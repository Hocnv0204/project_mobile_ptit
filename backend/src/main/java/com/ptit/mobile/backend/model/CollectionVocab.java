package com.ptit.mobile.backend.model;

import jakarta.persistence.*;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "collection_vocab")
@Getter
@Setter
@Builder
@AllArgsConstructor
public class CollectionVocab {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(length = 100)
    private String name;

    @OneToMany(mappedBy = "collection", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Vocabulary> vocabularies;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")

    private User user ;
    public CollectionVocab() {}


    @Override
    public String toString() {
        return "CollectionVocab{" +
                "name='" + name + '\'' +
                ", id=" + id +
                '}';
    }
}
