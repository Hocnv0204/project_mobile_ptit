package com.ptit.mobile.backend.dto.response.writing;

import com.ptit.mobile.backend.dto.response.writing.SuggestVocabularyResponse;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class LessonResponse {
    private int id;
    private String name;
    private String description;
    private int totalSentences;
    private List<LessonSentenceResponse> sentences;
} 