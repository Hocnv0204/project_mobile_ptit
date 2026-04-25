package com.ptit.mobile.backend.service.topic.impl;

import com.ptit.mobile.backend.dto.response.topic.TopicResponse;
import com.ptit.mobile.backend.mapper.topic.TopicMapper;
import com.ptit.mobile.backend.model.Topic;
import com.ptit.mobile.backend.repository.topic.TopicRepository;
import com.ptit.mobile.backend.service.topic.TopicService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TopicServiceImpl implements TopicService {

    private final TopicRepository topicRepository;
    private final TopicMapper topicMapper;

    @Override
    public Page<TopicResponse> getTopics(
            String searchTerm,
            int page, int size, String sortBy, String sortDir) {

        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Specification<Topic> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Luôn lấy các topic chưa bị xóa
            predicates.add(cb.equal(root.get("deleteFlag"), false));

            if (searchTerm != null && !searchTerm.isBlank()) {
                String likePattern = "%" + searchTerm.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), likePattern),
                        cb.like(cb.lower(root.get("description")), likePattern)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Topic> topicPage = topicRepository.findAll(spec, pageable);
        return topicPage.map(topicMapper::toResponse);
    }
}
