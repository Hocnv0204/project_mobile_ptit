package com.ptit.mobile.backend.dto.request.writing;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ManualCreateLessonRequest {

    @NotBlank(message = "Tên bài học không được để trống")
    private String name;

    @NotBlank(message = "Mô tả không được để trống")
    private String description;

    @NotNull(message = "Chủ đề không được để trống")
    private Integer topicId;

    @NotNull(message = "Trình độ không được để trống")
    private Integer levelId;

    @NotNull(message = "Danh sách câu không được để trống")
    private List<ManualSentenceRequest> sentences;

    @Getter
    @Setter
    public static class ManualSentenceRequest {
        @NotBlank(message = "Câu tiếng Việt không được để trống")
        private String sentenceVi;

        private Integer orderIndex;

        private List<ManualVocabularyRequest> suggestVocabularies;

        @Getter
        @Setter
        public static class ManualVocabularyRequest {
            @NotBlank(message = "Term không được để trống")
            private String term;

            @NotBlank(message = "Tiếng Việt không được để trống")
            private String vietnamese;

            private String type;
            private String pronunciation;
            private String example;
        }
    }
}
