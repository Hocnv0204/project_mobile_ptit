package com.ptit.mobile.backend.service;

import com.ptit.mobile.backend.dto.request.vocab.CreateListVocabRequest;
import com.ptit.mobile.backend.dto.request.vocab.CreateVocabRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;

import java.util.List;

public interface VocabularyService {
    BaseResponse createVocab(CreateVocabRequest request, Long lessonVocabId);
    BaseResponse createListVocab(CreateListVocabRequest request, Long lessonVocabId);
}
