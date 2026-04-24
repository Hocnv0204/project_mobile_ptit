package com.ptit.mobile.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class OpenAIService {

  private String apiKey;

  private final RestTemplate restTemplate = new RestTemplate();

  public String callAI(String topic, String level) {

    String prompt = """
        Generate an English learning podcast.

        Topic: %s
        Level: %s

        Return STRICT JSON:
        {
          "title": "",
          "description": "",
          "dialogues": [
            {"speaker":"A","content":""}
          ],
          "vocab":[
            {
              "term":"",
              "definition":"",
              "example":"",
              "pronunciation":"",
              "wordType":"",
              "vocabType":"key"
            }
          ]
        }
        """.formatted(topic, level);

    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(apiKey);
    headers.setContentType(MediaType.APPLICATION_JSON);

    Map<String, Object> body = Map.of(
        "model", "gpt-4.1-mini",
        "messages", List.of(
            Map.of("role", "user", "content", prompt)));

    HttpEntity<?> request = new HttpEntity<>(body, headers);

    ResponseEntity<Map> response = restTemplate.postForEntity(
        "https://api.openai.com/v1/chat/completions",
        request,
        Map.class);

    Map choiceMap = (Map) ((List) response.getBody().get("choices")).get(0);
    Map messageMap = (Map) choiceMap.get("message");
    return (String) messageMap.get("content");
  }

  /**
   * Gọi OpenAI TTS API để chuyển text thành audio MP3.
   * 
   * @param text  nội dung cần đọc
   * @param voice giọng đọc: alloy, echo, fable, onyx, nova, shimmer
   * @return byte[] dữ liệu MP3
   */
  public byte[] generateSpeech(String text, String voice) {
    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(apiKey);
    headers.setContentType(MediaType.APPLICATION_JSON);

    Map<String, Object> body = Map.of(
        "model", "tts-1",
        "input", text,
        "voice", voice != null ? voice : "nova",
        "response_format", "mp3");

    HttpEntity<?> request = new HttpEntity<>(body, headers);

    ResponseEntity<byte[]> response = restTemplate.postForEntity(
        "https://api.openai.com/v1/audio/speech",
        request,
        byte[].class);

    return response.getBody();
  }
}