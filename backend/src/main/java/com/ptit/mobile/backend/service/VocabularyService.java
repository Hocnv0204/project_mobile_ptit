package com.ptit.mobile.backend.service;

import com.ptit.mobile.backend.dto.request.vocab.CreateListVocabRequest;
import com.ptit.mobile.backend.dto.request.vocab.CreateVocabRequest;
import com.ptit.mobile.backend.dto.request.vocab.CreateVocabSimpleRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;

import java.util.List;

public interface VocabularyService {
    BaseResponse createVocab(CreateVocabRequest request, Long lessonVocabId);
    BaseResponse createListVocab(CreateListVocabRequest request, Long lessonVocabId);
    BaseResponse createVocabSimple(CreateVocabSimpleRequest request, Long lessonVocabId);

    /** Tổng từ cần học/ôn hôm nay theo userId + lessonVocabId (userId phải khớp token). */
    BaseResponse getDueTodayCountForLesson(Long userId, Long lessonVocabId);

    /** Tổng vocabulary do tài khoản có role ROLE_ADMIN tạo (theo vocabulary.user_id). */
    BaseResponse getTotalVocabularyCreatedByAdmins();
}
