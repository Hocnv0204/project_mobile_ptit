package com.ptit.mobile.backend.controller;

import com.ptit.mobile.backend.dto.request.ai.FormatTermsRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;
import com.ptit.mobile.backend.service.GeminiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Tag(name = "AI", description = "Các API sử dụng Gemini để chuẩn hoá dữ liệu")
public class AiController {
    private final GeminiService geminiService;

    @Operation(
            summary = "Format danh sách từ vựng sang JSON chuẩn",
            description = "Input dạng: \"con chó, con mèo, con gà\". Output: mảng các object theo schema term/vi/type/pronunciation/example",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @PostMapping("/terms/format")
    public BaseResponse formatTerms(@Valid @RequestBody FormatTermsRequest request) {
        return BaseResponse.success(geminiService.formatTerms(request.getInput()));
    }
}

