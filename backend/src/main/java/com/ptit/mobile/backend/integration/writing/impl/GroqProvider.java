package com.ptit.mobile.backend.integration.writing.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ptit.mobile.backend.config.GroqConfig;
import com.ptit.mobile.backend.dto.response.writing.GradingResponse;
import com.ptit.mobile.backend.dto.response.writing.LessonGenerationResult;
import com.ptit.mobile.backend.integration.writing.AIProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ResourceLoader;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Slf4j
@Component
public class GroqProvider implements AIProvider {

    private final ResourceLoader resourceLoader;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final GroqConfig groqConfig;

    public GroqProvider(ResourceLoader resourceLoader, ObjectMapper objectMapper, GroqConfig groqConfig) {
        this.resourceLoader = resourceLoader;
        this.restTemplate = new RestTemplate();
        this.objectMapper = objectMapper;
        this.groqConfig = groqConfig;
    }

    @Override
    public LessonGenerationResult generateLesson(String topic, String level, String description, String apiUrl, String apiKey) {
        try {
            String prompt = loadAndFormatPrompt(topic, level, description);
            String jsonResponse = callGroqApi(prompt, apiUrl, apiKey);
            return objectMapper.readValue(jsonResponse, LessonGenerationResult.class);
        } catch (Exception e) {
            log.error("Error generating lesson with Groq", e);
            throw new RuntimeException("Failed to generate lesson: " + e.getMessage(), e);
        }
    }

    @Override
    public GradingResponse gradeAnswer(String question, String answer, String apiUrl, String apiKey) {
        try {
            String prompt = loadAndFormatGradingPrompt(question, answer);
            String jsonResponse = callGroqApi(prompt, apiUrl, apiKey);
            return objectMapper.readValue(jsonResponse, GradingResponse.class);
        } catch (Exception e) {
            log.error("Error grading answer with Groq", e);
            throw new RuntimeException("Failed to grade answer: " + e.getMessage(), e);
        }
    }

    @Override
    public String getProviderType() {
        return "groq";
    }

    private String loadAndFormatPrompt(String topic, String level, String description) throws Exception {
        String promptFileName = "prompt/create_lesson_prompt.txt";
        log.info("Loading prompt from: {}", promptFileName);

        var resource = resourceLoader.getResource("classpath:" + promptFileName);
        if (!resource.exists()) {
            throw new java.io.FileNotFoundException("Prompt file not found: " + promptFileName);
        }

        try (InputStream inputStream = resource.getInputStream()) {
            String template = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
            return template
                    .replace("{topic}", topic)
                    .replace("{level}", level)
                    .replace("{description}", description);
        }
    }

    private String loadAndFormatGradingPrompt(String question, String answer) throws Exception {
        String promptFileName = "prompt/user_submit_prompt";
        log.info("Loading grading prompt from: {}", promptFileName);

        var resource = resourceLoader.getResource("classpath:" + promptFileName);
        if (!resource.exists()) {
            throw new java.io.FileNotFoundException("Grading prompt file not found: " + promptFileName);
        }

        try (InputStream inputStream = resource.getInputStream()) {
            String template = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
            return template
                    .replace("{question}", question)
                    .replace("{answer}", answer);
        }
    }

    private String callGroqApi(String prompt, String apiUrl, String apiKey) {
        try {
            String url = apiUrl + "/chat/completions";

            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("model", groqConfig.getModel());
            requestBody.put("temperature", 0.7);
            requestBody.put("max_tokens", 4096);

            ArrayNode messagesArray = objectMapper.createArrayNode();
            ObjectNode messageObject = objectMapper.createObjectNode();
            messageObject.put("role", "user");
            messageObject.put("content", prompt);
            messagesArray.add(messageObject);

            requestBody.set("messages", messagesArray);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + apiKey);

            HttpEntity<String> request = new HttpEntity<>(objectMapper.writeValueAsString(requestBody), headers);

            log.info("Calling Groq API with URL: {}", url);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                return extractGroqResponse(response.getBody());
            } else {
                throw new RuntimeException("Groq API error: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error calling Groq API", e);
            throw new RuntimeException("Failed to call Groq API: " + e.getMessage(), e);
        }
    }

    private String extractGroqResponse(String responseBody) throws Exception {
        ObjectNode response = (ObjectNode) objectMapper.readTree(responseBody);
        if (response.has("choices") && response.get("choices").isArray() && response.get("choices").size() > 0) {
            var choice = response.get("choices").get(0);
            if (choice.has("message") && choice.get("message").has("content")) {
                String text = choice.get("message").get("content").asText();
                // Extract JSON from response (might be wrapped in markdown code blocks)
                if (text.contains("```json")) {
                    text = text.substring(text.indexOf("```json") + 7);
                    text = text.substring(0, text.indexOf("```"));
                } else if (text.contains("```")) {
                    text = text.substring(text.indexOf("```") + 3);
                    text = text.substring(0, text.indexOf("```"));
                }
                return text.trim();
            }
        }
        throw new RuntimeException("Invalid Groq API response format");
    }
}