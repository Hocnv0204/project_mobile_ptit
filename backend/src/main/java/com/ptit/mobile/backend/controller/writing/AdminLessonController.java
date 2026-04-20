package com.ptit.mobile.backend.controller.writing;


import com.ptit.mobile.backend.dto.request.writing.AdminCreateLessonRequest;
import com.ptit.mobile.backend.dto.request.writing.AdminUpdateLessonRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;
import com.ptit.mobile.backend.dto.response.PageResponse;
import com.ptit.mobile.backend.dto.response.writing.AdminLessonDetailResponse;
import com.ptit.mobile.backend.dto.response.writing.AdminLessonSummaryResponse;
import com.ptit.mobile.backend.dto.response.writing.LessonGenerationResponse;
import com.ptit.mobile.backend.service.writing.impl.AdminLessonServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/admin/lessons")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminLessonController {

    private final AdminLessonServiceImpl adminLessonService;

    @PostMapping("/generate-with-ai")
    public BaseResponse createLessonWithAi(
            @Valid @RequestBody AdminCreateLessonRequest request,
            Authentication authentication
    ) {
        Jwt jwtPrincipal = (Jwt) authentication.getPrincipal();
        Long userIdLong = jwtPrincipal.getClaim("id");
        Integer userId;
        try {
            userId = Math.toIntExact(userIdLong);
        } catch (ArithmeticException e) {
            throw new IllegalArgumentException("User ID from token is too large.", e);
        }

        LessonGenerationResponse response = adminLessonService.requestLessonGeneration(userId, request);
        return BaseResponse.builder()
                .code(202L)
                .message("Lesson generation request accepted")
                .data(response)
                .build();
    }

    @GetMapping
    public BaseResponse getAllLessons(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) Integer topicId,
            @RequestParam(required = false) Integer levelId,
            @RequestParam(required = false) Boolean isDeleted,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        Page<AdminLessonSummaryResponse> lessonPage = adminLessonService.getAllLessonsForAdmin(
                searchTerm, topicId, levelId, isDeleted, page, size, sortBy, sortDir
        );
        PageResponse<AdminLessonSummaryResponse> pageResponse = PageResponse.toPageResponse(lessonPage);
        return BaseResponse.builder()
                .code(200L)
                .message("Success")
                .data(pageResponse)
                .build();
    }

    @GetMapping("/{lessonId}")
    public BaseResponse getLessonDetails(@PathVariable Integer lessonId) {
        AdminLessonDetailResponse lessonDetails = adminLessonService.getLessonDetailsForAdmin(lessonId);
        return BaseResponse.builder()
                .code(200L)
                .message("Success")
                .data(lessonDetails)
                .build();
    }

    @PutMapping("/{lessonId}")
    public BaseResponse updateLesson(
            @PathVariable Integer lessonId,
            @Valid @RequestBody AdminUpdateLessonRequest request
    ) {
        AdminLessonDetailResponse updatedLesson = adminLessonService.updateLessonForAdmin(lessonId, request);
        return BaseResponse.builder()
                .code(200L)
                .message("Lesson updated successfully")
                .data(updatedLesson)
                .build();
    }

    @PutMapping("/{lessonId}/vocabularies")
    public BaseResponse updateLessonVocabularies(
            @PathVariable Integer lessonId,
            @Valid @RequestBody List<com.lmh.web.dto.request.suggest.AdminUpdateSuggestVocabularyRequest> vocabularies
    ) {
        adminLessonService.updateVocabulariesForLesson(lessonId, vocabularies);
        return BaseResponse.builder()
                .code(200L)
                .message("Vocabularies updated successfully")
                .data(null)
                .build();
    }

    @DeleteMapping("/{lessonId}")
    public BaseResponse deleteLesson(@PathVariable Integer lessonId) {
        adminLessonService.deleteLessonForAdmin(lessonId);
        return BaseResponse.builder()
                .code(200L)
                .message("Lesson deleted successfully")
                .data(null)
                .build();
    }

    @PutMapping("/{lessonId}/restore")
    public BaseResponse restoreLesson(@PathVariable Integer lessonId) {
        adminLessonService.restoreLessonForAdmin(lessonId);
        return BaseResponse.builder()
                .code(200L)
                .message("Lesson restored successfully")
                .data(null)
                .build();
    }
}
