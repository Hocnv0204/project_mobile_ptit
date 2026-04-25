package com.ptit.mobile.backend.dto.request.vocab;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateListVocabRequest {
    List<CreateVocabRequest> listVocabRequest;
}
