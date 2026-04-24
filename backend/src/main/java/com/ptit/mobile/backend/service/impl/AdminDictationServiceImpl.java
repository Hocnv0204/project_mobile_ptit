package com.ptit.mobile.backend.service.impl;

import com.ptit.mobile.backend.dto.response.BaseResponse;
import com.ptit.mobile.backend.dto.response.dictation.DictationResponse;
import com.ptit.mobile.backend.exception.BusinessException;
import com.ptit.mobile.backend.exception.ErrorCode;
import com.ptit.mobile.backend.model.Dictation;
import com.ptit.mobile.backend.model.DictationSegment;
import com.ptit.mobile.backend.repository.DictationRepository;
import com.ptit.mobile.backend.repository.DictationSegmentRepository;
import com.ptit.mobile.backend.service.AdminDictationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminDictationServiceImpl implements AdminDictationService {

    private final DictationRepository dictationRepository;
    private final DictationSegmentRepository segmentRepository;

    // ─────────────────────────────────────────────────
    // 1. GET all (admin view — no user-progress filter)
    // ─────────────────────────────────────────────────

    @Override
    public BaseResponse getAllForAdmin() {
        List<DictationResponse> result = dictationRepository.findAll().stream()
                .map(d -> DictationResponse.builder()
                        .id(d.getId())
                        .title(d.getTitle())
                        .mediaUrl(d.getMediaUrl())
                        .totalSegments(d.getTotalSegments())
                        .build())
                .collect(Collectors.toList());
        return BaseResponse.success(result);
    }

    // ─────────────────────────────────────────────────
    // 2. Create from SRT file upload
    // ─────────────────────────────────────────────────

    @Override
    @Transactional
    public BaseResponse createFromSrtFile(String title, String youtubeUrl, MultipartFile srtFile) {
        if (srtFile == null || srtFile.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "SRT file is required");
        }
        String filename = srtFile.getOriginalFilename() != null
                ? srtFile.getOriginalFilename().toLowerCase() : "";
        if (!filename.endsWith(".srt") && !filename.endsWith(".vtt")) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Only .srt or .vtt files are accepted");
        }

        String content;
        try {
            content = new BufferedReader(
                    new InputStreamReader(srtFile.getInputStream(), StandardCharsets.UTF_8))
                    .lines()
                    .collect(Collectors.joining("\n"));
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Cannot read SRT file: " + e.getMessage());
        }

        List<Map<String, Object>> segments = filename.endsWith(".vtt")
                ? parseVtt(content)
                : parseSrt(content);

        if (segments.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "SRT file is empty or malformed");
        }

        return saveSegments(title, youtubeUrl, segments);
    }

    // ─────────────────────────────────────────────────
    // 3. Delete
    // ─────────────────────────────────────────────────

    @Override
    @Transactional
    public BaseResponse delete(UUID id) {
        Dictation dictation = dictationRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.DICTATION_NOT_FOUND));
        segmentRepository.deleteByDictationId(id);
        dictationRepository.delete(dictation);
        return BaseResponse.success("Deleted successfully");
    }

    // ─────────────────────────────────────────────────
    // Save helper
    // ─────────────────────────────────────────────────

    private BaseResponse saveSegments(String title, String youtubeUrl,
                                       List<Map<String, Object>> rawSegments) {
        Dictation dictation = Dictation.builder()
                .id(UUID.randomUUID())
                .title(title)
                .mediaUrl(youtubeUrl)
                .totalSegments(0) // will update after filtering
                .build();
        dictationRepository.save(dictation);

        List<DictationSegment> segments = new ArrayList<>();
        for (int i = 0; i < rawSegments.size(); i++) {
            Map<String, Object> t = rawSegments.get(i);

            double start = toDouble(t.get("start"));
            double end = t.containsKey("end") ? toDouble(t.get("end"))
                    : start + toDouble(t.get("duration"));

            String text = Objects.toString(t.get("text"), "")
                    .replaceAll("\\n", " ")
                    .replaceAll("\\s+", " ")
                    .trim();
            if (text.isEmpty()) continue;

            Map<String, Object> blank = generateBlankText(text);

            segments.add(DictationSegment.builder()
                    .id(UUID.randomUUID())
                    .dictationId(dictation.getId())
                    .sequenceOrder(segments.size() + 1)
                    .startTime((float) start)
                    .endTime((float) end)
                    .englishText(text)
                    .blankText((String) blank.get("blankText"))
                    .answerKeys((List<String>) blank.get("answerKeys"))
                    .build());
        }

        dictation.setTotalSegments(segments.size());
        dictationRepository.save(dictation);
        segmentRepository.saveAll(segments);

        return BaseResponse.success(dictation);
    }

    // ─────────────────────────────────────────────────
    // SRT parser
    // ─────────────────────────────────────────────────

    /**
     * Parses standard SRT content into {text, start, end} maps (seconds as float).
     *
     *  1
     *  00:00:01,000 --> 00:00:04,000
     *  What would the future look like?
     */
    private List<Map<String, Object>> parseSrt(String srtContent) {
        List<Map<String, Object>> result = new ArrayList<>();
        String[] blocks = srtContent.trim().split("\\n\\s*\\n");
        Pattern tsPattern = Pattern.compile(
                "(\\d{2}:\\d{2}:\\d{2}[,.]\\d{3})\\s*-->\\s*(\\d{2}:\\d{2}:\\d{2}[,.]\\d{3})");

        for (String block : blocks) {
            String[] lines = block.trim().split("\\n");
            String tsLine = null;
            int textStart = -1;
            for (int i = 0; i < lines.length; i++) {
                if (lines[i].contains("-->")) {
                    tsLine = lines[i];
                    textStart = i + 1;
                    break;
                }
            }
            if (tsLine == null || textStart >= lines.length) continue;

            Matcher m = tsPattern.matcher(tsLine);
            if (!m.find()) continue;

            double startSec = timestampToSeconds(m.group(1));
            double endSec = timestampToSeconds(m.group(2));

            StringBuilder text = new StringBuilder();
            for (int i = textStart; i < lines.length; i++) {
                String clean = lines[i].replaceAll("<[^>]+>", "").trim();
                if (!clean.isEmpty()) {
                    if (text.length() > 0) text.append(" ");
                    text.append(clean);
                }
            }
            if (text.length() == 0) continue;

            Map<String, Object> entry = new HashMap<>();
            entry.put("text", text.toString());
            entry.put("start", startSec);
            entry.put("end", endSec);
            result.add(entry);
        }
        return result;
    }

    // ─────────────────────────────────────────────────
    // VTT parser (also accepted)
    // ─────────────────────────────────────────────────

    private List<Map<String, Object>> parseVtt(String vtt) {
        List<Map<String, Object>> result = new ArrayList<>();
        String[] blocks = vtt.split("\n\n");
        Pattern tsPattern = Pattern.compile(
                "(\\d{2}:\\d{2}:\\d{2}[,.]\\d{3})\\s*-->\\s*(\\d{2}:\\d{2}:\\d{2}[,.]\\d{3})");

        for (String block : blocks) {
            String[] lines = block.trim().split("\n");
            String tsLine = null;
            int textStart = -1;
            for (int i = 0; i < lines.length; i++) {
                if (lines[i].contains("-->")) {
                    tsLine = lines[i];
                    textStart = i + 1;
                    break;
                }
            }
            if (tsLine == null || textStart >= lines.length) continue;
            Matcher m = tsPattern.matcher(tsLine);
            if (!m.find()) continue;

            double startSec = timestampToSeconds(m.group(1));
            double endSec = timestampToSeconds(m.group(2));

            StringBuilder text = new StringBuilder();
            for (int i = textStart; i < lines.length; i++) {
                String clean = lines[i].replaceAll("<[^>]+>", "").trim();
                if (!clean.isEmpty()) {
                    if (text.length() > 0) text.append(" ");
                    text.append(clean);
                }
            }
            if (text.length() == 0) continue;

            Map<String, Object> entry = new HashMap<>();
            entry.put("text", text.toString());
            entry.put("start", startSec);
            entry.put("end", endSec);
            result.add(entry);
        }
        return result;
    }

    private double timestampToSeconds(String ts) {
        // HH:MM:SS,mmm  or  HH:MM:SS.mmm
        String[] parts = ts.replace(",", ".").split(":");
        double h = Double.parseDouble(parts[0]);
        double m = Double.parseDouble(parts[1]);
        double s = Double.parseDouble(parts[2]);
        return h * 3600 + m * 60 + s;
    }

    // ─────────────────────────────────────────────────
    // Blank text generation
    // ─────────────────────────────────────────────────

    /**
     * Generates fill-in-the-blank text.
     * Blank marker: "**"  — matches the React Native regex /\*{2,}/
     * Answer keys:  lower-cased, punctuation stripped.
     *
     * Rules:
     *  - ~30% of tokens hidden
     *  - Only content words (≥ 4 chars, not stop-words)
     *  - Never hide consecutive words
     */
    private Map<String, Object> generateBlankText(String text) {
        String[] tokens = text.split("\\s+");
        int n = tokens.length;
        String[] result = Arrays.copyOf(tokens, n);
        List<String> answerKeys = new ArrayList<>();

        int targetBlanks = Math.max(1, (int) Math.round(n * 0.30));

        List<Integer> candidates = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            String clean = tokens[i].replaceAll("[^a-zA-Z0-9']", "");
            if (clean.length() >= 4 && !isStopWord(clean.toLowerCase())) {
                candidates.add(i);
            }
        }

        Collections.shuffle(candidates);
        Set<Integer> toBlank = new HashSet<>();
        for (int idx : candidates) {
            if (toBlank.size() >= targetBlanks) break;
            if (!toBlank.contains(idx - 1) && !toBlank.contains(idx + 1)) {
                toBlank.add(idx);
            }
        }

        List<Integer> sorted = new ArrayList<>(toBlank);
        Collections.sort(sorted);

        for (int idx : sorted) {
            String raw = tokens[idx];
            String clean = raw.replaceAll("[^a-zA-Z0-9']", "");
            answerKeys.add(clean.toLowerCase());
            // Keep trailing punctuation after the blank marker
            int lastIdx = raw.lastIndexOf(clean);
            String trailing = lastIdx >= 0 ? raw.substring(lastIdx + clean.length()) : "";
            result[idx] = "**" + trailing;
        }

        Map<String, Object> out = new HashMap<>();
        out.put("blankText", String.join(" ", result));
        out.put("answerKeys", answerKeys);
        return out;
    }

    private static final Set<String> STOP_WORDS = new HashSet<>(Arrays.asList(
            "this", "that", "with", "have", "from", "they", "them", "their",
            "been", "were", "will", "would", "could", "should", "shall", "when",
            "then", "than", "more", "some", "into", "over", "also", "just",
            "about", "after", "before", "which", "there", "these", "those",
            "being", "doing", "going", "said", "says", "what", "where", "while",
            "your", "ours", "hers", "does", "like", "very", "only", "even",
            "back", "such", "well", "each", "many", "most", "both", "much"
    ));

    private boolean isStopWord(String w) {
        return STOP_WORDS.contains(w);
    }

    private double toDouble(Object val) {
        if (val == null) return 0.0;
        return Double.parseDouble(val.toString());
    }
}
