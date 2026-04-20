package com.ptit.mobile.backend.service.impl;

import com.ptit.mobile.backend.dto.request.vocab.CreateListVocabRequest;
import com.ptit.mobile.backend.dto.request.vocab.CreateVocabRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;
import com.ptit.mobile.backend.exception.BusinessException;
import com.ptit.mobile.backend.exception.ErrorCode;
import com.ptit.mobile.backend.mapper.VocabularyMapper;
import com.ptit.mobile.backend.model.Vocabulary;
import com.ptit.mobile.backend.repository.VocabularyRepository;
import com.ptit.mobile.backend.security.SecurityUtils;
import com.ptit.mobile.backend.service.VocabularyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

import static com.ptit.mobile.backend.exception.ErrorCode.VOCABULARY_ALREADY_EXISTS_BY_LESSON;

@Service
@RequiredArgsConstructor
public class VocabularyServiceImpl implements VocabularyService {
    private final VocabularyRepository vocabularyRepository;
    private final SecurityUtils securityUtils;
    private final VocabularyMapper vocabularyMapper;
    @Override
    public BaseResponse createVocab(CreateVocabRequest request, Long lessonVocabId){
        Long userId = securityUtils.getCurrentUserId();
        if(vocabularyRepository.existsByTermAndLessonVocabId(request.getTerm(), lessonVocabId)){
            throw new BusinessException(VOCABULARY_ALREADY_EXISTS_BY_LESSON);
        }
        Vocabulary vocabulary = Vocabulary.builder()
                .term(request.getTerm())
                .vi(request.getVi())
                .type(request.getType())
                .createdAt(LocalDateTime.now())
                .pronunciation(request.getPronunciation())
                .example(request.getExample())
                .userId(userId)
                .lessonVocabId(lessonVocabId)
                .build();

        vocabularyRepository.save(vocabulary);
        return BaseResponse.success("Create vocabulary successfully");
    }

    @Override
    public BaseResponse createListVocab(CreateListVocabRequest request, Long lessonVocabId){
        Long userId = securityUtils.getCurrentUserId();
        List<Vocabulary> listVocab = request.getListVocabRequest().stream().map(vocabularyMapper ::toVocabulary).toList();
        for (Vocabulary vocabulary : listVocab) {
            vocabulary.setUserId(userId);
            vocabulary.setCreatedAt(LocalDateTime.now());
            if(!vocabularyRepository.existsByTermAndLessonVocabId(vocabulary.getTerm(), lessonVocabId)){
                vocabulary.setLessonVocabId(lessonVocabId);
                vocabularyRepository.save(vocabulary);
            }
        }
        return BaseResponse.success("Create list vocabulary successfully");
    }
}
