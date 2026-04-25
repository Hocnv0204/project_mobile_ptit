package com.ptit.mobile.backend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ptit.mobile.backend.dto.request.podcast.GeneratePodcastRequest;
import com.ptit.mobile.backend.dto.request.podcast.SaveHistoryRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;
import com.ptit.mobile.backend.dto.response.podcast.AIPodcastResponse;
import com.ptit.mobile.backend.dto.response.podcast.PodcastDetailResponse;
import com.ptit.mobile.backend.dto.response.podcast.PodcastResponse;
import com.ptit.mobile.backend.exception.BusinessException;
import com.ptit.mobile.backend.exception.ErrorCode;
import com.ptit.mobile.backend.model.*;
import com.ptit.mobile.backend.repository.*;
import com.ptit.mobile.backend.repository.topic.TopicRepository;
import com.ptit.mobile.backend.service.AudioStorageService;
import com.ptit.mobile.backend.service.OpenAIService;
import com.ptit.mobile.backend.service.PodcastService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PodcastServiceImpl implements PodcastService {

    private final PodcastRepository podcastRepo;
    private final PodcastDialogueRepository dialogueRepo;
    private final PodcastVocabRepository vocabRepo;
    private final UserPodcastHistoryRepository historyRepo;
    private final LevelRepository levelRepo;
    private final TopicRepository topicRepo;
    private final OpenAIService openAIService;
    private final AudioStorageService audioStorageService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public BaseResponse generateFromAI(GeneratePodcastRequest request) {
        try {
            Level level = levelRepo.findByIdAndDeleteFlagFalse(request.getLevelId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.LEVEL_NOT_FOUND));
            Topic topic = topicRepo.findById(request.getTopicId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.TOPIC_NOT_FOUND));

            String content = openAIService.callAI(topic.getName(), level.getName());
            content = content.replace("```json", "").replace("```", "").trim();

            AIPodcastResponse data = objectMapper.readValue(content, AIPodcastResponse.class);

            StringBuilder script = new StringBuilder();
            if (data.getDialogues() != null) {
                for (var d : data.getDialogues()) {
                    script.append(d.getContent()).append(" ");
                }
            }

            String audioUrl = "demo.mp3";
            try {
                if (!script.isEmpty()) {
                    byte[] audioBytes = openAIService.generateSpeech(script.toString().trim(), "nova");
                    audioUrl = audioStorageService.saveAudio(audioBytes);
                }
            } catch (Exception e) {
                System.err.println("TTS Error details:");
                e.printStackTrace();
            }

            int wordCount = script.toString().split("\\s+").length;
            int duration = Math.max(60, wordCount * 60 / 130); // Giả định tốc độ đọc 130 từ/phút
            long count = podcastRepo.count();

            Podcast podcast = Podcast.builder()
                    .title(data.getTitle())
                    .description(data.getDescription())
                    .audioUrl(audioUrl)
                    .thumbnailUrl("https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=500")
                    .levelId(request.getLevelId())
                    .topicId(request.getTopicId())
                    .duration(duration)
                    .orderIndex((int) count + 1)
                    .deleteFlag(false)
                    .build();
            podcast = podcastRepo.save(podcast);

            int i = 1;
            int currentTimestamp = 0;
            for (var d : data.getDialogues()) {
                PodcastDialogue dialogue = PodcastDialogue.builder()
                        .podcastId(podcast.getId())
                        .speaker(d.getSpeaker())
                        .content(d.getContent())
                        .orderIndex(i++)
                        .timestampStart(currentTimestamp)
                        .build();
                dialogueRepo.save(dialogue);
                
                int words = d.getContent().split("\\s+").length;
                currentTimestamp += Math.max(2, words * 60 / 130);
            }

            int j = 1;
            for (var v : data.getVocab()) {
                PodcastVocab vocab = PodcastVocab.builder()
                        .podcastId(podcast.getId())
                        .term(v.getTerm())
                        .definition(v.getDefinition())
                        .example(v.getExample())
                        .pronunciation(v.getPronunciation())
                        .wordType(v.getWordType())
                        .vocabType(v.getVocabType())
                        .orderIndex(j++)
                        .build();
                vocabRepo.save(vocab);
            }

            return BaseResponse.success(toDetailResponse(podcast,
                    dialogueRepo.findByPodcastIdOrderByOrderIndexAsc(podcast.getId()),
                    vocabRepo.findByPodcastIdOrderByOrderIndexAsc(podcast.getId())));

        } catch (Exception e) {
            throw new BusinessException(ErrorCode.PODCAST_GENERATE_FAILED);
        }
    }

    @Override
    public BaseResponse getAll() {
        List<PodcastResponse> podcasts = podcastRepo.findAllByDeleteFlagFalseOrderByOrderIndexAsc()
                .stream()
                .map(this::toResponse)
                .toList();
        return BaseResponse.success(podcasts);
    }

    @Override
    public BaseResponse getById(Integer id) {
        Podcast podcast = podcastRepo.findByIdAndDeleteFlagFalse(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PODCAST_NOT_FOUND));

        List<PodcastDialogue> dialogues = dialogueRepo.findByPodcastIdOrderByOrderIndexAsc(id);
        List<PodcastVocab> vocabs = vocabRepo.findByPodcastIdOrderByOrderIndexAsc(id);

        return BaseResponse.success(toDetailResponse(podcast, dialogues, vocabs));
    }

    @Override
    public BaseResponse getByLevel(Integer levelId) {
        List<PodcastResponse> podcasts = podcastRepo.findAllByLevelIdAndDeleteFlagFalseOrderByOrderIndexAsc(levelId)
                .stream()
                .map(this::toResponse)
                .toList();
        return BaseResponse.success(podcasts);
    }

    @Override
    public BaseResponse getByTopic(Integer topicId) {
        List<PodcastResponse> podcasts = podcastRepo.findAllByTopicIdAndDeleteFlagFalseOrderByOrderIndexAsc(topicId)
                .stream()
                .map(this::toResponse)
                .toList();
        return BaseResponse.success(podcasts);
    }

    @Override
    @Transactional
    public BaseResponse saveHistory(Long userId, SaveHistoryRequest request) {
        Podcast podcast = podcastRepo.findByIdAndDeleteFlagFalse(request.getPodcastId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PODCAST_NOT_FOUND));

        UserPodcastHistory history = historyRepo
                .findByUserIdAndPodcastId(userId, request.getPodcastId())
                .orElse(UserPodcastHistory.builder()
                        .userId(userId)
                        .podcastId(request.getPodcastId())
                        .build());

        history.setProgressSeconds(request.getProgressSeconds());
        history.setIsCompleted(request.getIsCompleted() != null ? request.getIsCompleted() : false);
        history.setListenedAt(LocalDateTime.now());

        historyRepo.save(history);
        return BaseResponse.success("History saved successfully");
    }

    @Override
    public BaseResponse getHistory(Long userId) {
        List<UserPodcastHistory> histories = historyRepo.findAllByUserIdOrderByListenedAtDesc(userId);
        return BaseResponse.success(histories);
    }

    // ── Mapping helpers ─────────────────────────────────────

    private PodcastResponse toResponse(Podcast p) {
        return PodcastResponse.builder()
                .id(p.getId())
                .title(p.getTitle())
                .description(p.getDescription())
                .audioUrl(p.getAudioUrl())
                .thumbnailUrl(p.getThumbnailUrl())
                .levelId(p.getLevelId())
                .topicId(p.getTopicId())
                .duration(p.getDuration())
                .orderIndex(p.getOrderIndex())
                .createdAt(p.getCreatedAt())
                .build();
    }

    private PodcastDetailResponse toDetailResponse(Podcast p,
                                                   List<PodcastDialogue> dialogues,
                                                   List<PodcastVocab> vocabs) {
        List<PodcastDetailResponse.DialogueItem> dialogueItems = dialogues.stream()
                .map(d -> PodcastDetailResponse.DialogueItem.builder()
                        .id(d.getId())
                        .speaker(d.getSpeaker())
                        .content(d.getContent())
                        .orderIndex(d.getOrderIndex())
                        .timestampStart(d.getTimestampStart())
                        .build())
                .toList();

        List<PodcastDetailResponse.VocabItem> vocabItems = vocabs.stream()
                .map(v -> PodcastDetailResponse.VocabItem.builder()
                        .id(v.getId())
                        .term(v.getTerm())
                        .definition(v.getDefinition())
                        .pronunciation(v.getPronunciation())
                        .example(v.getExample())
                        .wordType(v.getWordType())
                        .vocabType(v.getVocabType())
                        .orderIndex(v.getOrderIndex())
                        .build())
                .toList();

        return PodcastDetailResponse.builder()
                .id(p.getId())
                .title(p.getTitle())
                .description(p.getDescription())
                .audioUrl(p.getAudioUrl())
                .thumbnailUrl(p.getThumbnailUrl())
                .levelId(p.getLevelId())
                .topicId(p.getTopicId())
                .duration(p.getDuration())
                .orderIndex(p.getOrderIndex())
                .createdAt(p.getCreatedAt())
                .dialogues(dialogueItems)
                .vocab(vocabItems)
                .build();
    }
}
