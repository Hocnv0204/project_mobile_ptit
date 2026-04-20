package com.lmh.web.dto.request.suggest;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUpdateSuggestVocabularyRequest {

    @NotBlank(message = "Thuật ngữ không được để trống")
    private String term;

    @NotBlank(message = "Nghĩa tiếng Việt không được để trống")
    private String vietnamese;

    @NotBlank(message = "Type không được để trống")
    private String type;

    @NotBlank(message = "Pronunciation không được để trống")
    private String pronunciation;

    @NotBlank(message = "Example không được để trống")
    private String example;
}