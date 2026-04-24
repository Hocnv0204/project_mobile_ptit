package com.ptit.mobile.backend.repository;

import com.ptit.mobile.backend.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {

    List<Notification> findByUserReceiveOrderByCreatedAtDesc(Long userId);
}
