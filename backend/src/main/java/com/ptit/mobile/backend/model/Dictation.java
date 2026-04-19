package com.ptit.mobile.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "dictations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dictation {

    @Id
    private UUID id;

    @Column
    private String title;

    @Column(name = "media_url")
    private String mediaUrl;

    @Column(name = "total_segments")
    private Integer totalSegments;
}
