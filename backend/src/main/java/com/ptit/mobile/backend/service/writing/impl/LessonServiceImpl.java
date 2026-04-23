package com.ptit.mobile.backend.service.writing.impl;

import com.ptit.mobile.backend.common.exception.NotFoundException;
import com.ptit.mobile.backend.dto.request.writing.GradingRequest;
import com.ptit.mobile.backend.dto.response.writing.GradingResponse;
import com.ptit.mobile.backend.dto.response.writing.LessonResponse;
import com.ptit.mobile.backend.dto.response.writing.LessonSummaryResponse;
import com.ptit.mobile.backend.dto.response.writing.UserLessonProgressResponse;
import com.ptit.mobile.backend.mapper.lesson.LessonMapper;
import com.ptit.mobile.backend.model.LessonSentence;
import com.ptit.mobile.backend.model.LessonWriting;
import com.ptit.mobile.backend.model.SuggestVocabulary;
import com.ptit.mobile.backend.model.UserLessonProgress;
import com.ptit.mobile.backend.repository.writing.LessonWritingRepository;
import com.ptit.mobile.backend.repository.writing.LessonSentenceRepository;
import com.ptit.mobile.backend.repository.writing.SuggestVocabularyRepository;
import com.ptit.mobile.backend.repository.writing.UserLessonProgressRepository;
import com.ptit.mobile.backend.service.writing.LessonService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

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

    @Override
    public GradingResponse gradeAnswer(GradingRequest request) {
        String providerType = request.getAiProvider() != null ? request.getAiProvider() : "groq";
        String suggestVocab = String.join(", ", request.getSuggestVocabularies());
        return lessonGradingService.gradeAnswer(
                request.getQuestion(),
                request.getAnswer(),
                suggestVocab,
                providerType
        );
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
}
