package com.ptit.mobile.backend.controller.topic;

import com.ptit.mobile.backend.dto.request.topic.AdminCreateTopicRequest;
import com.ptit.mobile.backend.dto.request.topic.AdminUpdateTopicRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;
import com.ptit.mobile.backend.dto.response.PageResponse;
import com.ptit.mobile.backend.dto.response.topic.AdminTopicResponse;
import com.ptit.mobile.backend.service.topic.AdminTopicService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/admin/topics")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminTopicController {
    private final AdminTopicService adminTopicService;

    @GetMapping
    public BaseResponse getAllTopics(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) Boolean isDeleted,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        Page<AdminTopicResponse> topicPage = adminTopicService.getAllTopicsForAdmin(
                searchTerm, isDeleted, page, size, sortBy, sortDir
        );
        return BaseResponse.success(PageResponse.toPageResponse(topicPage));
    }

    @GetMapping("/{topicId}")
    public BaseResponse getTopicDetails(@PathVariable Integer topicId) {
        AdminTopicResponse topicDetails = adminTopicService.getTopicDetailsForAdmin(topicId);
        return BaseResponse.success(topicDetails);
    }

    @PostMapping
    public BaseResponse createTopic(@Valid @RequestBody AdminCreateTopicRequest request) {
        AdminTopicResponse newTopic = adminTopicService.createTopicForAdmin(request);
        return BaseResponse.builder()
                .code(200L)
                .message("Tạo topic thành công")
                .data(newTopic)
                .build();
    }

    @PutMapping("/{topicId}")
    public BaseResponse updateTopic(
            @PathVariable Integer topicId,
            @Valid @RequestBody AdminUpdateTopicRequest request
    ) {
        AdminTopicResponse updatedTopic = adminTopicService.updateTopicForAdmin(topicId, request);
        return BaseResponse.builder()
                .code(200L)
                .message("Cập nhật topic thành công")
                .data(updatedTopic)
                .build();
    }

    @DeleteMapping("/{topicId}")
    public BaseResponse deleteTopic(@PathVariable Integer topicId) {
        adminTopicService.deleteTopicForAdmin(topicId);
        return BaseResponse.success("Xóa topic thành công");
    }

    @PostMapping("/{topicId}/restore")
    public BaseResponse restoreTopic(@PathVariable Integer topicId) {
        adminTopicService.restoreTopicForAdmin(topicId);
        return BaseResponse.success("Khôi phục topic thành công");
    }
}
