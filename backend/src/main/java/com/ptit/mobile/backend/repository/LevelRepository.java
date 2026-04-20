package com.ptit.mobile.backend.repository;

import com.ptit.mobile.backend.model.Level;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LevelRepository extends JpaRepository<Level, Integer> {
    List<Level> findAllByDeleteFlagFalseOrderByIdAsc();

    Optional<Level> findByIdAndDeleteFlagFalse(Integer id);

    boolean existsByNameAndDeleteFlagFalse(String name);
}

