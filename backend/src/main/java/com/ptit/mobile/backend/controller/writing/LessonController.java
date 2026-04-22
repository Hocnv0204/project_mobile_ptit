package com.ptit.mobile.backend.controller.writing;

import com.ptit.mobile.backend.dto.request.ai.GradingRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;
import com.ptit.mobile.backend.dto.response.writing.GradingResponse;
import com.ptit.mobile.backend.dto.response.writing.LessonResponse;
import com.ptit.mobile.backend.dto.response.writing.LessonSummaryResponse;
import com.ptit.mobile.backend.service.writing.LessonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/lessons")
@RequiredArgsConstructor
public class LessonController {

    private final LessonService lessonService;

    @GetMapping()
    public BaseResponse getLessons(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) Integer topicId,
            @RequestParam(required = false) Integer levelId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        Page<LessonSummaryResponse> lessonPage = lessonService.getAllLessonsForUser(
                searchTerm, topicId, levelId, page, size, sortBy, sortDir
        );

        return BaseResponse.builder()
                .code(200L)
                .message("Success")
                .data(lessonPage)
                .build();
    }

    @GetMapping("/{lessonId}")
    public BaseResponse getLessonDetails(
            @PathVariable Integer lessonId
    ) {
        LessonResponse lesson = lessonService.getLessonDetails(lessonId);
        return BaseResponse.builder()
                .code(200L)
                .message("Success")
                .data(lesson)
                .build();
    }

    @PostMapping("/grade")
    public BaseResponse gradeAnswer(@Valid @RequestBody GradingRequest request) {
        GradingResponse gradingResponse = lessonService.gradeAnswer(request);
        return BaseResponse.builder()
                .code(200L)
                .message("Answer graded successfully")
                .data(gradingResponse)
                .build();
    }
}
