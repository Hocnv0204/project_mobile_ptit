package com.ptit.mobile.backend.service;

import com.ptit.mobile.backend.dto.request.podcast.GeneratePodcastRequest;
import com.ptit.mobile.backend.dto.request.podcast.SaveHistoryRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;

public interface PodcastService {

    BaseResponse generateFromAI(GeneratePodcastRequest request);

    BaseResponse getAll();

    BaseResponse getById(Integer id);

    BaseResponse getByLevel(Integer levelId);

    BaseResponse getByTopic(Integer topicId);

    BaseResponse saveHistory(Long userId, SaveHistoryRequest request);

    BaseResponse getHistory(Long userId);
}