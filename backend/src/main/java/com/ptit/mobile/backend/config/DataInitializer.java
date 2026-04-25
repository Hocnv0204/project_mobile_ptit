package com.ptit.mobile.backend.config;

import com.ptit.mobile.backend.model.Role;
import com.ptit.mobile.backend.model.User;
import com.ptit.mobile.backend.model.UserCredential;
import com.ptit.mobile.backend.model.UserRole;
import com.ptit.mobile.backend.repository.RoleRepository;
import com.ptit.mobile.backend.repository.UserCredentialRepository;
import com.ptit.mobile.backend.repository.UserRepository;
import com.ptit.mobile.backend.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Khởi tạo dữ liệu mặc định khi ứng dụng start lần đầu.
 *
 * <p>Tạo:
 * <ul>
 *   <li>Roles: ROLE_USER, ROLE_ADMIN (nếu chưa có)</li>
 *   <li>User mặc định: username=admin, password=admin (ROLE_USER + ROLE_ADMIN)</li>
 * </ul>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private static final String ADMIN_USERNAME = "admin";
    private static final String ADMIN_PASSWORD = "admin";
    private static final String ADMIN_EMAIL    = "admin@ptit.edu.vn";
    private static final String ADMIN_FULLNAME = "Administrator";

    private final UserRepository           userRepository;
    private final UserCredentialRepository userCredentialRepository;
    private final UserRoleRepository       userRoleRepository;
    private final RoleRepository           roleRepository;
    private final PasswordEncoder          passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedRoles();
        seedAdminUser();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Seed Roles
    // ─────────────────────────────────────────────────────────────────────────

    private void seedRoles() {
        seedRoleIfAbsent("ROLE_USER",  "Standard user role");
        seedRoleIfAbsent("ROLE_ADMIN", "Administrator role");
    }

    private void seedRoleIfAbsent(String name, String description) {
        if (roleRepository.findByName(name).isEmpty()) {
            Role role = Role.builder().name(name).description(description).build();
            roleRepository.save(role);
            log.info("Seeded role: {}", name);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Seed Admin User
    // ─────────────────────────────────────────────────────────────────────────

    private void seedAdminUser() {
        // Bỏ qua nếu user admin đã tồn tại
        if (userRepository.existsByUsername(ADMIN_USERNAME)) {
            log.info("Admin user already exists — skipping seed.");
            return;
        }

        // 1. Tạo User
        User admin = User.builder()
                .email(ADMIN_EMAIL)
                .username(ADMIN_USERNAME)
                .fullName(ADMIN_FULLNAME)
                .isActive(true)
                .isEmailVerified(true)
                .deleteFlag(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        admin = userRepository.save(admin);
        final Long adminId = admin.getId();

        // 2. Lưu hashed password
        UserCredential credential = UserCredential.builder()
                .userId(adminId)
                .passwordHash(passwordEncoder.encode(ADMIN_PASSWORD))
                .updatedAt(LocalDateTime.now())
                .build();
        userCredentialRepository.save(credential);

        // 3. Assign ROLE_USER và ROLE_ADMIN
        List<String> roleNames = List.of("ROLE_USER", "ROLE_ADMIN");
        for (String roleName : roleNames) {
            roleRepository.findByName(roleName).ifPresent(role -> {
                UserRole userRole = UserRole.builder()
                        .userId(adminId)
                        .roleId(role.getId())
                        .build();
                userRoleRepository.save(userRole);
            });
        }

        log.info("✅ Default admin user created: username='{}', email='{}' with roles {}",
                ADMIN_USERNAME, ADMIN_EMAIL, roleNames);
    }
}
