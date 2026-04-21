package com.ptit.mobile.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "groq")
@Getter
@Setter
public class GroqConfig {
    private String apiKey;
    private String model;
    private String baseUrl;
}
