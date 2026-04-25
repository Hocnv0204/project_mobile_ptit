package com.ptit.mobile.backend.controller;

import com.ptit.mobile.backend.dto.response.BaseResponse;
import com.ptit.mobile.backend.service.AdminDictationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/dictations")
@RequiredArgsConstructor
@Validated
@Tag(name = "Admin Dictation", description = "Admin APIs for managing dictations")
public class AdminDictationController {

    private final AdminDictationService adminDictationService;

    /**
     * GET /api/admin/dictations
     * Trả về danh sách tất cả bài dictation (không lọc theo user).
     */
    @Operation(summary = "Lấy danh sách dictations", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping
    public BaseResponse getAll() {
        return adminDictationService.getAllForAdmin();
    }

    /**
     * POST /api/admin/dictations
     * Tạo bài dictation mới từ YouTube URL + file SRT upload.
     *
     * Form-data:
     *   title       (string, required)
     *   youtubeUrl  (string, required)
     *   srtFile     (file,   required, .srt)
     */
    @Operation(
            summary = "Tạo dictation từ YouTube URL + file SRT",
            description = "Admin upload file SRT, hệ thống parse ra các segment, " +
                          "tạo blank_text + answer_keys tự động.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public BaseResponse create(
            @RequestParam @NotBlank(message = "Title is required") String title,
            @RequestParam @NotBlank(message = "YouTube URL is required") String youtubeUrl,
            @RequestParam MultipartFile srtFile) {
        return adminDictationService.createFromSrtFile(title, youtubeUrl, srtFile);
    }

    /**
     * DELETE /api/admin/dictations/{id}
     */
    @Operation(summary = "Xoá dictation", security = @SecurityRequirement(name = "bearerAuth"))
    @DeleteMapping("/{id}")
    public BaseResponse delete(@PathVariable UUID id) {
        return adminDictationService.delete(id);
    }
}
