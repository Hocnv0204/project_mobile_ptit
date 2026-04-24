package com.ptit.mobile.backend.service.writing;

import com.ptit.mobile.backend.dto.request.writing.GradingRequest;
import com.ptit.mobile.backend.dto.request.writing.UpdateProgressRequest;
import com.ptit.mobile.backend.dto.response.writing.GradingResponse;
import com.ptit.mobile.backend.dto.response.writing.LessonResponse;
import com.ptit.mobile.backend.dto.response.writing.LessonSummaryResponse;
import com.ptit.mobile.backend.dto.response.writing.UserLessonProgressResponse;
import org.springframework.data.domain.Page;

public interface LessonService {
    GradingResponse gradeAnswer(GradingRequest request, Long userId);

    Page<LessonSummaryResponse> getAllLessonsForUser(
            String searchTerm, Integer topicId, Integer levelId,
            int page, int size, String sortBy, String sortDir
    );

    LessonResponse getLessonDetails(Integer lessonId);

    UserLessonProgressResponse getLessonProgress(Long userId, Integer lessonId);

    void updateLessonProgress(UpdateProgressRequest request, Long userId);
}
