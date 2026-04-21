package com.ptit.mobile.backend.service.writing.impl;

import com.ptit.mobile.backend.common.exception.NotFoundException;
import com.ptit.mobile.backend.config.AIConfig;
import com.ptit.mobile.backend.dto.request.writing.AdminCreateLessonRequest;
import com.ptit.mobile.backend.dto.request.writing.AdminUpdateLessonRequest;
import com.ptit.mobile.backend.dto.response.writing.AdminLessonDetailResponse;
import com.ptit.mobile.backend.dto.response.writing.AdminLessonSummaryResponse;
import com.ptit.mobile.backend.dto.response.writing.LessonGenerationResponse;
import com.ptit.mobile.backend.dto.response.writing.LessonGenerationResult;
import com.ptit.mobile.backend.mapper.LessonMapper;
import com.ptit.mobile.backend.model.LessonWriting;
import com.ptit.mobile.backend.model.Level;
import com.ptit.mobile.backend.model.SuggestVocabulary;
import com.ptit.mobile.backend.model.Topic;
import com.ptit.mobile.backend.repository.LevelRepository;
import com.ptit.mobile.backend.repository.writing.LessonWritingRepository;
import com.ptit.mobile.backend.repository.writing.SuggestVocabularyRepository;
import com.ptit.mobile.backend.repository.topic.TopicRepository;
import com.ptit.mobile.backend.service.writing.AdminLessonService;
import com.ptit.mobile.backend.dto.request.writing.AdminUpdateSuggestVocabularyRequest;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminLessonServiceImpl implements AdminLessonService {

    private final LessonWritingRepository lessonWritingRepository;
    private final TopicRepository topicRepository;
    private final LevelRepository levelRepository;
    private final SuggestVocabularyRepository suggestVocabularyRepository;
    private final LessonMapper lessonMapper;
    private final LessonGenerationService lessonGenerationService;
    private final AIConfig aiConfig;

    @Override
    @Transactional
    public AdminLessonDetailResponse requestLessonGeneration(AdminCreateLessonRequest request) {
        // 1. Validate Topic and Level
        Topic topic = topicRepository.findById(request.getTopicId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy chủ đề với ID: " + request.getTopicId()));
        Level level = levelRepository.findById(request.getLevelId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy trình độ với ID: " + request.getLevelId()));

        // 2. Create LessonWriting placeholder
        LessonWriting lesson = LessonWriting.builder()
                .name(request.getDraftName())
                .topicId(request.getTopicId())
                .levelId(request.getLevelId())
                .description(request.getDescription())
                .status("GENERATING")
                .type("DEFAULT")
                .deleteFlag(false)
                .createdAt(LocalDateTime.now())
                .build();
        LessonWriting savedLesson = lessonWritingRepository.save(lesson);


        String topicDescription = topic.getDescription();
        String levelDescription = level.getDescription();

        // 3. Call AI provider to generate lesson
        try {
            LessonGenerationResult result = lessonGenerationService.generateLesson(
                    topicDescription,
                    levelDescription,
                    request.getDescription(),
                    aiConfig.getProvider()
            );

            // 4. Update lesson with generated content
            savedLesson.setName(result.getLessonTitle());
            savedLesson.setParagraph(result.getVietnameseParagraph());
            savedLesson.setStatus("COMPLETED");
            savedLesson.setUpdatedAt(LocalDateTime.now());
            LessonWriting updatedLesson = lessonWritingRepository.save(savedLesson);

            // 5. Save suggested vocabularies
            if (result.getSuggestVocabularyList() != null && !result.getSuggestVocabularyList().isEmpty()) {
                List<SuggestVocabulary> vocabularies = result.getSuggestVocabularyList().stream()
                        .map(item -> SuggestVocabulary.builder()
                                .term(item.getTerm())
                                .vietnamese(item.getVi())
                                .type(item.getType())
                                .pronunciation(item.getPronunciation())
                                .example(item.getExample())
                                .deleteFlag(false)
                                .lessonWritingId(updatedLesson.getId())
                                .build())
                        .collect(Collectors.toList());
                suggestVocabularyRepository.saveAll(vocabularies);
            }

            // 6. Return the full lesson details
            return lessonMapper.toAdminDetailResponse(updatedLesson);
        } catch (Exception e) {
            // Update lesson status to FAILED if AI generation fails
            savedLesson.setStatus("FAILED");
            savedLesson.setUpdatedAt(LocalDateTime.now());
            lessonWritingRepository.save(savedLesson);
            
            throw new RuntimeException("Lỗi khi tạo bài học: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminLessonSummaryResponse> getAllLessonsForAdmin(String searchTerm, Integer topicId, Integer levelId, Boolean isDeleted, int page, int size, String sortBy, String sortDir) {
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Specification<LessonWriting> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(searchTerm)) {
                predicates.add(cb.like(cb.lower(root.get("name")), "%" + searchTerm.toLowerCase() + "%"));
            }
            if (topicId != null) {
                predicates.add(cb.equal(root.get("topicId"), topicId));
            }
            if (levelId != null) {
                predicates.add(cb.equal(root.get("levelId"), levelId));
            }
            if (isDeleted != null) {
                predicates.add(cb.equal(root.get("deleteFlag"), isDeleted));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<LessonWriting> lessonPage = lessonWritingRepository.findAll(spec, pageable);
        return lessonPage.map(lessonMapper::toAdminSummaryResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminLessonDetailResponse getLessonDetailsForAdmin(Integer lessonId) {
        LessonWriting lesson = lessonWritingRepository.findById(lessonId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bài học với ID: " + lessonId));
        return lessonMapper.toAdminDetailResponse(lesson);
    }

    @Override
    @Transactional
    public AdminLessonDetailResponse updateLessonForAdmin(Integer lessonId, AdminUpdateLessonRequest request) {
        LessonWriting lesson = lessonWritingRepository.findById(lessonId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bài học với ID: " + lessonId));

        lessonMapper.updateEntityFromRequest(request, lesson);
        lesson.setUpdatedAt(LocalDateTime.now());

        LessonWriting updatedLesson = lessonWritingRepository.save(lesson);
        return lessonMapper.toAdminDetailResponse(updatedLesson);
    }

    @Override
    @Transactional
    public void updateVocabulariesForLesson(Integer lessonId, List<AdminUpdateSuggestVocabularyRequest> vocabularyRequests) {
        // 1. Validate that LessonWriting exists
        LessonWriting lesson = lessonWritingRepository.findById(lessonId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bài học với ID: " + lessonId));

        // 2. Delete all old vocabularies for this lesson
        suggestVocabularyRepository.deleteAllByLessonWritingId(lessonId);

        // 3. If new vocabulary list is not empty, add them
        if (vocabularyRequests != null && !vocabularyRequests.isEmpty()) {
            List<SuggestVocabulary> newVocabularies = vocabularyRequests.stream()
                    .map(dto -> SuggestVocabulary.builder()
                            .term(dto.getTerm())
                            .vietnamese(dto.getVietnamese())
                            .type(dto.getType())
                            .pronunciation(dto.getPronunciation())
                            .example(dto.getExample())
                            .deleteFlag(false)
                            .lessonWritingId(lessonId)
                            .build())
                    .collect(Collectors.toList());

            suggestVocabularyRepository.saveAll(newVocabularies);
        }
    }

    @Override
    @Transactional
    public void deleteLessonForAdmin(Integer lessonId) {
        LessonWriting lesson = lessonWritingRepository.findById(lessonId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bài học với ID: " + lessonId));
        lesson.setDeleteFlag(true);
        lesson.setUpdatedAt(LocalDateTime.now());
        lessonWritingRepository.save(lesson);
    }

    @Override
    @Transactional
    public void restoreLessonForAdmin(Integer lessonId) {
        LessonWriting lesson = lessonWritingRepository.findById(lessonId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bài học với ID: " + lessonId));
        lesson.setDeleteFlag(false);
        lesson.setUpdatedAt(LocalDateTime.now());
        lessonWritingRepository.save(lesson);
    }
}
