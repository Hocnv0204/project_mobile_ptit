package com.ptit.mobile.backend.service.writing;

import com.ptit.mobile.backend.dto.request.ai.GradingRequest;
import com.ptit.mobile.backend.dto.response.writing.GradingResponse;
import com.ptit.mobile.backend.dto.response.writing.LessonResponse;
import com.ptit.mobile.backend.dto.response.writing.LessonSummaryResponse;
import org.springframework.data.domain.Page;

public interface LessonService {
    GradingResponse gradeAnswer(GradingRequest request);

    Page<LessonSummaryResponse> getAllLessonsForUser(
            String searchTerm, Integer topicId, Integer levelId,
            int page, int size, String sortBy, String sortDir
    );

    LessonResponse getLessonDetails(Integer lessonId);
}
