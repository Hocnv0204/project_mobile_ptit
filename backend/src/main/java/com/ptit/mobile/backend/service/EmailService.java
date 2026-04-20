package com.ptit.mobile.backend.service;


public interface EmailService {

    void sendOtpVerificationEmail(String toEmail, String otp, String fullName);
}
