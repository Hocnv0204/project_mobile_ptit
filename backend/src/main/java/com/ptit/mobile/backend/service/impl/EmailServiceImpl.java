package com.ptit.mobile.backend.service.impl;

import com.ptit.mobile.backend.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String senderEmail;

    @Value("${otp.sender-name}")
    private String senderName;

    @Override
    @Async
    public void sendOtpVerificationEmail(String toEmail, String otp, String fullName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            // Build Thymeleaf context
            Context context = new Context();
            context.setVariable("fullName", fullName != null ? fullName : "bạn");
            context.setVariable("otp", otp);
            context.setVariable("expireMinutes", 5);
            context.setVariable("appName", senderName);

            String htmlContent = templateEngine.process("email/otp-verification", context);

            helper.setFrom(senderEmail, senderName);
            helper.setTo(toEmail);
            helper.setSubject("[" + senderName + "] Mã xác thực OTP của bạn");
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("OTP email sent successfully to: {}", toEmail);

        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
            // Không throw — email gửi lỗi không nên làm crash luồng đăng ký
        }
    }
}
