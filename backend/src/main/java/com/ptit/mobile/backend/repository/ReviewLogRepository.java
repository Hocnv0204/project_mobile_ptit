package com.ptit.mobile.backend.repository;

import com.ptit.mobile.backend.model.ReviewLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewLogRepository extends JpaRepository<ReviewLog, Long> {

    List<ReviewLog> findByCardReviewIdOrderByReviewedAtDesc(Long cardReviewId);

    List<ReviewLog> findByUserIdOrderByReviewedAtDesc(Long userId);
}
