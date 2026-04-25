package com.ptit.mobile.backend.service.writing;

import com.ptit.mobile.backend.dto.request.writing.AdminCreateLessonRequest;
import com.ptit.mobile.backend.dto.request.writing.AdminUpdateLessonRequest;
import com.ptit.mobile.backend.dto.request.writing.AdminUpdateSuggestVocabularyRequest;
import com.ptit.mobile.backend.dto.request.writing.ManualCreateLessonRequest;
import com.ptit.mobile.backend.dto.response.writing.AdminLessonDetailResponse;
import com.ptit.mobile.backend.dto.response.writing.AdminLessonSummaryResponse;
import com.ptit.mobile.backend.dto.response.writing.LessonGenerationResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface AdminLessonService {

    AdminLessonDetailResponse requestLessonGeneration(AdminCreateLessonRequest request);

    AdminLessonDetailResponse createManualLesson(ManualCreateLessonRequest request);

    Page<AdminLessonSummaryResponse> getAllLessonsForAdmin(
            String searchTerm, Integer topicId, Integer levelId, Boolean isDeleted,
            int page, int size, String sortBy, String sortDir
    );

    AdminLessonDetailResponse getLessonDetailsForAdmin(Integer lessonId);

    AdminLessonDetailResponse updateLessonForAdmin(Integer lessonId, AdminUpdateLessonRequest request);

    void updateVocabulariesForLesson(Integer lessonId, List<AdminUpdateSuggestVocabularyRequest> vocabularyRequests);

    void deleteLessonForAdmin(Integer lessonId);

    void restoreLessonForAdmin(Integer lessonId);
}
