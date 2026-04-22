package com.ptit.mobile.backend.service.impl;

import com.ptit.mobile.backend.client.FreeDictionaryClient;
import com.ptit.mobile.backend.dto.request.vocab.CreateListVocabRequest;
import com.ptit.mobile.backend.dto.request.vocab.CreateVocabRequest;
import com.ptit.mobile.backend.dto.request.vocab.CreateVocabSimpleRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;
import com.ptit.mobile.backend.dto.response.free_dictionary_client.Definition;
import com.ptit.mobile.backend.dto.response.free_dictionary_client.FreeDictionaryResponse;
import com.ptit.mobile.backend.dto.response.free_dictionary_client.Meaning;
import com.ptit.mobile.backend.dto.response.free_dictionary_client.Phonetic;
import com.ptit.mobile.backend.exception.BusinessException;
import com.ptit.mobile.backend.exception.ErrorCode;
import com.ptit.mobile.backend.mapper.VocabularyMapper;
import com.ptit.mobile.backend.model.Vocabulary;
import com.ptit.mobile.backend.repository.VocabularyRepository;
import com.ptit.mobile.backend.security.SecurityUtils;
import com.ptit.mobile.backend.service.VocabularyService;
import com.ptit.mobile.backend.utils.DataUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

import static com.ptit.mobile.backend.exception.ErrorCode.CREATE_REQUEST_VOCAB_INVALID;
import static com.ptit.mobile.backend.exception.ErrorCode.VOCABULARY_ALREADY_EXISTS_BY_LESSON;

@Service
@RequiredArgsConstructor
public class VocabularyServiceImpl implements VocabularyService {
    private final VocabularyRepository vocabularyRepository;
    private final SecurityUtils securityUtils;
    private final VocabularyMapper vocabularyMapper;
    private final FreeDictionaryClient freeDictionaryClient;
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

    @Override
    public BaseResponse createVocabSimple(CreateVocabSimpleRequest request, Long lessonVocabId){
        if(DataUtils.isNullOrEmpty(request.getTerm()) || DataUtils.isNullOrEmpty(request.getVi())){
            throw new BusinessException(CREATE_REQUEST_VOCAB_INVALID);
        }
        List<FreeDictionaryResponse> freeDictionaryResponseList = freeDictionaryClient.getWord(request.getTerm());
        FreeDictionaryResponse freeDictionaryResponse = freeDictionaryResponseList.getFirst();
        Vocabulary vocabulary = Vocabulary.builder()
                .term(request.getTerm().toUpperCase())
                .vi(normalizeTerm(request.getVi()))
                .lessonVocabId(lessonVocabId)
                .userId(securityUtils.getCurrentUserId())
                .createdAt(LocalDateTime.now())
                .build();
        List<Phonetic> phonetics = freeDictionaryResponse.getPhonetics();
        for(Phonetic phonetic : phonetics){
            if(!DataUtils.isNullOrEmpty(phonetic.getText())){
                vocabulary.setPronunciation(phonetic.getText());
                break;
            }
        }
        for(Phonetic phonetic : phonetics){
            if(!DataUtils.isNullOrEmpty(phonetic.getAudio())){
                vocabulary.setAudioUrl(phonetic.getAudio());
                break;
            }
        }

        List<Meaning> meanings = freeDictionaryResponse.getMeanings();
        for(Meaning meaning : meanings){
            if(!DataUtils.isNullOrEmpty(meaning.getPartOfSpeech())){
                vocabulary.setType(meaning.getPartOfSpeech());
                break;
            }
        }
        for(Meaning meaning : meanings){
            List<Definition> definitions = meaning.getDefinitions();
            for(Definition definition : definitions){
                if(!DataUtils.isNullOrEmpty(definition.getDefinition())){
                    vocabulary.setExample(definition.getDefinition());
                    break;
                }
            }
        }
        vocabularyRepository.save(vocabulary);
        return BaseResponse.success("Create vocabulary successfully");
    }

    private String normalizeTerm(String term){
        StringBuilder stringBuilder = new StringBuilder(term.toLowerCase());
        stringBuilder.setCharAt(0, Character.toUpperCase(stringBuilder.charAt(0)));
        return stringBuilder.toString();
    }
}
