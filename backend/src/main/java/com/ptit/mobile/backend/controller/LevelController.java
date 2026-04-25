package com.ptit.mobile.backend.controller;

import com.ptit.mobile.backend.dto.request.level.CreateLevelRequest;
import com.ptit.mobile.backend.dto.request.level.UpdateLevelRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;
import com.ptit.mobile.backend.service.LevelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/levels")
@RequiredArgsConstructor
@Tag(name = "Level", description = "CRUD level tiếng Anh")
public class LevelController {
    private final LevelService levelService;

    @Operation(summary = "Tạo level", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping
    public BaseResponse create(@Valid @RequestBody CreateLevelRequest request) {
        return levelService.create(request);
    }

    @Operation(summary = "Danh sách level", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping
    public BaseResponse getAll() {
        return levelService.getAll();
    }

    @Operation(summary = "Chi tiết level", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/{id}")
    public BaseResponse getById(@PathVariable Integer id) {
        return levelService.getById(id);
    }

    @Operation(summary = "Cập nhật level", security = @SecurityRequirement(name = "bearerAuth"))
    @PutMapping("/{id}")
    public BaseResponse update(@PathVariable Integer id, @Valid @RequestBody UpdateLevelRequest request) {
        return levelService.update(id, request);
    }

    @Operation(summary = "Xoá level (soft delete)", security = @SecurityRequirement(name = "bearerAuth"))
    @DeleteMapping("/{id}")
    public BaseResponse delete(@PathVariable Integer id) {
        return levelService.delete(id);
    }
}

