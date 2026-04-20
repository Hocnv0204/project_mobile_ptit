package com.ptit.mobile.backend.repository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

import java.util.concurrent.TimeUnit;


@Slf4j
@Repository
@RequiredArgsConstructor
public class RedisOtpRepository {

    private static final String OTP_PREFIX       = "otp:";
    private static final String RESEND_PREFIX    = "otp_resend:";

    private final StringRedisTemplate redisTemplate;

    
    public void saveOtp(String email, String otp, long ttlMs) {
        String key = otpKey(email);
        redisTemplate.opsForValue().set(key, otp, ttlMs, TimeUnit.MILLISECONDS);
        log.debug("Saved OTP for email={}, ttl={}ms", email, ttlMs);
    }

   
    public String getOtp(String email) {
        return redisTemplate.opsForValue().get(otpKey(email));
    }

    
    public void deleteOtp(String email) {
        Boolean deleted = redisTemplate.delete(otpKey(email));
        log.debug("Deleted OTP for email={}, success={}", email, deleted);
    }

    
    public boolean hasOtp(String email) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(otpKey(email)));
    }

    
    public void markResendCooldown(String email, long cooldownMs) {
        redisTemplate.opsForValue().set(resendKey(email), "1", cooldownMs, TimeUnit.MILLISECONDS);
    }

   
    public boolean isResendOnCooldown(String email) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(resendKey(email)));
    }

    

    private String otpKey(String email) {
        return OTP_PREFIX + email;
    }

    private String resendKey(String email) {
        return RESEND_PREFIX + email;
    }
}
