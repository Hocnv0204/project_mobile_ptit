package com.ptit.mobile.backend.service.writing.impl;

import com.ptit.mobile.backend.common.exception.NotFoundException;
import com.ptit.mobile.backend.dto.request.writing.GradingRequest;
import com.ptit.mobile.backend.dto.request.writing.UpdateProgressRequest;
import com.ptit.mobile.backend.dto.response.writing.GradingResponse;
import com.ptit.mobile.backend.dto.response.writing.LessonResponse;
import com.ptit.mobile.backend.dto.response.writing.LessonSummaryResponse;
import com.ptit.mobile.backend.dto.response.writing.UserLessonProgressResponse;
import com.ptit.mobile.backend.dto.response.writing.UserTranslationHistoryResponse;
import com.ptit.mobile.backend.mapper.lesson.LessonMapper;
import com.ptit.mobile.backend.model.LessonSentence;
import com.ptit.mobile.backend.model.LessonWriting;
import com.ptit.mobile.backend.model.SuggestVocabulary;
import com.ptit.mobile.backend.model.UserLessonProgress;
import com.ptit.mobile.backend.model.UserTranslationHistory;
import com.ptit.mobile.backend.repository.writing.LessonWritingRepository;
import com.ptit.mobile.backend.repository.writing.LessonSentenceRepository;
import com.ptit.mobile.backend.repository.writing.SuggestVocabularyRepository;
import com.ptit.mobile.backend.repository.writing.UserLessonProgressRepository;
import com.ptit.mobile.backend.repository.writing.UserTranslationHistoryRepository;
import com.ptit.mobile.backend.service.StreakService;
import com.ptit.mobile.backend.service.writing.LessonService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LessonServiceImpl implements LessonService {

    private final LessonWritingRepository lessonWritingRepository;
    private final SuggestVocabularyRepository suggestVocabularyRepository;
    private final LessonMapper lessonMapper;
    private final LessonGradingService lessonGradingService;
    private final LessonSentenceRepository lessonSentenceRepository;
    private final UserLessonProgressRepository userLessonProgressRepository;
    private final UserTranslationHistoryRepository userTranslationHistoryRepository;
    private final ObjectMapper objectMapper;
    private final StreakService streakService;

    @Override
    public GradingResponse gradeAnswer(GradingRequest request, Long userId) {
        // update streak
        streakService.updateStreak(userId);

        String providerType = request.getAiProvider() != null ? request.getAiProvider() : "groq";
        String suggestVocab = String.join(", ", request.getSuggestVocabularies());
        GradingResponse response = lessonGradingService.gradeAnswer(
                request.getQuestion(),
                request.getAnswer(),
                suggestVocab,
                providerType
        );

        // Lưu kết quả vào UserTranslationHistory
        try {
            LessonSentence sentence = lessonSentenceRepository.findById(request.getSentenceId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy câu với ID: " + request.getSentenceId()));

            String aiFeedbackJson = objectMapper.writeValueAsString(response);

            UserTranslationHistory history = UserTranslationHistory.builder()
                    .userId(userId)
                    .lessonWritingId(sentence.getLessonWritingId())
                    .sentenceId(request.getSentenceId())
                    .userAnswer(request.getAnswer())
                    .aiFeedbackJson(aiFeedbackJson)
                    .accuracyScore(response.getAccuracyScore())
                    .createdAt(LocalDateTime.now())
                    .build();

            userTranslationHistoryRepository.save(history);
        } catch (Exception e) {
            // Log lỗi nhưng không làm gián đoạn response
            System.err.println("Lỗi khi lưu UserTranslationHistory: " + e.getMessage());
        }

        return response;
    }

    @Override
    public Page<LessonSummaryResponse> getAllLessonsForUser(
            String searchTerm, Integer topicId, Integer levelId,
            int page, int size, String sortBy, String sortDir) {

        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Specification<LessonWriting> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("deleteFlag"), false));

            if (StringUtils.hasText(searchTerm)) {
                predicates.add(cb.like(cb.lower(root.get("name")), "%" + searchTerm.toLowerCase() + "%"));
            }
            if (topicId != null) {
                predicates.add(cb.equal(root.get("topicId"), topicId));
            }
            if (levelId != null) {
                predicates.add(cb.equal(root.get("levelId"), levelId));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<LessonWriting> lessonPage = lessonWritingRepository.findAll(spec, pageable);
        return lessonPage.map(lessonMapper::toSummaryResponse);
    }

    @Override
    public LessonResponse getLessonDetails(Integer lessonId) {
        LessonWriting lesson = lessonWritingRepository.findById(lessonId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bài học với ID: " + lessonId));

        List<LessonSentence> sentences = lessonSentenceRepository.findAllByLessonWritingIdOrderByOrderIndexAsc(lessonId);
        
        List<SuggestVocabulary> vocabularies = new ArrayList<>();
        if (!sentences.isEmpty()) {
            List<Integer> sentenceIds = sentences.stream().map(LessonSentence::getId).toList();
            vocabularies = suggestVocabularyRepository.findByLessonSentenceIdIn(sentenceIds);
        }
        
        return lessonMapper.toResponse(lesson, sentences, vocabularies);
    }

    @Override
    public UserLessonProgressResponse getLessonProgress(Long userId, Integer lessonId) {
        Optional<UserLessonProgress> progressOpt = userLessonProgressRepository
                .findByUserIdAndLessonWritingId(userId, lessonId);

        if (progressOpt.isPresent()) {
            UserLessonProgress progress = progressOpt.get();
            return UserLessonProgressResponse.builder()
                    .id(progress.getId())
                    .userId(progress.getUserId())
                    .lessonWritingId(progress.getLessonWritingId())
                    .currentOrderIndex(progress.getCurrentOrderIndex())
                    .totalSentences(progress.getTotalSentences())
                    .status(progress.getStatus())
                    .createdAt(progress.getCreatedAt())
                    .updatedAt(progress.getUpdatedAt())
                    .build();
        }

        // User chưa từng làm bài này → trả về default với currentOrderIndex = 1
        return UserLessonProgressResponse.builder()
                .userId(userId)
                .lessonWritingId(lessonId)
                .currentOrderIndex(1)
                .build();
    }

    @Override
    public void updateLessonProgress(UpdateProgressRequest request, Long userId) {
        Optional<UserLessonProgress> existingProgress = userLessonProgressRepository
                .findByUserIdAndLessonWritingId(userId, request.getLessonWritingId());

        if (existingProgress.isPresent()) {
            // Cập nhật currentOrderIndex
            UserLessonProgress progress = existingProgress.get();
            progress.setCurrentOrderIndex(request.getCurrentOrderIndex());
            progress.setUpdatedAt(LocalDateTime.now());
            userLessonProgressRepository.save(progress);
        } else {
            // Tạo mới
            Optional<LessonWriting> existingLesson = lessonWritingRepository.findById(request.getLessonWritingId());
            if (existingLesson.isPresent()) {
                LessonWriting lesson = existingLesson.get();
                UserLessonProgress newProgress = UserLessonProgress.builder()
                        .userId(userId)
                        .lessonWritingId(request.getLessonWritingId())
                        .currentOrderIndex(request.getCurrentOrderIndex())
                        .totalSentences(lesson.getTotalSentences())
                        .status("IN_PROGRESS") // Giả sử status mặc định
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
                userLessonProgressRepository.save(newProgress);
            }
        }
    }

    @Override
    public Page<UserLessonProgressResponse> getMyLessonsProgress(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        Page<UserLessonProgress> progressPage = userLessonProgressRepository
                .findAllByUserIdOrderByUpdatedAtDesc(userId, pageable);

        if (progressPage.isEmpty()) {
            return progressPage.map(p -> UserLessonProgressResponse.builder().build());
        }

        List<Integer> lessonIds = progressPage.getContent().stream()
                .map(UserLessonProgress::getLessonWritingId)
                .toList();

        List<LessonWriting> lessons = lessonWritingRepository.findAllById(lessonIds);
        java.util.Map<Integer, LessonWriting> lessonMap = lessons.stream()
                .collect(java.util.stream.Collectors.toMap(LessonWriting::getId, l -> l));

        List<UserLessonProgressResponse> content = progressPage.getContent().stream().map(progress -> {
            UserLessonProgressResponse response = UserLessonProgressResponse.builder()
                    .id(progress.getId())
                    .userId(progress.getUserId())
                    .lessonWritingId(progress.getLessonWritingId())
                    .currentOrderIndex(progress.getCurrentOrderIndex())
                    .totalSentences(progress.getTotalSentences())
                    .status(progress.getStatus())
                    .createdAt(progress.getCreatedAt())
                    .updatedAt(progress.getUpdatedAt())
                    .build();

            LessonWriting lesson = lessonMap.get(progress.getLessonWritingId());
            if (lesson != null) {
                response.setLessonName(lesson.getName());
                response.setLessonDescription(lesson.getDescription());
            }

            return response;
        }).toList();

        return new PageImpl<>(content, pageable, progressPage.getTotalElements());
    }

    @Override
    public Page<UserTranslationHistoryResponse> getTranslationHistory(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<UserTranslationHistory> historyPage = userTranslationHistoryRepository
                .findAllByUserIdOrderByCreatedAtDesc(userId, pageable);

        if (historyPage.isEmpty()) {
            return historyPage.map(h -> lessonMapper.toHistoryResponse(h, "N/A"));
        }

        // Lấy danh sách sentenceId của page hiện tại để fetch sentenceVi một lần
        List<Integer> sentenceIds = historyPage.getContent().stream()
                .map(UserTranslationHistory::getSentenceId)
                .distinct()
                .toList();

        List<LessonSentence> sentences = lessonSentenceRepository.findAllById(sentenceIds);
        java.util.Map<Integer, String> sentenceMap = sentences.stream()
                .collect(java.util.stream.Collectors.toMap(LessonSentence::getId, LessonSentence::getSentenceVi));

        List<UserTranslationHistoryResponse> content = historyPage.getContent().stream()
                .map(history -> {
                    String sentenceVi = sentenceMap.getOrDefault(history.getSentenceId(), "N/A");
                    return lessonMapper.toHistoryResponse(history, sentenceVi);
                })
                .toList();

        return new PageImpl<>(content, pageable, historyPage.getTotalElements());
    }
}
