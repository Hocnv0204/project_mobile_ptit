package com.ptit.mobile.backend.repository;


import com.ptit.mobile.backend.model.PodcastDialogue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PodcastDialogueRepository extends JpaRepository<PodcastDialogue, Integer> {

    List<PodcastDialogue> findByPodcastIdOrderByOrderIndexAsc(Integer podcastId);
}