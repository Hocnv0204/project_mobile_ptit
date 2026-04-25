package com.ptit.mobile.backend.integration.writing;

import com.ptit.mobile.backend.dto.response.writing.GradingResponse;
import com.ptit.mobile.backend.dto.response.writing.LessonGenerationResult;

public interface AIProvider {
    
    LessonGenerationResult generateLesson(
            String topic,
            String level,
            String description,
            String apiUrl,
            String apiKey
    );
    
    GradingResponse gradeAnswer(
            String question,
            String answer,
            String suggestVocab,
            String apiUrl,
            String apiKey
    );
    
    String getProviderType();
}
