package com.ptit.mobile.backend.controller;

import com.ptit.mobile.backend.dto.request.user.UpdateLevelRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;
import com.ptit.mobile.backend.exception.BusinessException;
import com.ptit.mobile.backend.exception.ErrorCode;
import com.ptit.mobile.backend.model.Level;
import com.ptit.mobile.backend.model.User;
import com.ptit.mobile.backend.repository.LevelRepository;
import com.ptit.mobile.backend.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User", description = "Quản lý thông tin người dùng")
public class UserController {

    private final UserRepository userRepository;
    private final LevelRepository levelRepository;

    @Operation(summary = "Cập nhật trình độ (Level) cho user đang đăng nhập", security = @SecurityRequirement(name = "bearerAuth"))
    @PutMapping("/me/level")
    public BaseResponse updateLevel(@Valid @RequestBody UpdateLevelRequest request) {
        Long userId = getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        Level level = levelRepository.findByIdAndDeleteFlagFalse(request.getLevelId().intValue())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        user.setLevelId(request.getLevelId());
        userRepository.save(user);

        return BaseResponse.success("Level updated successfully");
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getDetails() == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return (Long) auth.getDetails();
    }

    @GetMapping("/me/level")
    public BaseResponse getCurrentLevel() {
        Long userId = getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        Integer levelId = Integer.parseInt(user.getLevelId().toString());
        return BaseResponse.success(levelRepository.findById(levelId).orElseThrow().getName());
    }
}
