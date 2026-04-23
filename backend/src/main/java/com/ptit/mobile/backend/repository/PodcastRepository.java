package com.ptit.mobile.backend.repository;

import com.ptit.mobile.backend.model.Podcast;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PodcastRepository extends JpaRepository<Podcast, Integer> {

    List<Podcast> findAllByDeleteFlagFalseOrderByOrderIndexAsc();

    Optional<Podcast> findByIdAndDeleteFlagFalse(Integer id);

    List<Podcast> findAllByLevelIdAndDeleteFlagFalseOrderByOrderIndexAsc(Integer levelId);

    List<Podcast> findAllByTopicIdAndDeleteFlagFalseOrderByOrderIndexAsc(Integer topicId);
}
