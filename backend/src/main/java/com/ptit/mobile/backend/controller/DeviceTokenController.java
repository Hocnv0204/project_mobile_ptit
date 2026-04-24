package com.ptit.mobile.backend.controller;

import com.ptit.mobile.backend.model.UserDeviceToken;
import com.ptit.mobile.backend.repository.UserDeviceTokenRepository;
import com.ptit.mobile.backend.scheduler.StreakReminderScheduler;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/tokens")
public class DeviceTokenController {

    private final UserDeviceTokenRepository userDeviceTokenRepository;
    private final StreakReminderScheduler streakReminderScheduler;

    public DeviceTokenController(UserDeviceTokenRepository userDeviceTokenRepository, StreakReminderScheduler streakReminderScheduler) {
        this.userDeviceTokenRepository = userDeviceTokenRepository;
        this.streakReminderScheduler = streakReminderScheduler;
    }

    @PostMapping("/save")
    public ResponseEntity<?> saveToken(@RequestBody Map<String, String> payload) {
        String token = payload.get("token");
        String userIdStr = payload.get("userId");
        String deviceInfo = payload.get("deviceInfo");

        if (token == null || userIdStr == null) {
            return ResponseEntity.badRequest().body("Token and userId are required");
        }

        Long userId = Long.parseLong(userIdStr);

        Optional<UserDeviceToken> existingToken = userDeviceTokenRepository.findByExpoPushToken(token);
        if (existingToken.isPresent()) {
            UserDeviceToken userDeviceToken = existingToken.get();
            userDeviceToken.setUserId(userId); // Update user if token belongs to someone else now
            userDeviceToken.setDeviceInfo(deviceInfo);
            userDeviceTokenRepository.save(userDeviceToken);
        } else {
            UserDeviceToken newToken = UserDeviceToken.builder()
                    .userId(userId)
                    .expoPushToken(token)
                    .deviceInfo(deviceInfo)
                    .build();
            userDeviceTokenRepository.save(newToken);
        }

        return ResponseEntity.ok().body("Token saved successfully");
    }

    // Endpoint for testing the scheduler manually
    @PostMapping("/test-streak-reminder")
    public ResponseEntity<?> testStreakReminder() {
        streakReminderScheduler.triggerReminderNow();
        return ResponseEntity.ok().body("Streak reminder triggered");
    }
}
