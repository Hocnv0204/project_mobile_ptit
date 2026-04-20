package com.ptit.mobile.backend.service.impl;

import com.ptit.mobile.backend.dto.request.lessonvocab.CreateLessonVocabRequest;
import com.ptit.mobile.backend.dto.request.lessonvocab.CreateLessonVocabSimpleRequest;
import com.ptit.mobile.backend.dto.request.lessonvocab.UpdateLessonVocabRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;
import com.ptit.mobile.backend.dto.response.lessonvocab.LessonVocabResponse;
import com.ptit.mobile.backend.exception.BusinessException;
import com.ptit.mobile.backend.exception.ErrorCode;
import com.ptit.mobile.backend.model.LessonVocab;
import com.ptit.mobile.backend.repository.LessonVocabRepository;
import com.ptit.mobile.backend.security.SecurityUtils;
import com.ptit.mobile.backend.service.LessonVocabService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LessonVocabServiceImpl implements LessonVocabService {
    private final LessonVocabRepository lessonVocabRepository;

    @Override
    public BaseResponse create(CreateLessonVocabRequest request) {
        String name = normalizeName(request.getName());
        Integer levelId = request.getLevelId();

        if (lessonVocabRepository.existsByNameAndLevelIdAndDeleteFlagFalse(name, levelId)) {
            throw new BusinessException(ErrorCode.LESSON_VOCAB_ALREADY_EXISTS);
        }

        LocalDateTime now = LocalDateTime.now();
        LessonVocab lesson = LessonVocab.builder()
                .name(name)
                .levelId(levelId)
                .userId(SecurityUtils.getCurrentUserId())
                .createBy(SecurityUtils.getCurrentEmail())
                .createdAt(now)
                .updatedAt(now)
                .deleteFlag(false)
                .build();

        lessonVocabRepository.save(lesson);
        return BaseResponse.success(toResponse(lesson));
    }

    @Override
    public BaseResponse createSimple(CreateLessonVocabSimpleRequest request) {
        String name = normalizeName(request.getName());
        if (lessonVocabRepository.existsByNameAndLevelIdIsNullAndDeleteFlagFalse(name)) {
            throw new BusinessException(ErrorCode.LESSON_VOCAB_ALREADY_EXISTS);
        }

        LocalDateTime now = LocalDateTime.now();
        LessonVocab lesson = LessonVocab.builder()
                .name(name)
                .levelId(null)
                .userId(SecurityUtils.getCurrentUserId())
                .createBy(SecurityUtils.getCurrentEmail())
                .createdAt(now)
                .updatedAt(now)
                .deleteFlag(false)
                .build();

        lessonVocabRepository.save(lesson);
        return BaseResponse.success(toResponse(lesson));
    }

    @Override
    public BaseResponse getAll() {
        List<LessonVocabResponse> data = lessonVocabRepository.findAllByDeleteFlagFalseOrderByIdAsc()
                .stream()
                .map(this::toResponse)
                .toList();
        return BaseResponse.success(data);
    }

    @Override
    public BaseResponse getById(Integer id) {
        LessonVocab lesson = lessonVocabRepository.findByIdAndDeleteFlagFalse(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.LESSON_VOCAB_NOT_FOUND));
        return BaseResponse.success(toResponse(lesson));
    }

    @Override
    public BaseResponse update(Integer id, UpdateLessonVocabRequest request) {
        LessonVocab lesson = lessonVocabRepository.findByIdAndDeleteFlagFalse(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.LESSON_VOCAB_NOT_FOUND));

        String name = normalizeName(request.getName());
        Integer levelId = request.getLevelId();

        boolean changedUniqueKey = !name.equals(lesson.getName()) || !levelId.equals(lesson.getLevelId());
        if (changedUniqueKey && lessonVocabRepository.existsByNameAndLevelIdAndDeleteFlagFalse(name, levelId)) {
            throw new BusinessException(ErrorCode.LESSON_VOCAB_ALREADY_EXISTS);
        }

        lesson.setName(name);
        lesson.setLevelId(levelId);
        lesson.setUpdatedAt(LocalDateTime.now());
        lessonVocabRepository.save(lesson);

        return BaseResponse.success(toResponse(lesson));
    }

    @Override
    public BaseResponse delete(Integer id) {
        LessonVocab lesson = lessonVocabRepository.findByIdAndDeleteFlagFalse(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.LESSON_VOCAB_NOT_FOUND));

        lesson.setDeleteFlag(true);
        lesson.setUpdatedAt(LocalDateTime.now());
        lessonVocabRepository.save(lesson);
        return BaseResponse.success("Delete lesson vocab successfully");
    }

    private LessonVocabResponse toResponse(LessonVocab lesson) {
        return LessonVocabResponse.builder()
                .id(lesson.getId())
                .name(lesson.getName())
                .levelId(lesson.getLevelId())
                .userId(lesson.getUserId())
                .createBy(lesson.getCreateBy())
                .createdAt(lesson.getCreatedAt())
                .updatedAt(lesson.getUpdatedAt())
                .build();
    }

    private String normalizeName(String name) {
        if (name == null) return null;
        return name.trim().replaceAll("\\s+", " ");
    }
}

