package com.ptit.mobile.backend.controller;

import com.ptit.mobile.backend.dto.request.vocab.CreateListVocabRequest;
import com.ptit.mobile.backend.dto.request.vocab.CreateVocabRequest;
import com.ptit.mobile.backend.dto.request.vocab.CreateVocabSimpleRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;
import com.ptit.mobile.backend.dto.response.vocab.VocabHomeStatsResponse;
import com.ptit.mobile.backend.repository.VocabularyRepository;
import com.ptit.mobile.backend.repository.projection.VocabHomeStatsProjection;
import com.ptit.mobile.backend.security.SecurityUtils;
import com.ptit.mobile.backend.service.VocabularyService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/vocab")
@RequiredArgsConstructor
public class VocabularyController {
    private final VocabularyService vocabularyService;
    private final VocabularyRepository vocabularyRepository;
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

    @GetMapping("/home-stats")
    public BaseResponse homeStats() {
        Long userId = SecurityUtils.getCurrentUserId();
        LocalDate today = LocalDate.now();
        VocabHomeStatsProjection p = vocabularyRepository.getHomeStatsForUser(userId, today, today.plusDays(7));
        VocabHomeStatsResponse body = VocabHomeStatsResponse.builder()
                .total(p != null && p.getTotal() != null ? p.getTotal() : 0L)
                .newWords(p != null && p.getNewWords() != null ? p.getNewWords() : 0L)
                .dueToday(p != null && p.getDueToday() != null ? p.getDueToday() : 0L)
                .overdue(p != null && p.getOverdue() != null ? p.getOverdue() : 0L)
                .upcoming(p != null && p.getUpcoming() != null ? p.getUpcoming() : 0L)
                .upcoming7d(p != null && p.getUpcoming7d() != null ? p.getUpcoming7d() : 0L)
                .build();
        return BaseResponse.success(body);
    }

}
