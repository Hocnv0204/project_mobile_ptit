package com.ptit.mobile.backend.repository;

import com.ptit.mobile.backend.model.CardReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Collection;

@Repository
public interface CardReviewRepository extends JpaRepository<CardReview, Long> {

    Optional<CardReview> findByUserIdAndVocabularyId(Long userId, Long vocabularyId);

    List<CardReview> findByUserIdAndVocabularyIdIn(Long userId, Collection<Long> vocabularyIds);

    /** Lấy các thẻ đến hạn ôn hôm nay (next_review_date <= today) */
    @Query("SELECT c FROM CardReview c WHERE c.userId = :userId AND c.nextReviewDate <= :today ORDER BY c.nextReviewDate ASC")
    List<CardReview> findDueCards(@Param("userId") Long userId, @Param("today") LocalDate today);

    /** Lấy tất cả card_reviews của user trong một bài học */
    @Query("""
        SELECT c FROM CardReview c
        WHERE c.userId = :userId
          AND c.vocabularyId IN (
              SELECT v.id FROM Vocabulary v WHERE v.lessonVocabId = :lessonVocabId
          )
        ORDER BY c.nextReviewDate ASC
    """)
    List<CardReview> findByUserIdAndLessonVocabId(@Param("userId") Long userId,
                                                   @Param("lessonVocabId") Long lessonVocabId);

    boolean existsByUserIdAndVocabularyId(Long userId, Long vocabularyId);
}
