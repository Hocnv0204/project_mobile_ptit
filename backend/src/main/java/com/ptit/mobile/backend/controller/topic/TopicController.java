package com.ptit.mobile.backend.controller.topic;

import com.ptit.mobile.backend.dto.response.BaseResponse;
import com.ptit.mobile.backend.dto.response.PageResponse;
import com.ptit.mobile.backend.dto.response.topic.TopicResponse;
import com.ptit.mobile.backend.service.topic.TopicService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RestController
@RequestMapping("/topics")
@Validated
public class TopicController {

    private final TopicService topicService;

        @GetMapping()
        public BaseResponse getTopics(
                @RequestParam(required = false) String searchTerm,
                @RequestParam(defaultValue = "0") int page,
                @RequestParam(defaultValue = "10") int size,
                @RequestParam(defaultValue = "createdAt") String sortBy,
                @RequestParam(defaultValue = "DESC") String sortDir
        ) {
            Page<TopicResponse> topicPage = topicService.getTopics(
                    searchTerm, page, size, sortBy, sortDir
            );

            return BaseResponse.success(PageResponse.toPageResponse(topicPage));
        }
}
