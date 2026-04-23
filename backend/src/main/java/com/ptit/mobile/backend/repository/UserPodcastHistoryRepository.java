package com.ptit.mobile.backend.repository;

import com.ptit.mobile.backend.model.UserPodcastHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserPodcastHistoryRepository extends JpaRepository<UserPodcastHistory, Long> {

    Optional<UserPodcastHistory> findByUserIdAndPodcastId(Long userId, Integer podcastId);

    List<UserPodcastHistory> findAllByUserIdOrderByListenedAtDesc(Long userId);
}
