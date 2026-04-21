package com.ptit.mobile.backend.integration.writing.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ptit.mobile.backend.config.GeminiConfig;
import com.ptit.mobile.backend.dto.response.ai.GradingResponse;
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
public class GeminiProvider implements AIProvider {
    
    private final ResourceLoader resourceLoader;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final GeminiConfig geminiConfig;
    
    public GeminiProvider(ResourceLoader resourceLoader, ObjectMapper objectMapper, GeminiConfig geminiConfig) {
        this.resourceLoader = resourceLoader;
        this.restTemplate = new RestTemplate();
        this.objectMapper = objectMapper;
        this.geminiConfig = geminiConfig;
    }
    
    @Override
    public LessonGenerationResult generateLesson(String topic, String level, String description, String apiUrl, String apiKey) {
        try {
            String prompt = loadAndFormatPrompt(topic, level, description);
            String jsonResponse = callGeminiApi(prompt, apiUrl, apiKey);
            return objectMapper.readValue(jsonResponse, LessonGenerationResult.class);
        } catch (Exception e) {
            log.error("Error generating lesson with Gemini", e);
            throw new RuntimeException("Failed to generate lesson: " + e.getMessage(), e);
        }
    }
    
    @Override
    public GradingResponse gradeAnswer(String question, String answer, String apiUrl, String apiKey) {
        try {
            String prompt = loadAndFormatGradingPrompt(question, answer);
            String jsonResponse = callGeminiApi(prompt, apiUrl, apiKey);
            return objectMapper.readValue(jsonResponse, GradingResponse.class);
        } catch (Exception e) {
            log.error("Error grading answer with Gemini", e);
            throw new RuntimeException("Failed to grade answer: " + e.getMessage(), e);
        }
    }
    
    @Override
    public String getProviderType() {
        return "gemini";
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

    private String callGeminiApi(String prompt, String apiUrl, String apiKey) {
        try {
            // 1. Chuẩn bị URL
            String url = String.format("%s/%s:generateContent?key=%s",
                    apiUrl, geminiConfig.getModel(), apiKey);

            // 2. Xây dựng cấu trúc JSON Body bằng Jackson
            // Cấu trúc mong muốn: {"contents": [{"parts": [{"text": "prompt"}]}]}

            ObjectNode requestBody = objectMapper.createObjectNode();

            // Tạo mảng "contents"
            ArrayNode contentsArray = objectMapper.createArrayNode();
            ObjectNode contentObject = objectMapper.createObjectNode();

            // Tạo mảng "parts" bên trong mỗi content
            ArrayNode partsArray = objectMapper.createArrayNode(); // Sửa lỗi: Dùng ArrayNode thay vì ObjectNode
            ObjectNode textPart = objectMapper.createObjectNode();
            textPart.put("text", prompt);

            // Lắp ghép các mảnh lại
            partsArray.add(textPart); // Thêm object {text: ...} vào mảng parts
            contentObject.set("parts", partsArray); // Đưa mảng parts vào object content
            contentsArray.add(contentObject); // Đưa object content vào mảng contents

            requestBody.set("contents", contentsArray);

            // 3. Thiết lập Headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // 4. Tạo HttpEntity (Chuyển ObjectNode thành chuỗi JSON)
            HttpEntity<String> request = new HttpEntity<>(objectMapper.writeValueAsString(requestBody), headers);

            // 5. Gọi API
            log.info("Calling Gemini API with URL: {}", url);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            // 6. Xử lý phản hồi
            if (response.getStatusCode() == HttpStatus.OK) {
                return extractGeminiResponse(response.getBody());
            } else {
                log.error("Gemini API returned error: {} - Body: {}", response.getStatusCode(), response.getBody());
                throw new RuntimeException("Gemini API error: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error calling Gemini API", e);
            throw new RuntimeException("Failed to call Gemini API: " + e.getMessage(), e);
        }
    }
    
    private String extractGeminiResponse(String responseBody) throws Exception {
        ObjectNode response = (ObjectNode) objectMapper.readTree(responseBody);
        if (response.has("candidates") && response.get("candidates").isArray() && response.get("candidates").size() > 0) {
            var candidate = response.get("candidates").get(0);
            if (candidate.has("content") && candidate.get("content").has("parts")) {
                var parts = candidate.get("content").get("parts");
                if (parts.isArray() && parts.size() > 0) {
                    String text = parts.get(0).get("text").asText();
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
        }
        throw new RuntimeException("Invalid Gemini API response format");
    }
}
