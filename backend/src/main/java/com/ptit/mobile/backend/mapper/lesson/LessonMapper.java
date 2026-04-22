package com.ptit.mobile.backend.mapper.lesson;

import com.ptit.mobile.backend.dto.request.writing.AdminUpdateLessonRequest;
import com.ptit.mobile.backend.dto.response.writing.*;
import com.ptit.mobile.backend.model.LessonWriting;
import com.ptit.mobile.backend.model.SuggestVocabulary;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class LessonMapper {

    public LessonSummaryResponse toSummaryResponse(LessonWriting lesson) {
        if (lesson == null) {
            return null;
        }
        LessonSummaryResponse response = new LessonSummaryResponse();
        response.setId(lesson.getId());
        response.setName(lesson.getName());
        response.setDescription(lesson.getDescription());
        response.setCreatedAt(lesson.getCreatedAt());
        return response;
    }

    public LessonResponse toResponse(LessonWriting lesson) {
        if (lesson == null) {
            return null;
        }
        LessonResponse response = new LessonResponse();
        response.setId(lesson.getId());
        response.setName(lesson.getName());
        response.setParagraph(lesson.getParagraph());
        response.setDescription(lesson.getDescription());
        response.setSuggestVocabularies(Collections.emptyList());
        return response;
    }

    public LessonResponse toResponse(LessonWriting lesson, List<SuggestVocabulary> vocabularies) {
        LessonResponse response = toResponse(lesson);
        if (response != null && vocabularies != null) {
            response.setSuggestVocabularies(vocabularies.stream()
                    .map(this::toSuggestVocabularyResponse)
                    .collect(Collectors.toList()));
        }
        return response;
    }

    public SuggestVocabularyResponse toSuggestVocabularyResponse(SuggestVocabulary vocabulary) {
        if (vocabulary == null) {
            return null;
        }
        SuggestVocabularyResponse response = new SuggestVocabularyResponse();
        response.setId(vocabulary.getId());
        response.setTerm(vocabulary.getTerm());
        response.setVietnamese(vocabulary.getVietnamese());
        response.setType(vocabulary.getType());
        response.setPronunciation(vocabulary.getPronunciation());
        response.setExample(vocabulary.getExample());
        return response;
    }

    public AdminLessonSummaryResponse toAdminSummaryResponse(LessonWriting lesson) {
        if (lesson == null) {
            return null;
        }

        AdminLessonSummaryResponse response = new AdminLessonSummaryResponse();
        response.setId(lesson.getId());
        response.setName(lesson.getName());
        response.setCreatedAt(lesson.getCreatedAt());
        response.setDeleteFlag(lesson.getDeleteFlag());

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

    public AdminLessonDetailResponse toAdminDetailResponse(LessonWriting lesson, List<SuggestVocabulary> vocabularies) {
        AdminLessonDetailResponse response = toAdminDetailResponse(lesson);
        if (response != null && vocabularies != null) {
            response.setSuggestVocabularies(vocabularies.stream()
                    .map(this::toSuggestVocabularyResponse)
                    .collect(Collectors.toList()));
        }
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
