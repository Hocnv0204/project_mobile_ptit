package com.ptit.mobile.backend.repository;

import com.ptit.mobile.backend.model.Topic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TopicRepository extends JpaRepository<Topic, Integer>, JpaSpecificationExecutor<Topic> {
    boolean existsByName(String name);
    Optional<Topic> findByName(String name);
}
