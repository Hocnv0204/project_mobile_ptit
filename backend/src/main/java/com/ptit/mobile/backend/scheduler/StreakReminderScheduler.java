package com.ptit.mobile.backend.scheduler;

import com.ptit.mobile.backend.model.Notification;
import com.ptit.mobile.backend.model.UserDeviceToken;
import com.ptit.mobile.backend.model.UserStreak;
import com.ptit.mobile.backend.repository.NotificationRepository;
import com.ptit.mobile.backend.repository.UserDeviceTokenRepository;
import com.ptit.mobile.backend.repository.UserStreakRepository;
import com.ptit.mobile.backend.service.ExpoNotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class StreakReminderScheduler {

    private static final Logger logger = LoggerFactory.getLogger(StreakReminderScheduler.class);

    private final UserStreakRepository userStreakRepository;
    private final UserDeviceTokenRepository userDeviceTokenRepository;
    private final NotificationRepository notificationRepository;
    private final ExpoNotificationService expoNotificationService;

    @Value("${streak.reminder.timezone:Asia/Ho_Chi_Minh}")
    private String timezone;

    @Value("${streak.reminder.enabled:true}")
    private boolean isEnabled;

    public StreakReminderScheduler(UserStreakRepository userStreakRepository,
                                   UserDeviceTokenRepository userDeviceTokenRepository,
                                   NotificationRepository notificationRepository,
                                   ExpoNotificationService expoNotificationService) {
        this.userStreakRepository = userStreakRepository;
        this.userDeviceTokenRepository = userDeviceTokenRepository;
        this.notificationRepository = notificationRepository;
        this.expoNotificationService = expoNotificationService;
    }

    // Run at 20:00 every day by default, based on the timezone configured
    @Scheduled(cron = "${streak.reminder.cron:0 0 20 * * *}", zone = "${streak.reminder.timezone:Asia/Ho_Chi_Minh}")
    public void scheduleReminder() {
        if (!isEnabled) {
            logger.info("Streak reminder is disabled.");
            return;
        }
        triggerReminderNow();
    }

    public void triggerReminderNow() {
        logger.info("Starting streak reminder job...");

        ZoneId zoneId = ZoneId.of(timezone);
        LocalDate today = LocalDate.now(zoneId);

        List<UserStreak> allStreaks = userStreakRepository.findAll();

        for (UserStreak streak : allStreaks) {
            // If user hasn't studied today (lastActivityDate is null or before today)
            if (streak.getLastActivityDate() == null || streak.getLastActivityDate().isBefore(today)) {
                Long userId = streak.getUserId();
                
                // Get user's device tokens
                List<UserDeviceToken> tokens = userDeviceTokenRepository.findByUserId(userId);
                
                if (tokens != null && !tokens.isEmpty()) {
                    List<String> pushTokens = tokens.stream()
                            .map(UserDeviceToken::getExpoPushToken)
                            .collect(Collectors.toList());

                    String title = "Đừng đánh mất chuỗi học tập!";
                    String body = "Bạn chưa học hôm nay. Vào học ngay để giữ chuỗi " + streak.getCurrentStreak() + " ngày nhé!";
                    
                    Map<String, Object> data = new HashMap<>();
                    data.put("screen", "StreakDetailsScreen");
                    data.put("userId", userId);

                    // Send push notification via Expo
                    expoNotificationService.sendPushNotifications(pushTokens, title, body, data);
                }
            }
        }
        logger.info("Completed streak reminder job.");
    }
}
