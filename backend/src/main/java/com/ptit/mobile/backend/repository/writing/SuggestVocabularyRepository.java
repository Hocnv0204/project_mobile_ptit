package com.ptit.mobile.backend.repository.writing;

import com.ptit.mobile.backend.model.SuggestVocabulary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SuggestVocabularyRepository extends JpaRepository<SuggestVocabulary, Integer> {

    List<SuggestVocabulary> findByLessonSentenceIdIn(List<Integer> lessonSentenceIds);

    /**
     * Delete all SuggestVocabulary entries for specific lesson sentences.
     */
    @Modifying
    @Query("DELETE FROM SuggestVocabulary sv WHERE sv.lessonSentenceId IN :lessonSentenceIds")
    void deleteAllByLessonSentenceIdIn(@Param("lessonSentenceIds") List<Integer> lessonSentenceIds);
}
