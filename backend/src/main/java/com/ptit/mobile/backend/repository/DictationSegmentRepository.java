package com.ptit.mobile.backend.repository;

import com.ptit.mobile.backend.model.DictationSegment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DictationSegmentRepository extends JpaRepository<DictationSegment, UUID> {

    List<DictationSegment> findByDictationIdOrderBySequenceOrderAsc(UUID dictationId);

    Optional<DictationSegment> findByDictationIdAndSequenceOrder(UUID dictationId, Integer sequenceOrder);

    void deleteByDictationId(UUID dictationId);
}
