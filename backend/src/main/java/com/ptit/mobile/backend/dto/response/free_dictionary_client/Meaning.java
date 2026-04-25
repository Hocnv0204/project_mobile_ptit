package com.ptit.mobile.backend.dto.response.free_dictionary_client;

import lombok.Data;

import java.util.List;

@Data
public class Meaning {
    private String partOfSpeech;
    private List<Definition> definitions;
}
