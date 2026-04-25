package com.ptit.mobile.backend.service.impl;

import com.ptit.mobile.backend.dto.response.streak.StreakResponse;
import com.ptit.mobile.backend.model.UserStreak;
import com.ptit.mobile.backend.repository.UserStreakRepository;
import com.ptit.mobile.backend.service.StreakService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class StreakServiceImpl implements StreakService {

    private final UserStreakRepository userStreakRepository;

    @Override
    @Transactional
    public StreakResponse updateStreak(Long userId) {
        LocalDate today = LocalDate.now();

        UserStreak streak = userStreakRepository.findByUserId(userId)
                .orElseGet(() -> UserStreak.builder()
                        .userId(userId)
                        .currentStreak(0)
                        .longestStreak(0)
                        .build());

        // Nếu hôm nay đã điểm danh rồi → không làm gì
        if (today.equals(streak.getLastActivityDate())) {
            return toResponse(streak, true);
        }

        // Nếu hôm qua có hoạt động → tăng streak
        if (streak.getLastActivityDate() != null
                && today.minusDays(1).equals(streak.getLastActivityDate())) {
            streak.setCurrentStreak(streak.getCurrentStreak() + 1);
        } else {
            // Bỏ lỡ ít nhất 1 ngày (hoặc lần đầu dùng) → reset
            streak.setCurrentStreak(1);
        }

        streak.setLastActivityDate(today);

        // Cập nhật longestStreak nếu cần
        if (streak.getCurrentStreak() > streak.getLongestStreak()) {
            streak.setLongestStreak(streak.getCurrentStreak());
        }

        userStreakRepository.save(streak);

        return toResponse(streak, false);
    }

    @Override
    public StreakResponse getStreak(Long userId) {
        UserStreak streak = userStreakRepository.findByUserId(userId).orElse(null);
        if (streak == null) {
            streak = UserStreak.builder()
                    .userId(userId)
                    .currentStreak(0)
                    .longestStreak(0)
                    .build();
            streak = userStreakRepository.save(streak);
        }

        boolean checkedInToday = LocalDate.now().equals(streak.getLastActivityDate());
        return toResponse(streak, checkedInToday);
    }

    // -------------------------------------------------------------------------
    private StreakResponse toResponse(UserStreak streak, boolean alreadyCheckedInToday) {
        return StreakResponse.builder()
                .currentStreak(streak.getCurrentStreak())
                .longestStreak(streak.getLongestStreak())
                .lastActivityDate(streak.getLastActivityDate())
                .alreadyCheckedInToday(alreadyCheckedInToday)
                .build();
    }
}
