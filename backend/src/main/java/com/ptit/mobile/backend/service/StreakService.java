package com.ptit.mobile.backend.service;

import com.ptit.mobile.backend.dto.response.streak.StreakResponse;

public interface StreakService {

    /**
     * Cập nhật streak cho người dùng (điểm danh hàng ngày).
     * - Nếu đã điểm danh hôm nay: không làm gì, trả về streak hiện tại.
     * - Nếu hôm qua có hoạt động: tăng currentStreak + 1.
     * - Nếu bỏ lỡ ít nhất 1 ngày: reset currentStreak = 1.
     *
     * @param userId ID người dùng
     * @return StreakResponse chứa thông tin streak sau khi cập nhật
     */
    StreakResponse updateStreak(Long userId);

    /**
     * Lấy thông tin streak hiện tại của người dùng.
     *
     * @param userId ID người dùng
     * @return StreakResponse chứa thông tin streak
     */
    StreakResponse getStreak(Long userId);
}
