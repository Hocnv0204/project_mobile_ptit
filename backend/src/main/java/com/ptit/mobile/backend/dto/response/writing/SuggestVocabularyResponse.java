package com.ptit.mobile.backend.dto.response.writing;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class SuggestVocabularyResponse {
    private int id;
    private String term;
    private String vietnamese;
    private String type;
    private String pronunciation;
    private String example;
} 