package com.ptit.mobile.backend.controller.writing;

import com.ptit.mobile.backend.dto.request.writing.GradingRequest;
import com.ptit.mobile.backend.dto.request.writing.UpdateProgressRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;
import com.ptit.mobile.backend.dto.response.writing.GradingResponse;
import com.ptit.mobile.backend.dto.response.writing.LessonResponse;
import com.ptit.mobile.backend.dto.response.writing.LessonSummaryResponse;
import com.ptit.mobile.backend.dto.response.writing.UserLessonProgressResponse;
import com.ptit.mobile.backend.service.writing.LessonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/lesson-writings")
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

    @GetMapping("/my-lessons")
    public BaseResponse getMyLessons(
            Authentication authentication
    ) {
        Long userId = (Long) authentication.getDetails();
        List<UserLessonPr ogressResponse> myLessons = lessonService.getMyLessonsProgress(userId);

        return BaseResponse.builder()
                .code(200L)
                .message("Success")
                .data(myLessons)
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
    public BaseResponse gradeAnswer(
            @Valid @RequestBody GradingRequest request,
            Authentication authentication
    ) {
        Long userId = (Long) authentication.getDetails();
        GradingResponse gradingResponse = lessonService.gradeAnswer(request, userId);
        return BaseResponse.builder()
                .code(200L)
                .message("Answer graded successfully")
                .data(gradingResponse)
                .build();
    }

    @GetMapping("/progress/{lessonId}")
    public BaseResponse getLessonProgress(
            @PathVariable Integer lessonId,
            Authentication authentication
    ) {
        Long userId = (Long) authentication.getDetails();

        UserLessonProgressResponse progress = lessonService.getLessonProgress(userId, lessonId);
        return BaseResponse.builder()
                .code(200L)
                .message("Success")
                .data(progress)
                .build();
    }

    @PutMapping("/progress")
    public BaseResponse updateLessonProgress(
            @Valid @RequestBody UpdateProgressRequest request,
            Authentication authentication
    ) {
        Long userId = (Long) authentication.getDetails();
        lessonService.updateLessonProgress(request, userId);
        return BaseResponse.builder()
                .code(200L)
                .message("Lesson progress updated successfully")
                .build();
    }
}
