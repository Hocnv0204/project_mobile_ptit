package com.ptit.mobile.backend.repository;

import com.ptit.mobile.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Integer> {
}
