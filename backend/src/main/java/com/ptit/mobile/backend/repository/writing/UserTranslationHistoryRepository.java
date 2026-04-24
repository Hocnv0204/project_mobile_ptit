package com.ptit.mobile.backend.repository.writing;

import com.ptit.mobile.backend.model.UserTranslationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserTranslationHistoryRepository extends JpaRepository<UserTranslationHistory, Long> {
}