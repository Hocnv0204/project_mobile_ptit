package com.ptit.mobile.backend.repository;

import com.ptit.mobile.backend.model.LessonVocab;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LessonVocabRepository extends JpaRepository<LessonVocab, Integer> {
    Optional<LessonVocab> findByIdAndDeleteFlagFalse(Integer id);

    List<LessonVocab> findAllByDeleteFlagFalseOrderByIdAsc();

    boolean existsByNameAndLevelIdAndDeleteFlagFalse(String name, Integer levelId);

    boolean existsByNameAndUserIdAndDeleteFlagFalse(String name, Long userId);

    boolean existsByNameAndUserIdAndLevelIdAndDeleteFlagFalse(String name, Long userId, Integer levelId);


    List<LessonVocab> findAllByUserIdAndDeleteFlagFalseOrderByIdAsc(Long userId);

    @Query("SELECT lv FROM LessonVocab lv JOIN User u ON lv.userId = u.id " +
           "WHERE u.username = :username AND lv.levelId = :levelId AND lv.deleteFlag = false ORDER BY lv.id ASC")
    List<LessonVocab> findAllByUsernameAndLevelIdAndDeleteFlagFalse(
            @Param("username") String username,
            @Param("levelId") Long levelId);

    @Query("SELECT lv FROM LessonVocab lv JOIN User u ON lv.userId = u.id " +
           "WHERE u.username = :username AND lv.deleteFlag = false ORDER BY lv.id ASC")
    List<LessonVocab> findAllByUsernameAndDeleteFlagFalse(@Param("username") String username);
}

