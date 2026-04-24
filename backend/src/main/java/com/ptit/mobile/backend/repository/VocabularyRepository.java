package com.ptit.mobile.backend.repository;

import com.ptit.mobile.backend.model.Vocabulary;
import com.ptit.mobile.backend.repository.projection.VocabHomeStatsProjection;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface VocabularyRepository extends JpaRepository<Vocabulary, Long> {
    boolean existsByTermAndLessonVocabId(String term, Long lessonVocabId);

    List<Vocabulary> findAllByLessonVocabIdOrderByIdAsc(Long lessonVocabId);

    Optional<Vocabulary> findById(Integer id);

    @Query(value = "SELECT * FROM vocabulary WHERE lesson_vocab_id = :lessonId ORDER BY RAND()", nativeQuery = true)
    List<Vocabulary> findRandomByLessonVocabId(@Param("lessonId") Long lessonId, Pageable pageable);

    @Query(value = """
            
                SELECT
                                       COUNT(v.id) AS total,
                                       SUM(CASE WHEN cr.id IS NULL OR cr.last_reviewed_at IS NULL THEN 1 ELSE 0 END) AS newWords,
                                       SUM(CASE WHEN cr.id IS NOT NULL AND cr.last_reviewed_at IS NOT NULL AND cr.next_review_date = :today THEN 1 ELSE 0 END) AS dueToday,
                                       SUM(CASE WHEN cr.id IS NOT NULL AND cr.last_reviewed_at IS NOT NULL AND cr.next_review_date < :today THEN 1 ELSE 0 END) AS overdue,
                                       SUM(CASE WHEN cr.id IS NOT NULL AND cr.last_reviewed_at IS NOT NULL AND cr.next_review_date > :today THEN 1 ELSE 0 END) AS upcoming,
                                       SUM(CASE WHEN cr.id IS NOT NULL AND cr.last_reviewed_at IS NOT NULL
                                                 AND cr.next_review_date > :today AND cr.next_review_date <= :todayPlus7 THEN 1 ELSE 0 END) AS upcoming7d
                                     FROM vocabulary v
                                     JOIN lesson_vocab lv
                                       ON lv.id = v.lesson_vocab_id
                                      AND (lv.delete_flag IS NULL OR lv.delete_flag = FALSE)
                                     LEFT JOIN card_reviews cr
                                       ON cr.vocabulary_id = v.id
                                      AND cr.user_id = :userId
                                     WHERE
                                       lv.user_id = :userId
                                       OR cr.id IS NOT NULL;
            """, nativeQuery = true)
    VocabHomeStatsProjection getHomeStatsForUser(@Param("userId") Long userId, @Param("today") LocalDate today, @Param("todayPlus7") LocalDate todayPlus7);
}

