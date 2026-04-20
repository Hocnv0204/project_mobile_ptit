package com.ptit.mobile.backend.repository;

import com.ptit.mobile.backend.model.LessonVocab;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LessonVocabRepository extends JpaRepository<LessonVocab, Integer> {
    Optional<LessonVocab> findByIdAndDeleteFlagFalse(Integer id);

    List<LessonVocab> findAllByDeleteFlagFalseOrderByIdAsc();

    boolean existsByNameAndLevelIdAndDeleteFlagFalse(String name, Integer levelId);

    boolean existsByNameAndLevelIdIsNullAndDeleteFlagFalse(String name);
}

