package com.ptit.mobile.backend.controller;

import com.ptit.mobile.backend.dto.request.podcast.GeneratePodcastRequest;
import com.ptit.mobile.backend.dto.request.podcast.SaveHistoryRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;
import com.ptit.mobile.backend.exception.BusinessException;
import com.ptit.mobile.backend.exception.ErrorCode;
import com.ptit.mobile.backend.service.PodcastService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/podcasts")
@RequiredArgsConstructor
@Tag(name = "Podcast", description = "Quản lý podcast học tiếng Anh")
public class PodcastController {

    private final PodcastService podcastService;

    @Operation(summary = "Generate podcast từ AI", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping(value = "/generate", produces = "application/json")
    public BaseResponse generate(@RequestBody GeneratePodcastRequest request) {
        return podcastService.generateFromAI(request);
    }

    @Operation(summary = "Danh sách tất cả podcast", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping
    public BaseResponse getAll() {
        return podcastService.getAll();
    }

    @Operation(summary = "Chi tiết podcast (gồm dialogues + vocab)", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/{id}")
    public BaseResponse getById(@PathVariable Integer id) {
        return podcastService.getById(id);
    }

    @Operation(summary = "Podcast theo level", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/level/{levelId}")
    public BaseResponse getByLevel(@PathVariable Integer levelId) {
        return podcastService.getByLevel(levelId);
    }

    @Operation(summary = "Podcast theo topic", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/topic/{topicId}")
    public BaseResponse getByTopic(@PathVariable Integer topicId) {
        return podcastService.getByTopic(topicId);
    }

    @Operation(summary = "Lưu tiến độ nghe podcast", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/history")
    public BaseResponse saveHistory(@RequestBody SaveHistoryRequest request) {
        Long userId = getCurrentUserId();
        return podcastService.saveHistory(userId, request);
    }

    @Operation(summary = "Lịch sử nghe podcast của user", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/history")
    public BaseResponse getHistory() {
        Long userId = getCurrentUserId();
        return podcastService.getHistory(userId);
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getDetails() == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return (Long) auth.getDetails();
    }
}