package com.ptit.mobile.backend.integration.writing;

import org.springframework.stereotype.Component;

@Component
public class AIProviderFactory {
    
    private final com.ptit.mobile.backend.integration.writing.impl.GeminiProvider geminiProvider;
    private final com.ptit.mobile.backend.integration.writing.impl.GroqProvider groqProvider;
    
    public AIProviderFactory(
            com.ptit.mobile.backend.integration.writing.impl.GeminiProvider geminiProvider,
            com.ptit.mobile.backend.integration.writing.impl.GroqProvider groqProvider) {
        this.geminiProvider = geminiProvider;
        this.groqProvider = groqProvider;
    }
    
    public AIProvider getProvider(String providerType) {
        if (providerType == null || providerType.isBlank()) {
            return geminiProvider; // Default to Gemini
        }
        
        return switch (providerType.toLowerCase()) {
            case "groq" -> groqProvider;
            case "gemini" -> geminiProvider;
            default -> geminiProvider; // Default to Gemini
        };
    }
}
