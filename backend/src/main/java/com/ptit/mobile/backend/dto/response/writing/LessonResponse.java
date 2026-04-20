package com.ptit.mobile.backend.dto.response.writing;

import com.lmh.web.dto.response.suggest.SuggestVocabularyResponse;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class LessonResponse {
    private int id;
    private String name;
    private String paragraph;
    private String description;
    private List<SuggestVocabularyResponse> suggestVocabularies;

} 