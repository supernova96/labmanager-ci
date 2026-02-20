package com.university.labmanager.service;

import com.university.labmanager.model.Reservation;
import com.university.labmanager.model.enums.ReservationStatus;
import com.university.labmanager.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReservationScheduler {

    private final ReservationRepository reservationRepository;
    private final EmailService emailService;

    @Scheduled(fixedRate = 60000) // Check every minute for demo purposes (usually hourly)
    @Transactional
    public void checkOverdueReservations() {
        log.info("⏰ Checking for overdue reservations...");
        try {
            List<Reservation> overdueList = reservationRepository.findByStatusAndEndTimeBefore(
                    ReservationStatus.ACTIVE, LocalDateTime.now());

            for (Reservation res : overdueList) {
                try {
                    log.warn("⚠️ Reservation {} is OVERDUE. User: {}", res.getId(), res.getUser().getFullName());

                    // Mark as OVERDUE
                    res.setStatus(ReservationStatus.OVERDUE);
                    reservationRepository.save(res);

                    // Notify User
                    emailService.sendSimpleMessage(
                            res.getUser().getEmail(),
                            "URGENT: Laptop Return Overdue",
                            "Hello " + res.getUser().getFullName() + ",\n\n" +
                                    "Your reservation for " + res.getLaptop().getModel() + " ("
                                    + res.getLaptop().getSerialNumber() + ") " +
                                    "was due at " + res.getEndTime() + ".\n" +
                                    "Please return it immediately to avoid sanctions.\n\n" +
                                    "Lab Manager System");

                    // Notify Admin (optional)
                    emailService.sendSimpleMessage(
                            "admin@university.edu",
                            "Overdue Alert: " + res.getUser().getFullName(),
                            "Reservation " + res.getId() + " is overdue.");
                } catch (Exception e) {
                    log.error("Error processing overdue reservation {}: {}", res.getId(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error in scheduled task checkOverdueReservations: {}", e.getMessage());
        }
    }

    @Scheduled(fixedRate = 300000) // Check every 5 minutes
    @Transactional
    public void checkUpcomingReservations() {
        log.info("⏰ Checking for upcoming reservations...");
        try {
            // Logic to find reservations starting in the next hour (e.g., between now and
            // now + 1h)
            // For simplicity, we fetch ACTIVE reservations that haven't started yet but
            // start soon.
            // Note: In real app, status might be 'PENDING' or 'CONFIRMED' before pickup.
            // Assuming PENDING means booked but not picked up.

            LocalDateTime oneHourFromNow = LocalDateTime.now().plusHours(1);
            LocalDateTime now = LocalDateTime.now();

            // We need a repository method for this, or just filter all PENDING ones (fine
            // for small scale)
            List<Reservation> upcoming = reservationRepository.findByStatus(ReservationStatus.ACTIVE); // Or PENDING if
                                                                                                       // that's the
                                                                                                       // pre-pickup
                                                                                                       // state
            // Actually, if status is ACTIVE, it means they have the laptop.
            // Reminder should be for *Returning* (Near EndTime) OR for *Picking Up* (Near
            // StartTime).

            // User requested "uno de recordatorio". Let's assume Reminder to RETURN (Ending
            // soon).
            // or Reminder to PICK UP (Starting soon).
            // Let's implement Reminder to RETURN (EndTime is approaching).

            for (Reservation res : upcoming) {
                if (res.getEndTime().isAfter(now) && res.getEndTime().isBefore(oneHourFromNow)) {
                    // Check if we already sent reminder (would need a flag in DB, skipping for
                    // demo)
                    log.info("🔔 Sending return reminder for reservation {}", res.getId());
                    emailService.sendReminder(res);
                }
            }
        } catch (Exception e) {
            log.error("Error checking upcoming reservations", e);
        }
    }
}
