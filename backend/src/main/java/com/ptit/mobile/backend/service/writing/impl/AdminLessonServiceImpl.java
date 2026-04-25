package com.ptit.mobile.backend.service.writing.impl;


import com.ptit.mobile.backend.common.exception.NotFoundException;
import com.ptit.mobile.backend.config.AIConfig;
import com.ptit.mobile.backend.dto.request.writing.*;
import com.ptit.mobile.backend.dto.response.writing.*;
import com.ptit.mobile.backend.mapper.lesson.LessonMapper;
import com.ptit.mobile.backend.model.*;
import com.ptit.mobile.backend.repository.LevelRepository;
import com.ptit.mobile.backend.repository.writing.*;
import com.ptit.mobile.backend.repository.topic.TopicRepository;
import com.ptit.mobile.backend.service.writing.AdminLessonService;
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
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminLessonServiceImpl implements AdminLessonService {

    private final LessonWritingRepository lessonWritingRepository;
    private final TopicRepository topicRepository;
    private final LevelRepository levelRepository;
    private final SuggestVocabularyRepository suggestVocabularyRepository;
    private final LessonSentenceRepository lessonSentenceRepository;
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
            savedLesson.setStatus("COMPLETED");
            savedLesson.setUpdatedAt(LocalDateTime.now());
            LessonWriting updatedLesson = lessonWritingRepository.save(savedLesson);

            List<LessonSentence> sentences = lessonSentenceRepository.findAllByLessonWritingIdOrderByOrderIndexAsc(updatedLesson.getId());
            List<Integer> sentenceIds = sentences.stream().map(LessonSentence::getId).collect(Collectors.toList());
            List<SuggestVocabulary> vocabularies = sentenceIds.isEmpty()
                    ? Collections.emptyList()
                    : suggestVocabularyRepository.findByLessonSentenceIdIn(sentenceIds);

            return lessonMapper.toAdminDetailResponse(updatedLesson, topic, level, sentences, vocabularies);
        } catch (Exception e) {
            savedLesson.setStatus("FAILED");
            savedLesson.setUpdatedAt(LocalDateTime.now());
            lessonWritingRepository.save(savedLesson);
            throw new RuntimeException("Lỗi khi tạo bài học: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public AdminLessonDetailResponse createManualLesson(ManualCreateLessonRequest request) {
        // 1. Validate Topic and Level
        Topic topic = topicRepository.findById(request.getTopicId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy chủ đề với ID: " + request.getTopicId()));
        Level level = levelRepository.findById(request.getLevelId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy trình độ với ID: " + request.getLevelId()));

        // 2. Create LessonWriting
        LessonWriting lesson = LessonWriting.builder()
                .name(request.getName())
                .description(request.getDescription())
                .topicId(request.getTopicId())
                .levelId(request.getLevelId())
                .status("COMPLETED")
                .deleteFlag(false)
                .createdAt(LocalDateTime.now())
                .totalSentences(request.getSentences().size())
                .build();
        LessonWriting savedLesson = lessonWritingRepository.save(lesson);

        // 3. Create sentences and vocabularies
        List<LessonSentence> allSentences = new ArrayList<>();
        List<SuggestVocabulary> allVocabularies = new ArrayList<>();

        for (int i = 0; i < request.getSentences().size(); i++) {
            ManualCreateLessonRequest.ManualSentenceRequest sentenceReq = request.getSentences().get(i);
            
            LessonSentence sentence = LessonSentence.builder()
                    .lessonWritingId(savedLesson.getId())
                    .sentenceVi(sentenceReq.getSentenceVi())
                    .orderIndex(sentenceReq.getOrderIndex() != null ? sentenceReq.getOrderIndex() : (i + 1))
                    .build();
            LessonSentence savedSentence = lessonSentenceRepository.save(sentence);
            allSentences.add(savedSentence);

            // 4. Create suggest vocabularies for this sentence
            if (sentenceReq.getSuggestVocabularies() != null && !sentenceReq.getSuggestVocabularies().isEmpty()) {
                for (ManualCreateLessonRequest.ManualSentenceRequest.ManualVocabularyRequest vocabReq : sentenceReq.getSuggestVocabularies()) {
                    SuggestVocabulary vocabulary = SuggestVocabulary.builder()
                            .term(vocabReq.getTerm())
                            .vietnamese(vocabReq.getVietnamese())
                            .type(vocabReq.getType())
                            .pronunciation(vocabReq.getPronunciation())
                            .example(vocabReq.getExample())
                            .lessonSentenceId(savedSentence.getId())
                            .build();
                    SuggestVocabulary savedVocab = suggestVocabularyRepository.save(vocabulary);
                    allVocabularies.add(savedVocab);
                }
            }
        }

        return lessonMapper.toAdminDetailResponse(savedLesson, topic, level, allSentences, allVocabularies);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminLessonSummaryResponse> getAllLessonsForAdmin(
            String searchTerm, Integer topicId, Integer levelId, Boolean isDeleted,
            int page, int size, String sortBy, String sortDir) {

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

        // Fetch Topic and Level maps for enrichment
        Map<Integer, Topic> topicMap = new HashMap<>();
        Map<Integer, Level> levelMap = new HashMap<>();
        topicRepository.findAll().forEach(t -> topicMap.put(t.getId(), t));
        levelRepository.findAll().forEach(l -> levelMap.put(l.getId(), l));

        Page<LessonWriting> lessonPage = lessonWritingRepository.findAll(spec, pageable);
        return lessonPage.map(l -> lessonMapper.toAdminSummaryResponse(
                l,
                topicMap.get(l.getTopicId()),
                levelMap.get(l.getLevelId())
        ));
    }

    @Override
    @Transactional(readOnly = true)
    public AdminLessonDetailResponse getLessonDetailsForAdmin(Integer lessonId) {
        LessonWriting lesson = lessonWritingRepository.findById(lessonId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bài học với ID: " + lessonId));

        Topic topic = lesson.getTopicId() != null ? topicRepository.findById(lesson.getTopicId()).orElse(null) : null;
        Level level = lesson.getLevelId() != null ? levelRepository.findById(lesson.getLevelId()).orElse(null) : null;
        List<LessonSentence> sentences = lessonSentenceRepository.findAllByLessonWritingIdOrderByOrderIndexAsc(lessonId);
        List<Integer> sentenceIds = sentences.stream().map(LessonSentence::getId).collect(Collectors.toList());
        List<SuggestVocabulary> vocabularies = sentenceIds.isEmpty()
                ? Collections.emptyList()
                : suggestVocabularyRepository.findByLessonSentenceIdIn(sentenceIds);

        return lessonMapper.toAdminDetailResponse(lesson, topic, level, sentences, vocabularies);
    }

    @Override
    @Transactional
    public AdminLessonDetailResponse updateLessonForAdmin(Integer lessonId, AdminUpdateLessonRequest request) {
        LessonWriting lesson = lessonWritingRepository.findById(lessonId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bài học với ID: " + lessonId));

        lessonMapper.updateEntityFromRequest(request, lesson);
        lesson.setUpdatedAt(LocalDateTime.now());
        LessonWriting updatedLesson = lessonWritingRepository.save(lesson);

        Topic topic = lesson.getTopicId() != null ? topicRepository.findById(lesson.getTopicId()).orElse(null) : null;
        Level level = lesson.getLevelId() != null ? levelRepository.findById(lesson.getLevelId()).orElse(null) : null;
        List<LessonSentence> sentences = lessonSentenceRepository.findAllByLessonWritingIdOrderByOrderIndexAsc(lessonId);
        List<Integer> sentenceIds = sentences.stream().map(LessonSentence::getId).collect(Collectors.toList());
        List<SuggestVocabulary> vocabularies = sentenceIds.isEmpty()
                ? Collections.emptyList()
                : suggestVocabularyRepository.findByLessonSentenceIdIn(sentenceIds);

        return lessonMapper.toAdminDetailResponse(updatedLesson, topic, level, sentences, vocabularies);
    }

    @Override
    @Transactional
    public void updateVocabulariesForLesson(Integer lessonId, List<AdminUpdateSuggestVocabularyRequest> vocabularyRequests) {
        lessonWritingRepository.findById(lessonId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bài học với ID: " + lessonId));
        // TODO: implement full vocabulary update if needed
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

    // ==================== Sentence Management ====================

    @Transactional
    public LessonSentenceResponse createSentence(AdminCreateSentenceRequest request) {
        LessonWriting lesson = lessonWritingRepository.findById(request.getLessonWritingId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bài học với ID: " + request.getLessonWritingId()));

        // Determine next order index if not provided
        Integer orderIndex = request.getOrderIndex();
        if (orderIndex == null) {
            List<LessonSentence> existing = lessonSentenceRepository
                    .findAllByLessonWritingIdOrderByOrderIndexAsc(lesson.getId());
            orderIndex = existing.size() + 1;
        }

        LessonSentence sentence = LessonSentence.builder()
                .lessonWritingId(request.getLessonWritingId())
                .sentenceVi(request.getSentenceVi())
                .orderIndex(orderIndex)
                .build();
        LessonSentence saved = lessonSentenceRepository.save(sentence);

        // Update totalSentences
        int count = lessonSentenceRepository.findAllByLessonWritingIdOrderByOrderIndexAsc(lesson.getId()).size();
        lesson.setTotalSentences(count);
        lesson.setUpdatedAt(LocalDateTime.now());
        lessonWritingRepository.save(lesson);

        return lessonMapper.toSentenceResponse(saved);
    }

    @Transactional
    public LessonSentenceResponse updateSentence(Integer sentenceId, AdminUpdateSentenceRequest request) {
        LessonSentence sentence = lessonSentenceRepository.findById(sentenceId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy câu với ID: " + sentenceId));

        if (request.getSentenceVi() != null) {
            sentence.setSentenceVi(request.getSentenceVi());
        }
        if (request.getOrderIndex() != null) {
            sentence.setOrderIndex(request.getOrderIndex());
        }
        LessonSentence updated = lessonSentenceRepository.save(sentence);
        return lessonMapper.toSentenceResponse(updated);
    }

    @Transactional
    public void deleteSentence(Integer sentenceId) {
        LessonSentence sentence = lessonSentenceRepository.findById(sentenceId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy câu với ID: " + sentenceId));

        // Delete related vocabularies first
        suggestVocabularyRepository.deleteAllByLessonSentenceIdIn(Collections.singletonList(sentenceId));
        lessonSentenceRepository.delete(sentence);

        // Update totalSentences
        LessonWriting lesson = lessonWritingRepository.findById(sentence.getLessonWritingId()).orElse(null);
        if (lesson != null) {
            int count = lessonSentenceRepository.findAllByLessonWritingIdOrderByOrderIndexAsc(lesson.getId()).size();
            lesson.setTotalSentences(count);
            lesson.setUpdatedAt(LocalDateTime.now());
            lessonWritingRepository.save(lesson);
        }
    }

    public List<LessonSentenceResponse> getSentencesByLesson(Integer lessonId) {
        lessonWritingRepository.findById(lessonId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bài học với ID: " + lessonId));
        List<LessonSentence> sentences = lessonSentenceRepository.findAllByLessonWritingIdOrderByOrderIndexAsc(lessonId);
        List<Integer> sentenceIds = sentences.stream().map(LessonSentence::getId).collect(Collectors.toList());
        List<SuggestVocabulary> vocabularies = sentenceIds.isEmpty()
                ? Collections.emptyList()
                : suggestVocabularyRepository.findByLessonSentenceIdIn(sentenceIds);
        return sentences.stream()
                .map(s -> lessonMapper.toSentenceResponse(s, vocabularies))
                .collect(Collectors.toList());
    }
}
