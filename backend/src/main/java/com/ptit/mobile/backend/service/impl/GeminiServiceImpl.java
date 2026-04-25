package com.ptit.mobile.backend.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ptit.mobile.backend.dto.response.ai.TermFormatResult;
import com.ptit.mobile.backend.exception.BusinessException;
import com.ptit.mobile.backend.exception.ErrorCode;
import com.ptit.mobile.backend.model.Vocabulary;
import com.ptit.mobile.backend.service.GeminiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiServiceImpl implements GeminiService {
    private static final Duration TIMEOUT = Duration.ofSeconds(30);
    private static final int MAX_LOG_BODY_CHARS = 4000;
    private static final int MAX_RETRIES = 3; // số lần thử lại sau lần đầu
    private static final long BASE_BACKOFF_MS = 800;
    private static final long MAX_BACKOFF_MS = 8000;

    private final ObjectMapper objectMapper;

    @Value("${groq.api-key:}")
    private String apiKey;

    @Value("${groq.model:llama3-8b-8192}")
    private String model;

    @Value("${groq.base-url:https://api.groq.com/openai/v1}")
    private String baseUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(TIMEOUT)
            .build();

    @Override
    public List<TermFormatResult> formatTerms(String input) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new BusinessException(ErrorCode.GEMINI_API_KEY_MISSING);
        }

        List<String> terms = splitTerms(input);
        if (terms.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        String prompt = buildPrompt(terms);
        String rawText = callGroq(prompt);
        String jsonText = extractJson(rawText);
        return parseResults(jsonText);
    }

    private List<String> splitTerms(String input) {
        if (input == null) return List.of();
        String[] parts = input.split(",");
        Set<String> unique = new LinkedHashSet<>();
        for (String p : parts) {
            String s = p == null ? "" : p.trim();
            if (!s.isBlank()) unique.add(s);
        }
        return new ArrayList<>(unique);
    }

    private String buildPrompt(List<String> viTerms) {
        try {
            String termsJson = objectMapper.writeValueAsString(viTerms);
            return """
Bạn là một hệ thống chuẩn hoá từ vựng.

Input là một mảng các cụm từ tiếng Việt (chủ yếu là danh từ). Hãy tạo JSON *thuần* (không markdown, không code fence) là một mảng các object, mỗi object theo đúng schema:
{
  "term": "English term (viết hoa chữ cái đầu tiên)",
  "vi": "Nghĩa tiếng Việt (giữ gần như input, chuẩn hoá khoảng trắng, viết hoa chữ cái đầu tiên)",
  "type": "Noun|Verb|Adjective|Adverb|Phrase|Other",
  "pronunciation": "IPA, dạng /.../",
  "example": "1 câu ví dụ tiếng Anh tự nhiên có chứa term"
}

Ràng buộc:
- Trả về đúng JSON hợp lệ.
- Không thêm field khác.
- Không giải thích.
- Nếu input là tiếng Việt, hãy suy ra 'term' tiếng Anh tự nhiên nhất.
- 'example' phải chứa đúng 'term' (đúng y hệt, bao gồm viết hoa chữ cái đầu).

Input:
%s
""".formatted(termsJson);
        } catch (JsonProcessingException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR.getCode(), "Failed to build prompt");
        }
    }

    private String callGroq(String prompt) {
        try {
            URI uri = URI.create(baseUrl + "/chat/completions");

            String body = """
{
  "model": %s,
  "messages": [
    { "role": "user", "content": %s }
  ],
  "temperature": 0.2
}
""".formatted(
                    objectMapper.writeValueAsString(model),
                    objectMapper.writeValueAsString(prompt)
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(uri)
                    .timeout(TIMEOUT)
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            int attempt = 0;
            while (true) {
                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                int status = response.statusCode();

                if (status >= 200 && status < 300) {
                    return extractTextFromGroqResponse(response.body());
                }

                String responseBody = response.body();
                String retryAfter = response.headers().firstValue("retry-after").orElse(null);
                String truncatedBody = truncateForLog(responseBody);
                Object errorDetails = tryExtractGroqError(responseBody);

                boolean canRetry = isRetryableStatus(status) && attempt < MAX_RETRIES;
                long sleepMs = canRetry ? computeRetryDelayMs(attempt, retryAfter) : 0;

                log.warn(
                        "Groq request failed. status={}, attempt={}/{}, willRetry={}, retryAfter={}, sleepMs={}, body={}",
                        status,
                        attempt + 1,
                        MAX_RETRIES + 1,
                        canRetry,
                        retryAfter,
                        sleepMs,
                        truncatedBody
                );

                if (errorDetails instanceof JsonNode node) {
                    String code = node.path("code").asText(null);
                    if ("model_decommissioned".equals(code)) {
                        log.warn("Groq model is decommissioned. Update GROQ_MODEL (e.g. llama-3.1-8b-instant, llama-3.3-70b-versatile). currentModel={}", model);
                    }
                }

                if (!canRetry) {
                    throw new BusinessException(
                            ErrorCode.GEMINI_REQUEST_FAILED.getCode(),
                            "Groq request failed with status " + status
                                    + (retryAfter != null ? (" (retry-after=" + retryAfter + ")") : ""),
                            errorDetails
                    );
                }

                sleepQuietly(sleepMs);
                attempt++;
            }
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BusinessException(ErrorCode.GEMINI_REQUEST_FAILED);
        }
    }

    private boolean isRetryableStatus(int status) {
        return status == 429 || status == 500 || status == 502 || status == 503 || status == 504;
    }

    private long computeRetryDelayMs(int attempt, String retryAfterHeader) {
        Long retryAfterSec = parseRetryAfterSeconds(retryAfterHeader);
        if (retryAfterSec != null && retryAfterSec > 0) {
            return Math.min(retryAfterSec * 1000L, MAX_BACKOFF_MS);
        }
        long exp = BASE_BACKOFF_MS * (1L << Math.max(0, attempt));
        long capped = Math.min(exp, MAX_BACKOFF_MS);
        long jitter = (long) (Math.random() * 250L);
        return capped + jitter;
    }

    private Long parseRetryAfterSeconds(String retryAfterHeader) {
        if (retryAfterHeader == null) return null;
        String t = retryAfterHeader.trim();
        if (t.isBlank()) return null;
        try {
            return Long.parseLong(t);
        } catch (NumberFormatException ignore) {
            return null;
        }
    }

    private void sleepQuietly(long ms) {
        if (ms <= 0) return;
        try {
            Thread.sleep(ms);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
    }

    private String extractTextFromGroqResponse(String responseBody) throws JsonProcessingException {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode contentNode = root.at("/choices/0/message/content");
        if (contentNode.isMissingNode() || contentNode.isNull()) {
            throw new BusinessException(ErrorCode.GEMINI_INVALID_RESPONSE);
        }
        return contentNode.asText();
    }

    private Object tryExtractGroqError(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) return null;
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode errorNode = root.get("error");
            if (errorNode == null || errorNode.isNull()) return root;
            return errorNode;
        } catch (Exception ignore) {
            return truncateForLog(responseBody);
        }
    }

    private String truncateForLog(String s) {
        if (s == null) return null;
        String t = s.trim();
        if (t.length() <= MAX_LOG_BODY_CHARS) return t;
        return t.substring(0, MAX_LOG_BODY_CHARS) + "...(truncated)";
    }

    private String extractJson(String text) {
        if (text == null) throw new BusinessException(ErrorCode.GEMINI_INVALID_RESPONSE);
        String t = text.trim();

        int firstArray = t.indexOf('[');
        int lastArray = t.lastIndexOf(']');
        if (firstArray >= 0 && lastArray > firstArray) {
            return t.substring(firstArray, lastArray + 1);
        }

        int firstObj = t.indexOf('{');
        int lastObj = t.lastIndexOf('}');
        if (firstObj >= 0 && lastObj > firstObj) {
            return t.substring(firstObj, lastObj + 1);
        }

        throw new BusinessException(ErrorCode.GEMINI_INVALID_RESPONSE);
    }

    private List<TermFormatResult> parseResults(String json) {
        try {
            JsonNode node = objectMapper.readTree(json);
            if (node.isArray()) {
                List<TermFormatResult> out = new ArrayList<>();
                for (JsonNode item : node) {
                    out.add(parseOne(item));
                }
                return out;
            }
            if (node.isObject()) {
                return List.of(parseOne(node));
            }
            throw new BusinessException(ErrorCode.GEMINI_INVALID_RESPONSE);
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BusinessException(ErrorCode.GEMINI_INVALID_RESPONSE);
        }
    }

    private TermFormatResult parseOne(JsonNode node) {
        String term = capitalizeFirst(getText(node, "term"));
        String vi = capitalizeFirst(getText(node, "vi"));
        String type = getText(node, "type");
        String pronunciation = getText(node, "pronunciation");
        String example = getText(node, "example");

        return TermFormatResult.builder()
                .term(term)
                .vi(vi)
                .type(type)
                .pronunciation(pronunciation)
                .example(example)
                .build();
    }

    private String capitalizeFirst(String s) {
        if (s == null) return null;
        String t = s.trim();
        if (t.isEmpty()) return t;
        int firstCp = t.codePointAt(0);
        int firstLen = Character.charCount(firstCp);
        String first = new String(Character.toChars(Character.toTitleCase(firstCp)));
        if (t.length() == firstLen) return first;
        return first + t.substring(firstLen);
    }

    private String getText(JsonNode node, String field) {
        JsonNode v = node.get(field);
        if (v == null || v.isNull()) return null;
        String s = v.asText();
        return s == null ? null : s.trim();
    }

    @Override
    public List<FillBlankResult> generateFillBlankSentences(List<Vocabulary> vocabs) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new BusinessException(ErrorCode.GEMINI_API_KEY_MISSING);
        }

        if (vocabs == null || vocabs.isEmpty()) {
            return List.of();
        }

        try {
            // Build simple input format for the prompt
            List<Object> inputList = new ArrayList<>();
            for (Vocabulary v : vocabs) {
                inputList.add(new Object() {
                    public final Integer id = v.getId();
                    public final String term = v.getTerm();
                    public final String vi = v.getVi();
                });
            }
            String inputJson = objectMapper.writeValueAsString(inputList);

            String prompt = """
Bạn là hệ thống tạo câu hỏi điền từ tiếng Anh cho học sinh Việt Nam.

Cho danh sách từ vựng (id, term tiếng Anh, vi nghĩa tiếng Việt).
Với MỖI từ, tạo 1 câu tiếng Anh hoàn chỉnh (trình độ B1-B2) trong đó từ đó được thay bằng "___".

Yêu cầu:
- Câu đủ ngữ cảnh để đoán từ (không quá dễ, không quá khó).
- KHÔNG để lộ từ trong phần còn lại của câu.
- Không dùng từ đồng nghĩa rõ ràng trong câu.
- Chỉ trả JSON thuần (không markdown, không giải thích):
  [{"vocabularyId": <id>, "sentence": "...___..."}, ...]
- Mảng phải có đúng số phần tử = số từ input.

Input: %s
""".formatted(inputJson);

            String rawText = callGroq(prompt);
            String jsonText = extractJson(rawText);

            JsonNode node = objectMapper.readTree(jsonText);
            if (!node.isArray()) {
                throw new BusinessException(ErrorCode.GEMINI_INVALID_RESPONSE);
            }

            List<FillBlankResult> results = new ArrayList<>();
            for (JsonNode item : node) {
                Integer vid = item.path("vocabularyId").asInt();
                String sentence = item.path("sentence").asText(null);
                if (vid != 0 && sentence != null) {
                    results.add(new FillBlankResult(vid, sentence));
                }
            }
            return results;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error generating fill blank sentences: ", e);
            throw new BusinessException(ErrorCode.GEMINI_REQUEST_FAILED);
        }
    }
}

