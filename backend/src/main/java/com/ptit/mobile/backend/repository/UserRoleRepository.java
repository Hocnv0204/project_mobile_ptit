package com.ptit.mobile.backend.repository;

import com.ptit.mobile.backend.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserRoleRepository extends JpaRepository<UserRole, Long> {

    List<UserRole> findAllByUserId(Long userId);

    void deleteAllByUserId(Long userId);
}
