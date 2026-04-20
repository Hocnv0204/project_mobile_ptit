package com.ptit.mobile.backend.repository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

import java.util.concurrent.TimeUnit;

@Slf4j
@Repository
@RequiredArgsConstructor
public class RedisTokenRepository {

    private static final String KEY_PREFIX = "refresh_token:";

    private final StringRedisTemplate redisTemplate;

    
    public void saveRefreshToken(Long userId, String refreshToken, String email, long ttlMs) {
        String key = buildKey(userId, refreshToken);
        redisTemplate.opsForValue().set(key, email, ttlMs, TimeUnit.MILLISECONDS);
        log.debug("Saved refresh token to Redis for userId={}, ttl={}ms", userId, ttlMs);
    }

    
    public String getEmailByRefreshToken(Long userId, String refreshToken) {
        String key = buildKey(userId, refreshToken);
        return redisTemplate.opsForValue().get(key);
    }

  
    public void deleteRefreshToken(Long userId, String refreshToken) {
        String key = buildKey(userId, refreshToken);
        Boolean deleted = redisTemplate.delete(key);
        log.debug("Deleted refresh token from Redis for userId={}, success={}", userId, deleted);
    }

   
    public void deleteAllRefreshTokensByUserId(Long userId) {
        String pattern = KEY_PREFIX + userId + ":*";
        var keys = redisTemplate.keys(pattern);
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
            log.debug("Deleted {} refresh token(s) from Redis for userId={}", keys.size(), userId);
        }
    }

   
    public boolean existsRefreshToken(Long userId, String refreshToken) {
        String key = buildKey(userId, refreshToken);
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }


    private String buildKey(Long userId, String refreshToken) {
        return KEY_PREFIX + userId + ":" + refreshToken;
    }
}
