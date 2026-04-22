package com.ptit.mobile.backend.service.topic;

import com.ptit.mobile.backend.dto.response.topic.TopicResponse;
import com.ptit.mobile.backend.model.Topic;
import org.springframework.data.domain.Page;

public interface TopicService {
    Page<TopicResponse> getTopics(
            String searchTerm,
            int page, int size, String sortBy, String sortDir
    );
}
