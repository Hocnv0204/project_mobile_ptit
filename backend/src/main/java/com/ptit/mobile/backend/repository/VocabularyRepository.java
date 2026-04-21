package com.ptit.mobile.backend.repository;

import com.ptit.mobile.backend.model.Vocabulary;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VocabularyRepository extends JpaRepository<Vocabulary, Long> {
    boolean existsByTermAndLessonVocabId(String term, Long lessonVocabId);

    List<Vocabulary> findAllByLessonVocabIdOrderByIdAsc(Long lessonVocabId);

    Optional<Vocabulary> findById(Integer id);

    @Query(value = "SELECT * FROM vocabulary WHERE lesson_vocab_id = :lessonId ORDER BY RAND()", nativeQuery = true)
    List<Vocabulary> findRandomByLessonVocabId(@Param("lessonId") Long lessonId, Pageable pageable);
}

