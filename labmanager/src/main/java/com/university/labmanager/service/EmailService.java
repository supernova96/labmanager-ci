package com.university.labmanager.service;

import com.university.labmanager.model.Reservation;
import com.university.labmanager.model.User;
import com.university.labmanager.util.QrCodeGenerator;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender emailSender;
    private final TemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    public void sendReservationConfirmation(Reservation reservation, User user) {
        try {
            log.info("📧 [REAL SMTP] Preparing Reservation Confirmation for: {}", user.getEmail());

            // 1. Generate QR Code
            log.info("... Generating QR Code...");
            String qrBase64 = "";
            try {
                String qrContent = "RES-" + reservation.getId();
                byte[] qrImage = QrCodeGenerator.generateQRCodeImage(qrContent, 200, 200);
                qrBase64 = Base64.getEncoder().encodeToString(qrImage);
                log.info("... QR Code Generated successfully (Size: {} bytes)", qrImage.length);
            } catch (Throwable t) {
                log.error("❌ ERROR Generating QR Code: {}", t.getMessage(), t);
                System.out.println("❌ QR GENERATION FAILED: " + t.toString());
                // Fallback to empty/placeholder if QR fails, so email might still send?
                // For now, let's keep it failing but LOGGED.
                throw t;
            }

            // 2. Prepare Context
            Context context = new Context();
            context.setVariable("name", user.getFullName());
            context.setVariable("reservationId", reservation.getId());
            context.setVariable("laptop", reservation.getLaptop().getModel());
            context.setVariable("startTime",
                    reservation.getStartTime().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
            context.setVariable("endTime",
                    reservation.getEndTime().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
            context.setVariable("qrImage", qrBase64);

            // 3. Process Template
            log.info("... Processing Template 'mail/reservation-confirmation'...");
            String htmlBody = templateEngine.process("mail/reservation-confirmation", context);

            // 4. Send Email
            log.info("... Sending HTML Message...");
            sendHtmlMessage(user.getEmail(), "Confirmación de Reserva - LabManager", htmlBody);

        } catch (Throwable e) {
            log.error("❌ CRITICAL ERROR sending reservation confirmation", e);
            System.out.println("❌ CRITICAL ERROR in sendReservationConfirmation: " + e.toString());
            e.printStackTrace();
        }
    }

    @Async
    public void sendSanctionNotification(User user, String reason) {
        try {
            log.info("📧 [REAL SMTP] Preparing Sanction Notification for: {}", user.getEmail());

            Context context = new Context();
            context.setVariable("name", user.getFullName());
            context.setVariable("reason", reason);

            String htmlBody = templateEngine.process("mail/sanction-notice", context);

            sendHtmlMessage(user.getEmail(), "Aviso de Sanción - LabManager", htmlBody);
        } catch (Throwable e) {
            log.error("❌ Error sending sanction notification", e);
            System.out.println("❌ CRITICAL ERROR in sendSanctionNotification: " + e.toString());
            e.printStackTrace();
        }
    }

    @Async
    public void sendReminder(Reservation reservation) {
        try {
            User user = reservation.getUser();
            log.info("📧 [REAL SMTP] Preparing Reminder for: {}", user.getEmail());

            Context context = new Context();
            context.setVariable("name", user.getFullName());
            context.setVariable("laptop", reservation.getLaptop().getModel());
            context.setVariable("startTime", reservation.getStartTime().format(DateTimeFormatter.ofPattern("HH:mm")));

            String htmlBody = templateEngine.process("mail/reminder", context);

            sendHtmlMessage(user.getEmail(), "Recordatorio de Reserva - LabManager", htmlBody);
        } catch (Throwable e) {
            log.error("❌ Error sending reminder", e);
            System.out.println("❌ CRITICAL ERROR in sendReminder: " + e.toString());
            e.printStackTrace();
        }
    }

    @Async
    public void sendReturnConfirmation(Reservation reservation, User user) {
        try {
            log.info("📧 [REAL SMTP] Preparing Return Confirmation for: {}", user.getEmail());

            Context context = new Context();
            context.setVariable("name", user.getFullName());
            context.setVariable("laptop", reservation.getLaptop().getModel());
            context.setVariable("returnTime",
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));

            String htmlBody = templateEngine.process("mail/return-confirmation", context);

            sendHtmlMessage(user.getEmail(), "Devolución Exitosa - LabManager", htmlBody);
        } catch (Throwable e) {
            log.error("❌ Error sending return confirmation", e);
            System.out.println("❌ CRITICAL ERROR in sendReturnConfirmation: " + e.toString());
            e.printStackTrace();
        }
    }

    @Async
    public void sendPasswordResetLink(String to, String token) {
        try {
            log.info("📧 [REAL SMTP] Preparing Password Reset for: {}", to);

            String resetUrl = "http://localhost:5173/reset-password?token=" + token;

            // Log link for safety/dev
            System.out.println(">>> PASSWORD RESET LINK: " + resetUrl);

            Context context = new Context();
            context.setVariable("resetLink", resetUrl);

            String htmlBody = templateEngine.process("mail/password-reset", context);

            sendHtmlMessage(to, "Recuperación de Contraseña - LabManager", htmlBody);
        } catch (Throwable e) {
            log.error("❌ Error sending password reset link", e);
            System.out.println("❌ CRITICAL ERROR in sendPasswordResetLink: " + e.toString());
            e.printStackTrace();
        }
    }

    @Async
    public void sendSimpleMessage(String to, String subject, String text) {
        log.info("📧 [REAL SMTP] Attempting to send Simple Email to: {}", to);
        System.out.println(">>> CHECKING SMTP: Sending to " + to + " via " + fromEmail);

        try {
            if (to == null || !to.contains("@")) {
                log.warn("⚠️ Cannot send email, invalid address: {}", to);
                return;
            }

            MimeMessage message = emailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, StandardCharsets.UTF_8.name());

            String safeFrom = fromEmail != null ? fromEmail : "noreply@labmanager.com";
            helper.setFrom(safeFrom);
            helper.setTo(to);
            helper.setSubject(subject != null ? subject : "No Subject");
            helper.setText(text != null ? text : "");

            emailSender.send(message);
            log.info("✅ REAL Email sent successfully to {}", to);
            System.out.println(">>> SMTP SUCCESS: Email sent to " + to);
        } catch (Exception e) {
            log.error("❌ SMTP ERROR sending simple email to {}", to, e);
            System.out.println(">>> SMTP FAILED: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void sendHtmlMessage(String to, String subject, String htmlBody) throws MessagingException {
        log.info("📧 [REAL SMTP] Attempting to send HTML Email to: {}", to);
        try {
            MimeMessage message = emailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name());

            String safeFrom = fromEmail != null ? fromEmail : "noreply@labmanager.com";
            helper.setFrom(safeFrom);
            helper.setTo(to != null ? to : "");
            helper.setSubject(subject != null ? subject : "Notification");
            helper.setText(htmlBody != null ? htmlBody : "", true);

            emailSender.send(message);
            log.info("✅ REAL HTML Email sent successfully to {}", to);
        } catch (Exception e) {
            log.error("❌ SMTP ERROR sending HTML email to {}", to, e);
            System.out.println(">>> SMTP FAILED: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
