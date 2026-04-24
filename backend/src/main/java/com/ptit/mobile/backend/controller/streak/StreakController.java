package com.ptit.mobile.backend.controller.streak;

import com.ptit.mobile.backend.dto.response.BaseResponse;
import com.ptit.mobile.backend.dto.response.streak.StreakResponse;
import com.ptit.mobile.backend.service.StreakService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/streaks")
@RequiredArgsConstructor
public class StreakController {

    private final StreakService streakService;

    /**
     * POST /api/streaks/check-in
     * Điểm danh hàng ngày – cập nhật streak của người dùng hiện tại.
     * Idempotent: gọi nhiều lần trong cùng 1 ngày vẫn an toàn.
     */
    @PostMapping("/check-in")
    public BaseResponse checkIn(Authentication authentication) {
        Long userId = (Long) authentication.getDetails();
        StreakResponse streakResponse = streakService.updateStreak(userId);
        return BaseResponse.builder()
                .code(200L)
                .message(streakResponse.isAlreadyCheckedInToday()
                        ? "Already checked in today"
                        : "Check-in successful")
                .data(streakResponse)
                .build();
    }

    /**
     * GET /api/streaks
     * Lấy thông tin streak hiện tại của người dùng (không thay đổi dữ liệu).
     */
    @GetMapping
    public BaseResponse getStreak(Authentication authentication) {
        Long userId = (Long) authentication.getDetails();
        StreakResponse streakResponse = streakService.getStreak(userId);
        return BaseResponse.builder()
                .code(200L)
                .message("Success")
                .data(streakResponse)
                .build();
    }
}
