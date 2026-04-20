package com.ptit.mobile.backend.repository;

import com.ptit.mobile.backend.model.Vocabulary;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VocabularyRepository extends JpaRepository<Vocabulary, Long> {
    boolean existsByTermAndLessonVocabId(String term, Long lessonVocabId);

    List<Vocabulary> findAllByLessonVocabIdOrderByIdAsc(Long lessonVocabId);
}
