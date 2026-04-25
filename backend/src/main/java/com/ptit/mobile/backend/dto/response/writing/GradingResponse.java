//package com.ptit.mobile.backend.dto.response.writing;
//
//import com.fasterxml.jackson.annotation.JsonProperty;
//import lombok.AllArgsConstructor;
//import lombok.Builder;
//import lombok.Getter;
//import lombok.NoArgsConstructor;
//import lombok.Setter;
//
//@Getter
//@Setter
//@NoArgsConstructor
//@AllArgsConstructor
//@Builder
//public class GradingResponse {
//    private Integer score;
//    private String status;
//    private String message;
//    private String comment;
//
//    @JsonProperty("improvement_suggestions")
//    private String improvementSuggestions;
//
//    @JsonProperty("correct_answer")
//    private String correctAnswer;
//}

package com.ptit.mobile.backend.dto.response.writing;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GradingResponse {

//    @JsonProperty("_thought_process")
//    private String thoughtProcess;

    @JsonProperty("accuracy_score")
    private Integer accuracyScore;

    @JsonProperty("accuracy_label")
    private String accuracyLabel;

    @JsonProperty("suggested_translation")
    private String suggestedTranslation;

    @JsonProperty("diff")
    private List<Diff> diff;

    @JsonProperty("feedback_points")
    private List<FeedbackPoint> feedbackPoints;

    @JsonProperty("overall_comment")
    private String overallComment;

    // --- Các lớp mô tả cấu trúc mảng bên trong JSON ---

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Diff {
        private String type; // "keep" | "delete" | "insert"
        private String text;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FeedbackPoint {
        private String type; // "error" | "warning" | "correct"

        @JsonProperty("user_text")
        private String userText;

        @JsonProperty("correct_text")
        private String correctText;

        private String explanation;
    }
}