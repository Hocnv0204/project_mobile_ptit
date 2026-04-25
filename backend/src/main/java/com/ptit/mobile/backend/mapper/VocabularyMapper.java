package com.ptit.mobile.backend.mapper;

import com.ptit.mobile.backend.dto.request.vocab.CreateVocabRequest;
import com.ptit.mobile.backend.model.Vocabulary;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface VocabularyMapper {
    Vocabulary toVocabulary(CreateVocabRequest request);
}
