package com.ptit.mobile.backend.repository.writing;

import com.ptit.mobile.backend.model.LessonWriting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LessonWritingRepository extends JpaRepository<LessonWriting, Integer>, JpaSpecificationExecutor<LessonWriting> {

    Optional<LessonWriting> findByName(String name);

    boolean existsByName(String name);
}
