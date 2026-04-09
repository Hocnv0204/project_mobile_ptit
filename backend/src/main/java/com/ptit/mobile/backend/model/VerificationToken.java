package com.ptit.mobile.backend.model;


import com.ptit.mobile.backend.common.constant.TypeToken;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


import java.time.LocalDateTime;


@Entity
@Table(name = "verification_token")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class VerificationToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id ;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    User user ;

    @Column(name = "token")
    private String token ;
    @Column(name = "expired_time")
    private LocalDateTime expiryTime  = LocalDateTime.now().plusHours(1);

    @Column(name = "token_type")
    @Enumerated(EnumType.STRING) // or EnumType.ORDINAL based on your DB column
    private TypeToken typeToken;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now() ;


    public boolean isExpiry(){
        return LocalDateTime.now().isAfter(expiryTime) ;
    }



}
