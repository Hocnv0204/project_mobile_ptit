package com.ptit.mobile.backend.repository;

import com.ptit.mobile.backend.model.SuggestVocabulary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SuggestVocabularyRepository extends JpaRepository<SuggestVocabulary, Integer> {

    @Query("SELECT sv FROM SuggestVocabulary sv " +
            "WHERE sv.deleteFlag = false " +
            "AND sv.lessonWritingId = :lessonId")
    Page<SuggestVocabulary> findSuggestVocabulariesByLessonId(@Param("lessonId") Integer lessonId, Pageable pageable);

    /**
     * Delete all SuggestVocabulary entries for a specific lesson.
     */
    @Modifying
    @Query("DELETE FROM SuggestVocabulary sv WHERE sv.lessonWritingId = :lessonId")
    void deleteAllByLessonWritingId(@Param("lessonId") Integer lessonId);
}
