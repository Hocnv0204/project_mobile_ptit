package com.ptit.mobile.backend.repository.writing;

import com.ptit.mobile.backend.model.UserLessonProgress;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserLessonProgressRepository extends JpaRepository<UserLessonProgress, Long> {
    Optional<UserLessonProgress> findByUserIdAndLessonWritingId(Long userId, Integer lessonWritingId);

    List<UserLessonProgress> findAllByUserIdOrderByUpdatedAtDesc(Long userId);

    Page<UserLessonProgress> findAllByUserIdOrderByUpdatedAtDesc(Long userId, Pageable pageable);
}
