package com.ptit.mobile.backend.service.impl;

import com.ptit.mobile.backend.dto.request.flashcard.SubmitReviewRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;
import com.ptit.mobile.backend.dto.response.flashcard.CardReviewResponse;
import com.ptit.mobile.backend.dto.response.flashcard.FlashcardSessionResponse;
import com.ptit.mobile.backend.dto.response.flashcard.ReviewResultResponse;
import com.ptit.mobile.backend.exception.BusinessException;
import com.ptit.mobile.backend.exception.ErrorCode;
import com.ptit.mobile.backend.model.CardReview;
import com.ptit.mobile.backend.model.ReviewLog;
import com.ptit.mobile.backend.model.Vocabulary;
import com.ptit.mobile.backend.repository.CardReviewRepository;
import com.ptit.mobile.backend.repository.LessonVocabRepository;
import com.ptit.mobile.backend.repository.ReviewLogRepository;
import com.ptit.mobile.backend.repository.VocabularyRepository;
import com.ptit.mobile.backend.security.SecurityUtils;
import com.ptit.mobile.backend.service.FlashcardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FlashcardServiceImpl implements FlashcardService {

    private static final double MIN_EASE_FACTOR = 1.3;

    private final CardReviewRepository cardReviewRepository;
    private final ReviewLogRepository reviewLogRepository;
    private final VocabularyRepository vocabularyRepository;
    private final LessonVocabRepository lessonVocabRepository;

    // ─────────────────────────────────────────────────────────────
    // GET SESSION
    // ─────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public BaseResponse getSession(Long lessonVocabId, String mode) {
        if (!lessonVocabRepository.existsById(Math.toIntExact(lessonVocabId))) {
            throw new BusinessException(ErrorCode.FLASHCARD_LESSON_VOCAB_NOT_FOUND);
        }

        String upperMode = mode != null ? mode.toUpperCase() : "DUE";
        boolean includeAll = "ALL".equals(upperMode);

        Long userId = SecurityUtils.getCurrentUserId();
        List<Vocabulary> vocabs = vocabularyRepository.findAllByLessonVocabIdOrderByIdAsc(lessonVocabId);

        // Khởi tạo card_review cho những từ chưa có
        for (Vocabulary vocab : vocabs) {
            long vocabId = vocab.getId().longValue();
            if (!cardReviewRepository.existsByUserIdAndVocabularyId(userId, vocabId)) {
                CardReview newCard = CardReview.builder()
                        .userId(userId)
                        .vocabularyId(vocabId)
                        .build();
                cardReviewRepository.save(newCard);
            }
        }

        // Lấy tất cả card_reviews của bài này
        List<CardReview> allCards = cardReviewRepository.findByUserIdAndLessonVocabId(userId, lessonVocabId);
        LocalDate today = LocalDate.now();

        List<CardReviewResponse> dueCards = new ArrayList<>();
        int upcomingCount = 0;

        for (CardReview card : allCards) {
            Vocabulary vocab = vocabs.stream()
                    .filter(v -> v.getId().longValue() == card.getVocabularyId().longValue())
                    .findFirst()
                    .orElse(null);

            if (vocab == null) continue;

            String status = resolveStatus(card, today);

            if (!includeAll && "UPCOMING".equals(status)) {
                upcomingCount++;
            } else {
                dueCards.add(buildCardResponse(card, vocab, status));
            }
        }

        // Sắp xếp: OVERDUE trước, DUE_TODAY sau, NEW, UPCOMING cuối
        dueCards.sort(Comparator.comparingInt(c -> statusOrder(c.getStatus())));

        FlashcardSessionResponse session = FlashcardSessionResponse.builder()
                .lessonVocabId(lessonVocabId)
                .dueCount(dueCards.size())
                .upcomingCount(upcomingCount)
                .dueCards(dueCards)
                .build();

        return BaseResponse.success(session);
    }

    // ─────────────────────────────────────────────────────────────
    // SUBMIT REVIEW (SM-2)
    // ─────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public BaseResponse submitReview(SubmitReviewRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        Long vocabularyId = request.getVocabularyId();
        int quality = request.getQuality();

        if (!vocabularyRepository.existsById(vocabularyId)) {
            throw new BusinessException(ErrorCode.FLASHCARD_VOCAB_NOT_FOUND);
        }

        CardReview card = cardReviewRepository.findByUserIdAndVocabularyId(userId, vocabularyId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FLASHCARD_CARD_REVIEW_NOT_FOUND));

        double efBefore = card.getEaseFactor();
        int intervalBefore = card.getIntervalDays();
        int repetitionBefore = card.getRepetition();

        // ── Tính EF mới theo công thức SM-2 ──────────────────────
        double efAfter = computeNewEF(efBefore, quality);

        // ── Tính interval mới ─────────────────────────────────────
        int intervalAfter;
        int newRepetition;

        if (quality < 3) {
            // Quên → reset
            newRepetition = 0;
            intervalAfter = 1;
        } else {
            newRepetition = repetitionBefore + 1;
            if (repetitionBefore == 0) {
                intervalAfter = 1;
            } else if (repetitionBefore == 1) {
                intervalAfter = 6;
            } else {
                intervalAfter = (int) Math.round(intervalBefore * efAfter);
            }
        }

        LocalDate nextReviewDate = LocalDate.now().plusDays(intervalAfter);

        // ── Lưu review log ────────────────────────────────────────
        ReviewLog log = ReviewLog.builder()
                .userId(userId)
                .cardReviewId(card.getId())
                .quality(quality)
                .easeFactorBefore(efBefore)
                .easeFactorAfter(efAfter)
                .intervalBefore(intervalBefore)
                .intervalAfter(intervalAfter)
                .reviewedAt(LocalDateTime.now())
                .build();
        reviewLogRepository.save(log);

        // ── Cập nhật card_review ──────────────────────────────────
        card.setRepetition(newRepetition);
        card.setEaseFactor(efAfter);
        card.setIntervalDays(intervalAfter);
        card.setNextReviewDate(nextReviewDate);
        card.setLastReviewedAt(LocalDateTime.now());
        cardReviewRepository.save(card);

        ReviewResultResponse result = ReviewResultResponse.builder()
                .vocabularyId(vocabularyId)
                .quality(quality)
                .easeFactorBefore(efBefore)
                .easeFactorAfter(efAfter)
                .intervalBefore(intervalBefore)
                .intervalAfter(intervalAfter)
                .nextReviewDate(nextReviewDate)
                .repetition(newRepetition)
                .build();

        return BaseResponse.success(result);
    }

    // ─────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────

    /**
     * Công thức SM-2:
     * EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
     * Tối thiểu 1.3
     */
    private double computeNewEF(double ef, int quality) {
        double delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
        double newEf = ef + delta;
        // Làm tròn 2 chữ số thập phân, tối thiểu MIN_EASE_FACTOR
        newEf = Math.max(MIN_EASE_FACTOR, Math.round(newEf * 100.0) / 100.0);
        return newEf;
    }

    private String resolveStatus(CardReview card, LocalDate today) {
        if (card.getLastReviewedAt() == null) {
            return "NEW";
        }
        if (card.getNextReviewDate().isBefore(today)) {
            return "OVERDUE";
        }
        if (card.getNextReviewDate().isEqual(today)) {
            return "DUE_TODAY";
        }
        return "UPCOMING";
    }

    private int statusOrder(String status) {
        return switch (status) {
            case "OVERDUE" -> 0;
            case "DUE_TODAY" -> 1;
            case "NEW" -> 2;
            default -> 3;
        };
    }

    private CardReviewResponse buildCardResponse(CardReview card, Vocabulary vocab, String status) {
        return CardReviewResponse.builder()
                .id(card.getId())
                .vocabularyId(card.getVocabularyId())
                .term(vocab.getTerm())
                .vi(vocab.getVi())
                .type(vocab.getType())
                .pronunciation(vocab.getPronunciation())
                .example(vocab.getExample())
                .audioUrl(vocab.getAudioUrl())
                .imageUrl(vocab.getImageUrl())
                .repetition(card.getRepetition())
                .easeFactor(card.getEaseFactor())
                .intervalDays(card.getIntervalDays())
                .nextReviewDate(card.getNextReviewDate())
                .lastReviewedAt(card.getLastReviewedAt())
                .status(status)
                .build();
    }
}
