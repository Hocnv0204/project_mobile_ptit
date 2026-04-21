package com.ptit.mobile.backend.controller;

import com.ptit.mobile.backend.dto.request.lessonvocab.CreateLessonVocabRequest;
import com.ptit.mobile.backend.dto.request.lessonvocab.CreateLessonVocabSimpleRequest;
import com.ptit.mobile.backend.dto.request.lessonvocab.UpdateLessonVocabRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;
import com.ptit.mobile.backend.repository.VocabularyRepository;
import com.ptit.mobile.backend.service.LessonVocabService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/lesson-vocab")
@RequiredArgsConstructor
@Tag(name = "Lesson Vocab", description = "CRUD lesson từ vựng theo level")
public class LessonVocabController {
    private final LessonVocabService lessonVocabService;
    private final VocabularyRepository vocabularyRepository;

    @Operation(summary = "Tạo lesson vocab", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping
    public BaseResponse create(@Valid @RequestBody CreateLessonVocabRequest request) {
        return lessonVocabService.create(request);
    }

    @Operation(summary = "Tạo lesson vocab (không cần levelId)", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/simple")
    public BaseResponse createSimple(@Valid @RequestBody CreateLessonVocabSimpleRequest request) {
        return lessonVocabService.createSimple(request);
    }

    @Operation(summary = "Danh sách lesson vocab", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping
    public BaseResponse getAll() {
        return lessonVocabService.getAll();
    }

    @Operation(summary = "Chi tiết lesson vocab", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/{id}")
    public BaseResponse getById(@PathVariable Integer id) {
        return lessonVocabService.getById(id);
    }

    @Operation(summary = "Cập nhật lesson vocab", security = @SecurityRequirement(name = "bearerAuth"))
    @PutMapping("/{id}")
    public BaseResponse update(@PathVariable Integer id, @Valid @RequestBody UpdateLessonVocabRequest request) {
        return lessonVocabService.update(id, request);
    }

    @Operation(summary = "Xoá lesson vocab (soft delete)", security = @SecurityRequirement(name = "bearerAuth"))
    @DeleteMapping("/{id}")
    public BaseResponse delete(@PathVariable Integer id) {
        return lessonVocabService.delete(id);
    }

    @Operation(summary = "Danh sách vocabulary theo lesson", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/{id}/vocabularies")
    public BaseResponse getVocabularies(@PathVariable("id") Long lessonVocabId) {
        return BaseResponse.success(vocabularyRepository.findAllByLessonVocabIdOrderByIdAsc(lessonVocabId));
    }

    @Operation(summary = "Danh sách lesson vocab theo userId (bài cá nhân)", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/user/{userId}")
    public BaseResponse getByUserId(@PathVariable("userId") Long userId) {
        return lessonVocabService.getByUserId(userId);
    }
}
