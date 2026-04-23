package com.ptit.mobile.backend.dto.response.writing;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class LessonSentenceResponse {
    private Integer id;
    private String sentenceVi;
    private Integer orderIndex;
    private List<SuggestVocabularyResponse> suggestVocabularies;
}
