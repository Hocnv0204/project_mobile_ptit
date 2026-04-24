package com.ptit.mobile.backend.repository;

import com.ptit.mobile.backend.model.Dictation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface DictationRepository extends JpaRepository<Dictation, UUID> {
}
