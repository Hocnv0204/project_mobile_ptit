package com.ptit.mobile.backend.repository;

import com.ptit.mobile.backend.model.UserDeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserDeviceTokenRepository extends JpaRepository<UserDeviceToken, Long> {

    List<UserDeviceToken> findByUserId(Long userId);

    Optional<UserDeviceToken> findByExpoPushToken(String expoPushToken);
}
