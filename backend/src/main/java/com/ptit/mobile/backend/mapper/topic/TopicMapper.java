package com.ptit.mobile.backend.mapper.topic;

import com.ptit.mobile.backend.dto.request.topic.AdminCreateTopicRequest;
import com.ptit.mobile.backend.dto.response.topic.AdminTopicResponse;
import com.ptit.mobile.backend.dto.response.topic.TopicResponse;
import com.ptit.mobile.backend.model.Topic;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface TopicMapper {
    TopicResponse toResponse(Topic topic);

    List<TopicResponse> toResponseList(List<Topic> topics);

    AdminTopicResponse toAdminResponse(Topic topic);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "deleteFlag", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    Topic toAdminEntity(AdminCreateTopicRequest request);
}
