package com.ptit.mobile.backend.controller.writing;


import com.ptit.mobile.backend.dto.request.writing.*;
import com.ptit.mobile.backend.dto.response.BaseResponse;
import com.ptit.mobile.backend.dto.response.PageResponse;
import com.ptit.mobile.backend.dto.response.writing.AdminLessonDetailResponse;
import com.ptit.mobile.backend.dto.response.writing.AdminLessonSummaryResponse;
import com.ptit.mobile.backend.dto.response.writing.LessonSentenceResponse;
import com.ptit.mobile.backend.service.writing.impl.AdminLessonServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("api/admin/lessons")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminLessonController {

    private final AdminLessonServiceImpl adminLessonService;

    // ==================== Lesson CRUD ====================

    @PostMapping("/generate-with-ai")
    public BaseResponse createLessonWithAi(
            @Valid @RequestBody AdminCreateLessonRequest request,
            Authentication authentication
    ) {
        AdminLessonDetailResponse response = adminLessonService.requestLessonGeneration(request);
        return BaseResponse.builder()
                .code(200L)
                .message("Lesson generated successfully")
                .data(response)
                .build();
    }

    @PostMapping("/create-manual")
    public BaseResponse createManualLesson(
            @Valid @RequestBody ManualCreateLessonRequest request
    ) {
        AdminLessonDetailResponse response = adminLessonService.createManualLesson(request);
        return BaseResponse.builder()
                .code(200L)
                .message("Manual lesson created successfully")
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
            @Valid @RequestBody List<AdminUpdateSuggestVocabularyRequest> vocabularies
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

    // ==================== Sentence Management ====================

    @GetMapping("/{lessonId}/sentences")
    public BaseResponse getSentences(@PathVariable Integer lessonId) {
        List<LessonSentenceResponse> sentences = adminLessonService.getSentencesByLesson(lessonId);
        return BaseResponse.builder()
                .code(200L)
                .message("Success")
                .data(sentences)
                .build();
    }

    @PostMapping("/sentences")
    public BaseResponse createSentence(@Valid @RequestBody AdminCreateSentenceRequest request) {
        LessonSentenceResponse sentence = adminLessonService.createSentence(request);
        return BaseResponse.builder()
                .code(200L)
                .message("Sentence created successfully")
                .data(sentence)
                .build();
    }

    @PutMapping("/sentences/{sentenceId}")
    public BaseResponse updateSentence(
            @PathVariable Integer sentenceId,
            @RequestBody AdminUpdateSentenceRequest request
    ) {
        LessonSentenceResponse sentence = adminLessonService.updateSentence(sentenceId, request);
        return BaseResponse.builder()
                .code(200L)
                .message("Sentence updated successfully")
                .data(sentence)
                .build();
    }

    @DeleteMapping("/sentences/{sentenceId}")
    public BaseResponse deleteSentence(@PathVariable Integer sentenceId) {
        adminLessonService.deleteSentence(sentenceId);
        return BaseResponse.builder()
                .code(200L)
                .message("Sentence deleted successfully")
                .data(null)
                .build();
    }
}
