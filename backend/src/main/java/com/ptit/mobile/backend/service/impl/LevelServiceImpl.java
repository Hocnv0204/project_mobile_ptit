package com.ptit.mobile.backend.service.impl;

import com.ptit.mobile.backend.dto.request.level.CreateLevelRequest;
import com.ptit.mobile.backend.dto.request.level.UpdateLevelRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;
import com.ptit.mobile.backend.dto.response.level.LevelResponse;
import com.ptit.mobile.backend.exception.BusinessException;
import com.ptit.mobile.backend.exception.ErrorCode;
import com.ptit.mobile.backend.model.Level;
import com.ptit.mobile.backend.repository.LevelRepository;
import com.ptit.mobile.backend.service.LevelService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LevelServiceImpl implements LevelService {
    private final LevelRepository levelRepository;

    @Override
    public BaseResponse create(CreateLevelRequest request) {
        String name = normalizeName(request.getName());
        if (levelRepository.existsByNameAndDeleteFlagFalse(name)) {
            throw new BusinessException(ErrorCode.LEVEL_NAME_ALREADY_EXISTS);
        }

        LocalDateTime now = LocalDateTime.now();
        Level level = Level.builder()
                .name(name)
                .description(request.getDescription())
                .deleteFlag(false)
                .createdAt(now)
                .updatedAt(now)
                .build();

        levelRepository.save(level);
        return BaseResponse.success(toResponse(level));
    }

    @Override
    public BaseResponse getById(Integer id) {
        Level level = levelRepository.findByIdAndDeleteFlagFalse(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.LEVEL_NOT_FOUND));
        return BaseResponse.success(toResponse(level));
    }

    @Override
    public BaseResponse getAll() {
        List<LevelResponse> levels = levelRepository.findAllByDeleteFlagFalseOrderByIdAsc()
                .stream()
                .map(this::toResponse)
                .toList();
        return BaseResponse.success(levels);
    }

    @Override
    public BaseResponse update(Integer id, UpdateLevelRequest request) {
        Level level = levelRepository.findByIdAndDeleteFlagFalse(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.LEVEL_NOT_FOUND));

        String name = normalizeName(request.getName());
        if (!name.equals(level.getName()) && levelRepository.existsByNameAndDeleteFlagFalse(name)) {
            throw new BusinessException(ErrorCode.LEVEL_NAME_ALREADY_EXISTS);
        }

        level.setName(name);
        level.setDescription(request.getDescription());
        level.setUpdatedAt(LocalDateTime.now());
        levelRepository.save(level);

        return BaseResponse.success(toResponse(level));
    }

    @Override
    public BaseResponse delete(Integer id) {
        Level level = levelRepository.findByIdAndDeleteFlagFalse(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.LEVEL_NOT_FOUND));

        level.setDeleteFlag(true);
        level.setUpdatedAt(LocalDateTime.now());
        levelRepository.save(level);

        return BaseResponse.success("Delete level successfully");
    }

    private LevelResponse toResponse(Level level) {
        return LevelResponse.builder()
                .id(level.getId())
                .name(level.getName())
                .description(level.getDescription())
                .createdAt(level.getCreatedAt())
                .updatedAt(level.getUpdatedAt())
                .build();
    }

    private String normalizeName(String name) {
        if (name == null) return null;
        return name.trim().replaceAll("\\s+", " ");
    }
}

