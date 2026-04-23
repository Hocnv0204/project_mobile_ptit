package com.ptit.mobile.backend.repository;


import com.ptit.mobile.backend.model.PodcastVocab;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PodcastVocabRepository extends JpaRepository<PodcastVocab, Integer> {

    List<PodcastVocab> findByPodcastIdOrderByOrderIndexAsc(Integer podcastId);
}