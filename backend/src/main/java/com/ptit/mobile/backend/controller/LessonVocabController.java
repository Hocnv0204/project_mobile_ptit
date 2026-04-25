package com.ptit.mobile.backend.controller;

import com.ptit.mobile.backend.dto.request.lessonvocab.CreateLessonVocabRequest;
import com.ptit.mobile.backend.dto.request.lessonvocab.CreateLessonVocabSimpleRequest;
import com.ptit.mobile.backend.dto.request.lessonvocab.UpdateLessonVocabRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;
import com.ptit.mobile.backend.dto.response.vocab.VocabularyWithStatusResponse;
import com.ptit.mobile.backend.model.CardReview;
import com.ptit.mobile.backend.model.Vocabulary;
import com.ptit.mobile.backend.repository.CardReviewRepository;
import com.ptit.mobile.backend.repository.VocabularyRepository;
import com.ptit.mobile.backend.security.SecurityUtils;
import com.ptit.mobile.backend.service.LessonVocabService;
import com.ptit.mobile.backend.utils.DataUtils;
import com.ptit.mobile.backend.utils.PaginationUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.support.PageableUtils;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/lesson-vocab")
@RequiredArgsConstructor
@Tag(name = "Lesson Vocab", description = "CRUD lesson từ vựng theo level")
public class LessonVocabController {
    private final LessonVocabService lessonVocabService;
    private final VocabularyRepository vocabularyRepository;
    private final CardReviewRepository cardReviewRepository;

    @Operation(summary = "Tạo lesson vocab", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping
    public BaseResponse create(@Valid @RequestBody CreateLessonVocabRequest request) {
        return lessonVocabService.create(request);
    }

    @Operation(summary = "Tạo lesson vocab (không cần levelId)", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/simple")
    public BaseResponse createSimple(@Valid @RequestBody CreateLessonVocabSimpleRequest request) {
        return lessonVocabService.createSimple(request);
    }

    @Operation(summary = "Danh sách lesson vocab", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping
    public BaseResponse getAll() {
        return lessonVocabService.getAll();
    }

    @Operation(summary = "Chi tiết lesson vocab", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/{id}")
    public BaseResponse getById(@PathVariable Integer id) {
        return lessonVocabService.getById(id);
    }

    @Operation(summary = "Cập nhật lesson vocab", security = @SecurityRequirement(name = "bearerAuth"))
    @PutMapping("/{id}")
    public BaseResponse update(@PathVariable Integer id, @Valid @RequestBody UpdateLessonVocabRequest request) {
        return lessonVocabService.update(id, request);
    }

    @Operation(summary = "Xoá lesson vocab (soft delete)", security = @SecurityRequirement(name = "bearerAuth"))
    @DeleteMapping("/{id}")
    public BaseResponse delete(@PathVariable Integer id) {
        return lessonVocabService.delete(id);
    }

    @Operation(summary = "Danh sách vocabulary theo lesson", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/{id}/vocabularies")
    public BaseResponse getVocabularies(@PathVariable("id") Long lessonVocabId) {
        Long userId = SecurityUtils.getCurrentUserId();
        LocalDate today = LocalDate.now();

        List<Vocabulary> vocabs = vocabularyRepository.findAllByLessonVocabIdOrderByIdAsc(lessonVocabId);
        List<Long> vocabIds = vocabs.stream().map(v -> v.getId().longValue()).toList();

        Map<Long, CardReview> cardReviewMap = cardReviewRepository
                .findByUserIdAndVocabularyIdIn(userId, vocabIds)
                .stream()
                .collect(Collectors.toMap(CardReview::getVocabularyId, Function.identity()));

        List<VocabularyWithStatusResponse> result = vocabs.stream()
                .map(v -> {
                    CardReview card = cardReviewMap.get(v.getId().longValue());
                    String status = resolveStatus(card, today);
                    LocalDate nextReviewDate = resolveNextReviewDate(card, today);
                    long daysUntilReview = Math.max(0, ChronoUnit.DAYS.between(today, nextReviewDate));
                    return VocabularyWithStatusResponse.builder()
                            .id(v.getId())
                            .term(v.getTerm())
                            .vi(v.getVi())
                            .type(v.getType())
                            .pronunciation(v.getPronunciation())
                            .example(v.getExample())
                            .audioUrl(v.getAudioUrl())
                            .imageUrl(v.getImageUrl())
                            .status(status)
                            .nextReviewDate(nextReviewDate)
                            .daysUntilReview(daysUntilReview)
                            .build();
                })
                .toList();

        return BaseResponse.success(result);
    }

    private String resolveStatus(CardReview card, LocalDate today) {
        if (card == null || card.getLastReviewedAt() == null) {
            return "NEW";
        }
        if (card.getNextReviewDate() != null && card.getNextReviewDate().isBefore(today)) {
            return "OVERDUE";
        }
        if (card.getNextReviewDate() != null && card.getNextReviewDate().isEqual(today)) {
            return "DUE_TODAY";
        }
        return "UPCOMING";
    }

    private LocalDate resolveNextReviewDate(CardReview card, LocalDate today) {
        if (card == null || card.getNextReviewDate() == null) {
            return today;
        }
        // Overdue / Due today / Upcoming đều trả về next_review_date; UI sẽ hiển thị daysUntilReview (>=0)
        return card.getNextReviewDate();
    }

    @Operation(summary = "Danh sách lesson vocab theo userId (bài cá nhân)", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/user/{userId}")
    public BaseResponse getByUserId(@PathVariable("userId") Long userId) {
        return lessonVocabService.getByUserId(userId);
    }

    @Operation(summary = "Danh sách lesson vocab hệ thống theo username và levelId", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/system")
    public BaseResponse getSystemLessons(){
        return lessonVocabService.getByUsernameAndLevel();
    }

    @GetMapping("/admin")
    public BaseResponse getLessonCms(
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "size", required = false) Integer size,
            @RequestParam(value = "sort", required = false) String sort,
            @RequestParam(value = "order", required = false) String order
            ){
        Pageable pageable = PaginationUtils.createPageable(page, size, sort, order);
        return lessonVocabService.getLessonVocabCms(pageable);
    }
}
