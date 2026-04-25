package com.ptit.mobile.backend.repository;

import com.ptit.mobile.backend.model.UserDictationProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserDictationProgressRepository extends JpaRepository<UserDictationProgress, UUID> {

    Optional<UserDictationProgress> findByUserIdAndDictationId(Long userId, UUID dictationId);

    List<UserDictationProgress> findByUserId(Long userId);

    void deleteByDictationId(UUID dictationId);
}
