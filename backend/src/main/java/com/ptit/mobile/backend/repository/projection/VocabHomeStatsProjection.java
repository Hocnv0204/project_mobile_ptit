package com.ptit.mobile.backend.repository.projection;

public interface VocabHomeStatsProjection {
    Long getTotal();
    Long getNewWords();
    Long getDueToday();
    Long getOverdue();
    Long getUpcoming();
    Long getUpcoming7d();
}

