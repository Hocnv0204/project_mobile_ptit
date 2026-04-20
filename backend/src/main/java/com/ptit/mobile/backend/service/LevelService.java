package com.ptit.mobile.backend.service;

import com.ptit.mobile.backend.dto.request.level.CreateLevelRequest;
import com.ptit.mobile.backend.dto.request.level.UpdateLevelRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;

public interface LevelService {
    BaseResponse create(CreateLevelRequest request);

    BaseResponse getById(Integer id);

    BaseResponse getAll();

    BaseResponse update(Integer id, UpdateLevelRequest request);

    BaseResponse delete(Integer id);
}

