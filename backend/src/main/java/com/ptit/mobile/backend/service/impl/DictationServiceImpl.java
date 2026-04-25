package com.ptit.mobile.backend.service.impl;

import com.ptit.mobile.backend.dto.request.dictation.SubmitSegmentRequest;
import com.ptit.mobile.backend.dto.request.dictation.SyncProgressRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;
import com.ptit.mobile.backend.dto.response.dictation.*;
import com.ptit.mobile.backend.exception.BusinessException;
import com.ptit.mobile.backend.exception.ErrorCode;
import com.ptit.mobile.backend.model.Dictation;
import com.ptit.mobile.backend.model.DictationSegment;
import com.ptit.mobile.backend.model.UserDictationProgress;
import com.ptit.mobile.backend.repository.DictationRepository;
import com.ptit.mobile.backend.repository.DictationSegmentRepository;
import com.ptit.mobile.backend.repository.UserDictationProgressRepository;
import com.ptit.mobile.backend.security.SecurityUtils;
import com.ptit.mobile.backend.service.DictationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DictationServiceImpl implements DictationService {

    private final DictationRepository dictationRepository;
    private final DictationSegmentRepository segmentRepository;
    private final UserDictationProgressRepository progressRepository;

    // ──────────────────────────────────────────────────────
    // 1. GET /api/dictations — list with user progress
    // ──────────────────────────────────────────────────────
    @Override
    public BaseResponse getAllDictations() {
        Long userId = SecurityUtils.getCurrentUserId();
        List<Dictation> dictations = dictationRepository.findAll();

        // Build a lookup: dictationId → progress
        Map<UUID, UserDictationProgress> progressMap = progressRepository
                .findByUserId(userId)
                .stream()
                .collect(Collectors.toMap(UserDictationProgress::getDictationId, Function.identity()));

        List<DictationResponse> result = dictations.stream().map(d -> {
            UserDictationProgress progress = progressMap.get(d.getId());
            Double progressPercent = null;
            if (progress != null && d.getTotalSegments() != null && d.getTotalSegments() > 0) {
                progressPercent = Math.round(
                        (double) progress.getCompletedSegments() / d.getTotalSegments() * 100.0 * 100.0
                ) / 100.0; // two decimals
            }
            return DictationResponse.builder()
                    .id(d.getId())
                    .title(d.getTitle())
                    .mediaUrl(d.getMediaUrl())
                    .totalSegments(d.getTotalSegments())
                    .progressPercent(progressPercent)
                    .build();
        }).toList();

        return BaseResponse.success(result);
    }

    // ──────────────────────────────────────────────────────
    // 2. GET /api/dictations/{id}/segments
    // ──────────────────────────────────────────────────────
    @Override
    public BaseResponse getSegments(UUID dictationId) {
        // Verify dictation exists
        dictationRepository.findById(dictationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DICTATION_NOT_FOUND));

        List<SegmentResponse> segments = segmentRepository
                .findByDictationIdOrderBySequenceOrderAsc(dictationId)
                .stream()
                .map(seg -> SegmentResponse.builder()
                        .id(seg.getId())
                        .sequenceOrder(seg.getSequenceOrder())
                        .startTime(seg.getStartTime())
                        .endTime(seg.getEndTime())
                        .englishText(seg.getEnglishText())
                        .blankText(seg.getBlankText())
                        .answerKeys(seg.getAnswerKeys())
                        .build())
                .toList();

        return BaseResponse.success(segments);
    }

    // ──────────────────────────────────────────────────────
    // 3. GET /api/user/progress/{dictationId}
    // ──────────────────────────────────────────────────────
    @Override
    public BaseResponse getUserProgress(UUID dictationId) {
        Long userId = SecurityUtils.getCurrentUserId();
        Optional<UserDictationProgress> optProgress = progressRepository
                .findByUserIdAndDictationId(userId, dictationId);

        if (optProgress.isEmpty()) {
            // Return a default response (not started yet)
            return BaseResponse.success(ProgressResponse.builder()
                    .dictationId(dictationId)
                    .currentSequence(1)
                    .completedSegments(0)
                    .status("NOT_STARTED")
                    .progressPercent(0.0)
                    .build());
        }

        UserDictationProgress p = optProgress.get();
        Dictation dictation = dictationRepository.findById(dictationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DICTATION_NOT_FOUND));

        double percent = dictation.getTotalSegments() > 0
                ? Math.round((double) p.getCompletedSegments() / dictation.getTotalSegments() * 100.0 * 100.0) / 100.0
                : 0.0;

        return BaseResponse.success(ProgressResponse.builder()
                .id(p.getId())
                .dictationId(p.getDictationId())
                .currentSequence(p.getCurrentSequence())
                .completedSegments(p.getCompletedSegments())
                .status(p.getStatus())
                .progressPercent(percent)
                .updatedAt(p.getUpdatedAt())
                .build());
    }

    // ──────────────────────────────────────────────────────
    // 4. POST /api/user/progress/sync (UPSERT)
    // ──────────────────────────────────────────────────────
    @Override
    @Transactional
    public BaseResponse syncProgress(SyncProgressRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();

        // Verify dictation exists
        Dictation dictation = dictationRepository.findById(request.getDictationId())
                .orElseThrow(() -> new BusinessException(ErrorCode.DICTATION_NOT_FOUND));

        UserDictationProgress progress = progressRepository
                .findByUserIdAndDictationId(userId, request.getDictationId())
                .orElse(null);

        if (progress == null) {
            // Create new
            progress = UserDictationProgress.builder()
                    .id(UUID.randomUUID())
                    .userId(userId)
                    .dictationId(request.getDictationId())
                    .currentSequence(request.getCurrentSequence())
                    .completedSegments(request.getCompletedSegments())
                    .status("IN_PROGRESS")
                    .updatedAt(LocalDateTime.now())
                    .build();
        } else {
            // Update existing
            progress.setCurrentSequence(request.getCurrentSequence());
            progress.setCompletedSegments(request.getCompletedSegments());
            progress.setUpdatedAt(LocalDateTime.now());

            // Auto-complete if all segments are done
            if (dictation.getTotalSegments() != null
                    && request.getCompletedSegments() >= dictation.getTotalSegments()) {
                progress.setStatus("COMPLETED");
                progress.setCompletedSegments(dictation.getTotalSegments());
            }
        }

        progressRepository.save(progress);

        double percent = dictation.getTotalSegments() > 0
                ? Math.round((double) progress.getCompletedSegments() / dictation.getTotalSegments() * 100.0 * 100.0) / 100.0
                : 0.0;

        return BaseResponse.success(ProgressResponse.builder()
                .id(progress.getId())
                .dictationId(progress.getDictationId())
                .currentSequence(progress.getCurrentSequence())
                .completedSegments(progress.getCompletedSegments())
                .status(progress.getStatus())
                .progressPercent(percent)
                .updatedAt(progress.getUpdatedAt())
                .build());
    }

    // ──────────────────────────────────────────────────────
    // 5. PATCH /api/user/progress/{id}/complete
    // ──────────────────────────────────────────────────────
    @Override
    @Transactional
    public BaseResponse completeProgress(UUID progressId) {
        UserDictationProgress progress = progressRepository.findById(progressId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DICTATION_PROGRESS_NOT_FOUND));

        Dictation dictation = dictationRepository.findById(progress.getDictationId())
                .orElseThrow(() -> new BusinessException(ErrorCode.DICTATION_NOT_FOUND));

        progress.setStatus("COMPLETED");
        progress.setCompletedSegments(dictation.getTotalSegments());
        progress.setUpdatedAt(LocalDateTime.now());
        progressRepository.save(progress);

        return BaseResponse.success(ProgressResponse.builder()
                .id(progress.getId())
                .dictationId(progress.getDictationId())
                .currentSequence(progress.getCurrentSequence())
                .completedSegments(progress.getCompletedSegments())
                .status(progress.getStatus())
                .progressPercent(100.0)
                .updatedAt(progress.getUpdatedAt())
                .build());
    }

    // ──────────────────────────────────────────────────────
    // 6. POST /api/dictations/{id}/submit-segment
    // ──────────────────────────────────────────────────────
    @Override
    public BaseResponse submitSegment(UUID dictationId, SubmitSegmentRequest request) {
        DictationSegment segment = segmentRepository
                .findByDictationIdAndSequenceOrder(dictationId, request.getSequenceOrder())
                .orElseThrow(() -> new BusinessException(ErrorCode.DICTATION_SEGMENT_NOT_FOUND));

        List<String> correctAnswers = segment.getAnswerKeys();
        if (correctAnswers == null) {
            correctAnswers = Collections.emptyList();
        }

        List<String> userInput = request.getUserInput();
        if (userInput == null) {
            userInput = Collections.emptyList();
        }

        // Compare: case-insensitive, trimmed, same length and same order
        boolean isCorrect = correctAnswers.size() == userInput.size();
        if (isCorrect) {
            for (int i = 0; i < correctAnswers.size(); i++) {
                String expected = correctAnswers.get(i).trim().toLowerCase();
                String actual = userInput.get(i).trim().toLowerCase();
                if (!expected.equals(actual)) {
                    isCorrect = false;
                    break;
                }
            }
        }

        return BaseResponse.success(SubmitSegmentResponse.builder()
                .isCorrect(isCorrect)
                .correctAnswers(correctAnswers)
                .build());
    }
}
