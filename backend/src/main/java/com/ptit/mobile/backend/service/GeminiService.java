package com.ptit.mobile.backend.service;

import com.ptit.mobile.backend.dto.response.ai.TermFormatResult;

import java.util.List;

public interface GeminiService {
    List<TermFormatResult> formatTerms(String input);
}

