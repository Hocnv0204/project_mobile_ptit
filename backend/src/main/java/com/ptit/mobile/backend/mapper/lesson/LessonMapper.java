package com.ptit.mobile.backend.mapper.lesson;

import com.ptit.mobile.backend.dto.request.writing.AdminUpdateLessonRequest;
import com.ptit.mobile.backend.dto.response.writing.*;
import com.ptit.mobile.backend.model.*;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class LessonMapper {

    public UserTranslationHistoryResponse toHistoryResponse(UserTranslationHistory history, String sentenceVi) {
        if (history == null) {
            return null;
        }
        return UserTranslationHistoryResponse.builder()
                .id(history.getId())
                .userId(history.getUserId())
                .lessonWritingId(history.getLessonWritingId())
                .sentenceId(history.getSentenceId())
                .userAnswer(history.getUserAnswer())
                .aiFeedbackJson(history.getAiFeedbackJson())
                .accuracyScore(history.getAccuracyScore())
                .createdAt(history.getCreatedAt())
                .sentenceVi(sentenceVi)
                .build();
    }

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

    public LessonResponse toResponse(LessonWriting lesson, List<LessonSentence> sentences, List<SuggestVocabulary> vocabularies) {
        if (lesson == null) {
            return null;
        }
        LessonResponse response = new LessonResponse();
        response.setId(lesson.getId());
        response.setName(lesson.getName());
        response.setDescription(lesson.getDescription());
        response.setTotalSentences(lesson.getTotalSentences());

        if (sentences != null) {
            List<LessonSentenceResponse> sentenceResponses = sentences.stream().map(sentence -> {
                LessonSentenceResponse sentenceResponse = new LessonSentenceResponse();
                sentenceResponse.setId(sentence.getId());
                sentenceResponse.setSentenceVi(sentence.getSentenceVi());
                sentenceResponse.setOrderIndex(sentence.getOrderIndex());

                if (vocabularies != null) {
                    List<SuggestVocabularyResponse> vocabsForSentence = vocabularies.stream()
                            .filter(v -> sentence.getId().equals(v.getLessonSentenceId()))
                            .map(this::toSuggestVocabularyResponse)
                            .collect(Collectors.toList());
                    sentenceResponse.setSuggestVocabularies(vocabsForSentence);
                } else {
                    sentenceResponse.setSuggestVocabularies(Collections.emptyList());
                }

                return sentenceResponse;
            }).collect(Collectors.toList());
            response.setSentences(sentenceResponses);
        } else {
            response.setSentences(Collections.emptyList());
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

    public LessonSentenceResponse toSentenceResponse(LessonSentence sentence) {
        if (sentence == null) return null;
        LessonSentenceResponse response = new LessonSentenceResponse();
        response.setId(sentence.getId());
        response.setSentenceVi(sentence.getSentenceVi());
        response.setOrderIndex(sentence.getOrderIndex());
        response.setSuggestVocabularies(Collections.emptyList());
        return response;
    }

    public LessonSentenceResponse toSentenceResponse(LessonSentence sentence, List<SuggestVocabulary> vocabularies) {
        if (sentence == null) return null;
        LessonSentenceResponse response = new LessonSentenceResponse();
        response.setId(sentence.getId());
        response.setSentenceVi(sentence.getSentenceVi());
        response.setOrderIndex(sentence.getOrderIndex());
        if (vocabularies != null) {
            response.setSuggestVocabularies(vocabularies.stream()
                    .filter(v -> sentence.getId().equals(v.getLessonSentenceId()))
                    .map(this::toSuggestVocabularyResponse)
                    .collect(Collectors.toList()));
        } else {
            response.setSuggestVocabularies(Collections.emptyList());
        }
        return response;
    }

    // ==================== Admin Summary ====================

    public AdminLessonSummaryResponse toAdminSummaryResponse(LessonWriting lesson) {
        return toAdminSummaryResponse(lesson, null, null);
    }

    public AdminLessonSummaryResponse toAdminSummaryResponse(LessonWriting lesson, Topic topic, Level level) {
        if (lesson == null) {
            return null;
        }
        AdminLessonSummaryResponse response = new AdminLessonSummaryResponse();
        response.setId(lesson.getId());
        response.setName(lesson.getName());
        response.setStatus(lesson.getStatus());
        response.setDeleteFlag(lesson.getDeleteFlag());
        response.setCreatedAt(lesson.getCreatedAt());
        response.setUpdatedAt(lesson.getUpdatedAt());
        response.setTopicId(lesson.getTopicId());
        response.setLevelId(lesson.getLevelId());
        response.setTopicName(topic != null ? topic.getName() : null);
        response.setLevelName(level != null ? level.getName() : null);
        return response;
    }

    // ==================== Admin Detail ====================

    public AdminLessonDetailResponse toAdminDetailResponse(LessonWriting lesson) {
        return toAdminDetailResponse(lesson, null, null, null, null);
    }

    public AdminLessonDetailResponse toAdminDetailResponse(LessonWriting lesson, List<SuggestVocabulary> vocabularies) {
        return toAdminDetailResponse(lesson, null, null, null, vocabularies);
    }

    public AdminLessonDetailResponse toAdminDetailResponse(
            LessonWriting lesson,
            Topic topic,
            Level level,
            List<LessonSentence> sentences,
            List<SuggestVocabulary> vocabularies
    ) {
        if (lesson == null) {
            return null;
        }
        AdminLessonDetailResponse response = new AdminLessonDetailResponse();
        response.setId(lesson.getId());
        response.setName(lesson.getName());
        response.setDescription(lesson.getDescription());
        response.setStatus(lesson.getStatus());
        response.setDeleteFlag(lesson.getDeleteFlag());
        response.setTotalSentences(lesson.getTotalSentences());
        response.setCreatedAt(lesson.getCreatedAt());
        response.setUpdatedAt(lesson.getUpdatedAt());
        response.setTopicId(lesson.getTopicId());
        response.setLevelId(lesson.getLevelId());
        response.setTopicName(topic != null ? topic.getName() : "");
        response.setLevelName(level != null ? level.getName() : "");

        if (sentences != null) {
            response.setSentences(sentences.stream()
                    .map(s -> toSentenceResponse(s, vocabularies))
                    .collect(Collectors.toList()));
        } else {
            response.setSentences(Collections.emptyList());
        }

        if (vocabularies != null) {
            response.setSuggestVocabularies(vocabularies.stream()
                    .map(this::toSuggestVocabularyResponse)
                    .collect(Collectors.toList()));
        } else {
            response.setSuggestVocabularies(Collections.emptyList());
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
        if (request.getDescription() != null) {
            lesson.setDescription(request.getDescription());
        }
    }
}
