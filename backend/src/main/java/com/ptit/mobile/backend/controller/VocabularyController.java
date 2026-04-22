package com.ptit.mobile.backend.controller;

import com.ptit.mobile.backend.dto.request.vocab.CreateListVocabRequest;
import com.ptit.mobile.backend.dto.request.vocab.CreateVocabRequest;
import com.ptit.mobile.backend.dto.request.vocab.CreateVocabSimpleRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;
import com.ptit.mobile.backend.service.VocabularyService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vocab")
@RequiredArgsConstructor
public class VocabularyController {
    private final VocabularyService vocabularyService;
    @PostMapping("/{lessonId}/single")
    public BaseResponse createVocab(@RequestBody CreateVocabRequest request, @PathVariable("lessonId") Long lessonId){
        return vocabularyService.createVocab(request,lessonId);
    }
    @PostMapping("/{lessonId}")
    public BaseResponse createListVocab(@RequestBody CreateListVocabRequest request, @PathVariable("lessonId") Long lessonId){
        return vocabularyService.createListVocab(request,lessonId);
    }

    @PostMapping("/{lessonId}/simple")
    public BaseResponse createVocabSimple(@RequestBody CreateVocabSimpleRequest request, @PathVariable("lessonId") Long lessonId){
        return vocabularyService.createVocabSimple(request,lessonId);
    }

}
