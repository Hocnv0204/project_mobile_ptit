package com.ptit.mobile.backend.client;

import com.ptit.mobile.backend.dto.response.free_dictionary_client.FreeDictionaryResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "free-dictionary-client", url = "https://api.dictionaryapi.dev")
public interface FreeDictionaryClient {
    @GetMapping("/api/v2/entries/en/{word}")
    List<FreeDictionaryResponse> getWord(@PathVariable("word") String word);
}
