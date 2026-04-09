package com.ptit.mobile.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

import java.util.Date;

@Data
@Builder
@Table(name ="invalid_token")
@Entity
@NoArgsConstructor
@AllArgsConstructor
public class InvalidToken {
    @Id
    private String id ;
    @Column
    private Date expiryTime ;
}