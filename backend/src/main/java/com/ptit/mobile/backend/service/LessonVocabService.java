package com.ptit.mobile.backend.service;

import com.ptit.mobile.backend.dto.request.lessonvocab.CreateLessonVocabRequest;
import com.ptit.mobile.backend.dto.request.lessonvocab.CreateLessonVocabSimpleRequest;
import com.ptit.mobile.backend.dto.request.lessonvocab.UpdateLessonVocabRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;

public interface LessonVocabService {
    BaseResponse create(CreateLessonVocabRequest request);

    BaseResponse createSimple(CreateLessonVocabSimpleRequest request);

    BaseResponse getAll();

    BaseResponse getById(Integer id);

    BaseResponse update(Integer id, UpdateLessonVocabRequest request);

    BaseResponse delete(Integer id);

    BaseResponse getByUserId(Long userId);

    BaseResponse getByUsernameAndLevel(String username, Long levelId);
}
