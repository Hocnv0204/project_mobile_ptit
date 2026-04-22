package com.ptit.mobile.backend.service.topic;

import com.ptit.mobile.backend.dto.request.topic.AdminCreateTopicRequest;
import com.ptit.mobile.backend.dto.request.topic.AdminUpdateTopicRequest;
import com.ptit.mobile.backend.dto.response.topic.AdminTopicResponse;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

public interface AdminTopicService {

    Page<AdminTopicResponse> getAllTopicsForAdmin(
            String searchTerm,
            Boolean isDeleted,
            int page,
            int size,
            String sortBy,
            String sortDir
    );

    AdminTopicResponse createTopicForAdmin(AdminCreateTopicRequest request);

    AdminTopicResponse updateTopicForAdmin(Integer topicId, AdminUpdateTopicRequest request);

    void deleteTopicForAdmin(Integer topicId);

    AdminTopicResponse getTopicDetailsForAdmin(Integer topicId);

    void restoreTopicForAdmin(Integer topicId);
}
