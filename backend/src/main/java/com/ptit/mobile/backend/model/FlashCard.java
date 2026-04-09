package com.ptit.mobile.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Entity
@Table(name = "flash_card")
@Data
@Builder
@RequiredArgsConstructor
@AllArgsConstructor
public class FlashCard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id  ;
    @Column
    private String imageUrl ;
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vocab_id")
    private Vocabulary vocabulary ;
}
