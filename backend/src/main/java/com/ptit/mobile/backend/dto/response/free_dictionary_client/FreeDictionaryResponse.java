package com.ptit.mobile.backend.dto.response.free_dictionary_client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.w3c.dom.stylesheets.LinkStyle;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FreeDictionaryResponse {
    private String word;
    private List<Phonetic> phonetics;
    private List<Meaning> meanings;
    private List<String> sourceUrls;
}
