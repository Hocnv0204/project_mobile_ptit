package com.ptit.mobile.backend.service.writing.impl;

import com.ptit.mobile.backend.config.AIConfig;
import com.ptit.mobile.backend.config.GeminiConfig;
import com.ptit.mobile.backend.config.GroqConfig;
import com.ptit.mobile.backend.dto.response.writing.LessonGenerationResult;
import com.ptit.mobile.backend.integration.writing.AIProvider;
import com.ptit.mobile.backend.integration.writing.AIProviderFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class LessonGenerationService {
    
    private final AIProviderFactory aiProviderFactory;
    private final GeminiConfig geminiConfig;
    private final GroqConfig groqConfig;
    private final AIConfig aiConfig;
    
    public LessonGenerationResult generateLesson(
            String topic,
            String level,
            String description,
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
            
            log.info("Generating lesson using provider: {}", provider.getProviderType());
            
            return provider.generateLesson(
                    topic,
                    level,
                    description,
                    apiUrl,
                    apiKey
            );
        } catch (Exception e) {
            log.error("Error generating lesson", e);
            throw new RuntimeException("Failed to generate lesson: " + e.getMessage(), e);
        }
    }
}
