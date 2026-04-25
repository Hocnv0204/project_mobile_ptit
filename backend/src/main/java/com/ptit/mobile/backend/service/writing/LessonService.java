package com.ptit.mobile.backend.service.writing;

import com.ptit.mobile.backend.dto.request.writing.GradingRequest;
import com.ptit.mobile.backend.dto.request.writing.UpdateProgressRequest;
import com.ptit.mobile.backend.dto.response.writing.GradingResponse;
import com.ptit.mobile.backend.dto.response.writing.LessonResponse;
import com.ptit.mobile.backend.dto.response.writing.LessonSummaryResponse;
import com.ptit.mobile.backend.dto.response.writing.UserLessonProgressResponse;
import com.ptit.mobile.backend.dto.response.writing.UserTranslationHistoryResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface LessonService {
    GradingResponse gradeAnswer(GradingRequest request, Long userId);

    Page<LessonSummaryResponse> getAllLessonsForUser(
            String searchTerm, Integer topicId, Integer levelId,
            int page, int size, String sortBy, String sortDir
    );

    LessonResponse getLessonDetails(Integer lessonId);

    UserLessonProgressResponse getLessonProgress(Long userId, Integer lessonId);

    List<UserLessonProgressResponse> getLessonsProgress(Long userId, List<Integer> lessonIds);

    void updateLessonProgress(UpdateProgressRequest request, Long userId);

    Page<UserLessonProgressResponse> getMyLessonsProgress(Long userId, int page, int size);

    Page<UserTranslationHistoryResponse> getTranslationHistory(Long userId, int page, int size);
}
