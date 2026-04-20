package com.ptit.mobile.backend.mapper;

import com.ptit.mobile.backend.dto.request.writing.AdminUpdateLessonRequest;
import com.ptit.mobile.backend.dto.response.writing.AdminLessonDetailResponse;
import com.ptit.mobile.backend.dto.response.writing.AdminLessonSummaryResponse;
import com.ptit.mobile.backend.model.LessonWriting;
import org.springframework.stereotype.Component;

@Component
public class LessonMapper {

    public AdminLessonSummaryResponse toAdminSummaryResponse(LessonWriting lesson) {
        if (lesson == null) {
            return null;
        }

        AdminLessonSummaryResponse response = new AdminLessonSummaryResponse();
        response.setId(lesson.getId());
        response.setName(lesson.getName());
        response.setCreatedAt(lesson.getCreatedAt());
        response.setDeleteFlag(lesson.getDeleteFlag());

        // Set topic and level names (will need to fetch from repositories if needed)
        // For now, just set the IDs or leave empty
        response.setTopicName(""); // Will be populated from related data if available
        response.setLevelName(""); // Will be populated from related data if available

        return response;
    }

    public AdminLessonDetailResponse toAdminDetailResponse(LessonWriting lesson) {
        if (lesson == null) {
            return null;
        }

        AdminLessonDetailResponse response = new AdminLessonDetailResponse();
        response.setId(lesson.getId());
        response.setName(lesson.getName());
        response.setParagraph(lesson.getParagraph());
        response.setNote(lesson.getNote());
        response.setDescription(lesson.getDescription());
        response.setDeleteFlag(lesson.getDeleteFlag());
        response.setCreatedAt(lesson.getCreatedAt());
        response.setUpdatedAt(lesson.getUpdatedAt());

        // Set topic and level names (will need to fetch from repositories if needed)
        response.setTopicName(""); // Will be populated from related data if available
        response.setLevelName(""); // Will be populated from related data if available

        // Initialize empty list for vocabularies
        response.setSuggestVocabularies(java.util.Collections.emptyList());

        return response;
    }

    public void updateEntityFromRequest(AdminUpdateLessonRequest request, LessonWriting lesson) {
        if (request == null || lesson == null) {
            return;
        }

        if (request.getName() != null) {
            lesson.setName(request.getName());
        }
        if (request.getParagraph() != null) {
            lesson.setParagraph(request.getParagraph());
        }
        if (request.getNote() != null) {
            lesson.setNote(request.getNote());
        }
        if (request.getDescription() != null) {
            lesson.setDescription(request.getDescription());
        }
    }
}
