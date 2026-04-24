package com.ptit.mobile.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ExpoNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(ExpoNotificationService.class);
    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
    private final RestTemplate restTemplate;

    public ExpoNotificationService() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Send push notification using Expo Push API
     *
     * @param tokens List of Expo push tokens
     * @param title  Title of the notification
     * @param body   Body of the notification
     * @param data   Extra data for frontend routing or logic
     */
    public void sendPushNotifications(List<String> tokens, String title, String body, Map<String, Object> data) {
        if (tokens == null || tokens.isEmpty()) {
            return;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.set("Accept-Encoding", "gzip, deflate");

        List<Map<String, Object>> messages = new ArrayList<>();
        for (String token : tokens) {
            Map<String, Object> message = new HashMap<>();
            message.put("to", token);
            message.put("sound", "default");
            message.put("title", title);
            message.put("body", body);
            message.put("data", data);
            messages.add(message);
        }

        HttpEntity<List<Map<String, Object>>> request = new HttpEntity<>(messages, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(EXPO_PUSH_URL, request, String.class);
            logger.info("Sent push notifications. Response: {}", response.getBody());
        } catch (Exception e) {
            logger.error("Failed to send push notifications: {}", e.getMessage(), e);
        }
    }
}
