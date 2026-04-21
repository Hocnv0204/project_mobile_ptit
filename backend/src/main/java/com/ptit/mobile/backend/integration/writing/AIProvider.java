package com.ptit.mobile.backend.integration.writing;

import com.ptit.mobile.backend.dto.request.writing.AdminCreateLessonRequest;
import com.ptit.mobile.backend.dto.request.ai.GradingRequest;
import com.ptit.mobile.backend.dto.response.ai.GradingResponse;
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
            String apiUrl,
            String apiKey
    );
    
    String getProviderType();
}
