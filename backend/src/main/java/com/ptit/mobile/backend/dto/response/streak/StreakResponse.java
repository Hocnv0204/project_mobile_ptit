package com.ptit.mobile.backend.dto.response.streak;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StreakResponse {

    private Integer currentStreak;
    private Integer longestStreak;
    private LocalDate lastActivityDate;
    private boolean alreadyCheckedInToday;
}
