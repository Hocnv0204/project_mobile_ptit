package com.ptit.mobile.backend.repository.writing;

import com.ptit.mobile.backend.model.UserTranslationHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserTranslationHistoryRepository extends JpaRepository<UserTranslationHistory, Long> {
    List<UserTranslationHistory> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    Page<UserTranslationHistory> findAllByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}