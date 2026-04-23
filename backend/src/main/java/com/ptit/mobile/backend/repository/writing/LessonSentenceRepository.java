package com.ptit.mobile.backend.repository.writing;

import com.ptit.mobile.backend.model.LessonSentence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonSentenceRepository extends JpaRepository<LessonSentence, Integer> {
    List<LessonSentence> findAllByLessonWritingIdOrderByOrderIndexAsc(Integer lessonWritingId);
}
