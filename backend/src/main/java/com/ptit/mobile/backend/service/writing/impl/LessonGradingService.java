package com.ptit.mobile.backend.service.writing.impl;

import com.ptit.mobile.backend.config.AIConfig;
import com.ptit.mobile.backend.config.GeminiConfig;
import com.ptit.mobile.backend.config.GroqConfig;
import com.ptit.mobile.backend.dto.response.writing.GradingResponse;
import com.ptit.mobile.backend.integration.writing.AIProvider;
import com.ptit.mobile.backend.integration.writing.AIProviderFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class LessonGradingService {
    
    private final AIProviderFactory aiProviderFactory;
    private final GeminiConfig geminiConfig;
    private final GroqConfig groqConfig;
    private final AIConfig aiConfig;
    
    public GradingResponse gradeAnswer(
            String question,
            String answer,
            String suggestVocab,
            String providerType
    ) {
        try {
            AIProvider provider = aiProviderFactory.getProvider(providerType);
            
            String apiUrl;
            String apiKey;
            
            if ("groq".equalsIgnoreCase(providerType)) {
                apiUrl = groqConfig.getBaseUrl();
                apiKey = groqConfig.getApiKey();
            } else {
                apiUrl = geminiConfig.getBaseUrl();
                apiKey = geminiConfig.getApiKey();
            }
            
            log.info("Grading answer using provider: {}", provider.getProviderType());
            
            return provider.gradeAnswer(
                    question,
                    answer,
                    suggestVocab,
                    apiUrl,
                    apiKey
            );
        } catch (Exception e) {
            log.error("Error grading answer", e);
            throw new RuntimeException("Failed to grade answer: " + e.getMessage(), e);
        }
    }
}
