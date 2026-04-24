package com.ptit.mobile.backend.controller;

import com.ptit.mobile.backend.dto.request.dictation.SubmitSegmentRequest;
import com.ptit.mobile.backend.dto.request.dictation.SyncProgressRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;
import com.ptit.mobile.backend.service.DictationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Tag(name = "Dictation", description = "Dictation learning flow — client-side APIs")
public class DictationController {

    private final DictationService dictationService;

    // ────────────────────────────────────────────────
    // 1. List all dictations (with user progress %)
    // ────────────────────────────────────────────────
    @Operation(
            summary = "Danh sách bài dictation",
            description = "Trả về danh sách tất cả bài dictation kèm % tiến độ của user hiện tại",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @GetMapping("/api/dictations")
    public BaseResponse getAllDictations() {
        return dictationService.getAllDictations();
    }

    // ────────────────────────────────────────────────
    // 2. Get segments of a dictation
    // ────────────────────────────────────────────────
    @Operation(
            summary = "Danh sách segments của bài dictation",
            description = "Trả về tất cả segments sắp xếp theo sequence_order, bao gồm blank_text và answer_keys",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @GetMapping("/api/dictations/{id}/segments")
    public BaseResponse getSegments(@PathVariable("id") UUID dictationId) {
        return dictationService.getSegments(dictationId);
    }

    // ────────────────────────────────────────────────
    // 3. Get user's progress for a dictation
    // ────────────────────────────────────────────────
    @Operation(
            summary = "Lấy tiến độ học dictation",
            description = "Trả về tiến độ hiện tại của user. Nếu chưa bắt đầu, trả default (sequence=1)",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @GetMapping("/api/user/progress/{dictationId}")
    public BaseResponse getUserProgress(@PathVariable("dictationId") UUID dictationId) {
        return dictationService.getUserProgress(dictationId);
    }

    // ────────────────────────────────────────────────
    // 4. Sync (upsert) progress
    // ────────────────────────────────────────────────
    @Operation(
            summary = "Đồng bộ tiến độ (upsert)",
            description = "Tạo mới hoặc cập nhật tiến độ học dictation của user",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @PostMapping("/api/user/progress/sync")
    public BaseResponse syncProgress(@Valid @RequestBody SyncProgressRequest request) {
        return dictationService.syncProgress(request);
    }

    // ────────────────────────────────────────────────
    // 5. Mark dictation as completed
    // ────────────────────────────────────────────────
    @Operation(
            summary = "Hoàn thành bài dictation",
            description = "Đánh dấu tiến độ là COMPLETED, set completed_segments = total_segments",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @PatchMapping("/api/user/progress/{id}/complete")
    public BaseResponse completeProgress(@PathVariable("id") UUID progressId) {
        return dictationService.completeProgress(progressId);
    }

    // ────────────────────────────────────────────────
    // 6. Submit a segment answer for checking
    // ────────────────────────────────────────────────
    @Operation(
            summary = "Nộp đáp án segment",
            description = "So sánh đáp án user nhập với answer_keys (case-insensitive, trimmed)",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @PostMapping("/api/dictations/{id}/submit-segment")
    public BaseResponse submitSegment(
            @PathVariable("id") UUID dictationId,
            @Valid @RequestBody SubmitSegmentRequest request) {
        return dictationService.submitSegment(dictationId, request);
    }
}
