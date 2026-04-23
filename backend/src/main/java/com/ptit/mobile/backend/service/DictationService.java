package com.ptit.mobile.backend.service;

import com.ptit.mobile.backend.dto.request.dictation.SubmitSegmentRequest;
import com.ptit.mobile.backend.dto.request.dictation.SyncProgressRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;

import java.util.UUID;

public interface DictationService {

    /** List all dictations with user's progress percentage */
    BaseResponse getAllDictations();

    /** Get all segments for a dictation, sorted by sequence_order */
    BaseResponse getSegments(UUID dictationId);

    /** Get current user's progress for a specific dictation */
    BaseResponse getUserProgress(UUID dictationId);

    /** Upsert (create or update) user's progress */
    BaseResponse syncProgress(SyncProgressRequest request);

    /** Mark a dictation progress as COMPLETED */
    BaseResponse completeProgress(UUID progressId);

    /** Submit user answers for a segment and check correctness */
    BaseResponse submitSegment(UUID dictationId, SubmitSegmentRequest request);
}
