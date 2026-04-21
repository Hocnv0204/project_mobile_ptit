package com.ptit.mobile.backend.service.impl;

import com.ptit.mobile.backend.dto.request.quiz.CheckAnswerRequest;
import com.ptit.mobile.backend.dto.response.BaseResponse;
import com.ptit.mobile.backend.dto.response.quiz.FillBlankQuestionResponse;
import com.ptit.mobile.backend.dto.response.quiz.FillBlankSessionResponse;
import com.ptit.mobile.backend.dto.response.quiz.QuizCheckResponse;
import com.ptit.mobile.backend.dto.response.quiz.QuizQuestionResponse;
import com.ptit.mobile.backend.dto.response.quiz.QuizSessionResponse;
import com.ptit.mobile.backend.exception.BusinessException;
import com.ptit.mobile.backend.exception.ErrorCode;
import com.ptit.mobile.backend.model.Vocabulary;
import com.ptit.mobile.backend.repository.VocabularyRepository;
import com.ptit.mobile.backend.service.GeminiService;
import com.ptit.mobile.backend.service.QuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizServiceImpl implements QuizService {

    private static final int MIN_VOCAB_COUNT = 4;
    private static final Set<String> VALID_MODES = Set.of("EN_TO_VI", "VI_TO_EN", "MIXED");

    private final VocabularyRepository vocabularyRepository;
    private final GeminiService geminiService;
    private final Random random = new Random();

    @Override
    public BaseResponse generateSession(Long lessonVocabId, String mode) {
        // Validate mode
        String upperMode = mode != null ? mode.toUpperCase() : "";
        if (!VALID_MODES.contains(upperMode)) {
            throw new BusinessException(ErrorCode.QUIZ_INVALID_MODE);
        }

        // Lấy toàn bộ vocab của bài
        List<Vocabulary> allVocabs = vocabularyRepository.findAllByLessonVocabIdOrderByIdAsc(lessonVocabId);
        if (allVocabs.size() < MIN_VOCAB_COUNT) {
            throw new BusinessException(ErrorCode.QUIZ_NOT_ENOUGH_VOCAB);
        }

        // Shuffle thứ tự câu hỏi
        List<Vocabulary> shuffled = new ArrayList<>(allVocabs);
        Collections.shuffle(shuffled);

        List<QuizQuestionResponse> questions = new ArrayList<>();
        int total = shuffled.size();

        for (int i = 0; i < total; i++) {
            Vocabulary vocab = shuffled.get(i);

            // Chọn mode cho câu này (nếu MIXED thì random EN_TO_VI / VI_TO_EN)
            String questionMode = upperMode.equals("MIXED")
                    ? (random.nextBoolean() ? "EN_TO_VI" : "VI_TO_EN")
                    : upperMode;

            // Sinh question text và correct answer
            String question;
            String correctAnswer;
            if ("EN_TO_VI".equals(questionMode)) {
                question = vocab.getTerm();
                correctAnswer = vocab.getVi();
            } else {
                question = vocab.getVi();
                correctAnswer = vocab.getTerm();
            }

            // Sinh 3 đáp án sai từ các vocab khác trong bài
            List<String> distractors = buildDistractors(allVocabs, vocab, questionMode, 3);

            // Gộp 4 options rồi shuffle
            List<String> options = new ArrayList<>(distractors);
            options.add(correctAnswer);
            Collections.shuffle(options);

            questions.add(QuizQuestionResponse.builder()
                    .questionIndex(i)
                    .total(total)
                    .vocabularyId(vocab.getId())
                    .mode(questionMode)
                    .question(question)
                    .options(options)
                    .build());
        }

        QuizSessionResponse session = QuizSessionResponse.builder()
                .lessonVocabId(lessonVocabId)
                .mode(upperMode)
                .questions(questions)
                .build();

        return BaseResponse.success(session);
    }

    @Override
    public BaseResponse checkAnswer(CheckAnswerRequest request) {
        // Tìm vocab
        Vocabulary vocab = vocabularyRepository.findById(request.getVocabularyId())
                .orElseThrow(() -> new BusinessException(ErrorCode.QUIZ_VOCAB_NOT_FOUND));

        // Validate mode
        String upperMode = request.getMode() != null ? request.getMode().toUpperCase() : "";
        if (!Set.of("EN_TO_VI", "VI_TO_EN").contains(upperMode)) {
            throw new BusinessException(ErrorCode.QUIZ_INVALID_MODE);
        }

        // Xác định đáp án đúng
        String correctAnswer = "EN_TO_VI".equals(upperMode)
                ? vocab.getVi()
                : vocab.getTerm();

        // So sánh không phân biệt hoa thường, bỏ khoảng trắng thừa
        boolean correct = correctAnswer != null
                && correctAnswer.trim().equalsIgnoreCase(
                        request.getAnswer() != null ? request.getAnswer().trim() : "");

        QuizCheckResponse result = QuizCheckResponse.builder()
                .correct(correct)
                .correctAnswer(correctAnswer)
                .explanation(vocab.getExample())
                .build();

        return BaseResponse.success(result);
    }

    /**
     * Lấy N đáp án sai ngẫu nhiên từ các vocab khác trong bài.
     */
    private List<String> buildDistractors(
            List<Vocabulary> allVocabs,
            Vocabulary current,
            String mode,
            int count) {

        List<Vocabulary> others = allVocabs.stream()
                .filter(v -> !v.getId().equals(current.getId()))
                .toList();

        Collections.shuffle(new ArrayList<>(others)); // shuffle copy
        List<String> distractors = new ArrayList<>();

        for (Vocabulary v : others) {
            if (distractors.size() >= count) break;
            String distractor = "EN_TO_VI".equals(mode) ? v.getVi() : v.getTerm();
            // Tránh trùng lặp với đáp án đúng
            String correctAnswer = "EN_TO_VI".equals(mode) ? current.getVi() : current.getTerm();
            if (distractor != null && !distractor.equalsIgnoreCase(correctAnswer)) {
                distractors.add(distractor);
            }
        }

        return distractors;
    }

    @Override
    public BaseResponse generateFillBlankSession(Long lessonVocabId) {
        List<Vocabulary> allVocabs = vocabularyRepository.findAllByLessonVocabIdOrderByIdAsc(lessonVocabId);
        if (allVocabs.isEmpty()) {
            throw new BusinessException(ErrorCode.QUIZ_NOT_ENOUGH_VOCAB);
        }

        // Gọi AI batch
        List<GeminiService.FillBlankResult> aiResults = geminiService.generateFillBlankSentences(allVocabs);
        Map<Integer, String> aiSentenceMap = aiResults.stream()
                .collect(Collectors.toMap(GeminiService.FillBlankResult::vocabularyId, GeminiService.FillBlankResult::sentence));

        List<FillBlankQuestionResponse> questions = new ArrayList<>();
        int total = allVocabs.size();

        for (int i = 0; i < total; i++) {
            Vocabulary vocab = allVocabs.get(i);
            String term = vocab.getTerm();

            // Lấy câu AI, nếu AI lỡ rớt thì fallback về example trong DB
            String sentence = aiSentenceMap.get(vocab.getId());
            if (sentence == null || sentence.isBlank()) {
                String example = vocab.getExample();
                if (example != null && !example.isBlank() && term != null) {
                    // Dùng regex replace không phân biệt hoa thường
                    sentence = example.replaceAll("(?i)\\b" + term + "\\b", "___");
                }
            }

            // Nếu vẫn không có câu thì skip (hoặc có thể dùng 1 câu mặc định, nhưng skip an toàn hơn)
            if (sentence == null || sentence.isBlank()) {
                continue;
            }

            questions.add(FillBlankQuestionResponse.builder()
                    .vocabularyId(vocab.getId())
                    .sentence(sentence)
                    .hint(vocab.getVi())
                    .wordLength(term != null ? term.length() : 0)
                    .build());
        }

        // Shuffle
        Collections.shuffle(questions);
        
        // Re-index
        for (int i = 0; i < questions.size(); i++) {
            questions.get(i).setQuestionIndex(i);
            questions.get(i).setTotal(questions.size());
        }

        FillBlankSessionResponse session = FillBlankSessionResponse.builder()
                .lessonVocabId(lessonVocabId)
                .questions(questions)
                .build();

        return BaseResponse.success(session);
    }
}
