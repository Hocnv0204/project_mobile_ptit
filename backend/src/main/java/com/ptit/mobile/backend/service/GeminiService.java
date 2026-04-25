package com.ptit.mobile.backend.service;

import com.ptit.mobile.backend.dto.response.ai.TermFormatResult;
import com.ptit.mobile.backend.model.Vocabulary;

import java.util.List;

public interface GeminiService {
    List<TermFormatResult> formatTerms(String input);

    record FillBlankResult(Integer vocabularyId, String sentence) {}

    List<FillBlankResult> generateFillBlankSentences(List<Vocabulary> vocabs);
}

