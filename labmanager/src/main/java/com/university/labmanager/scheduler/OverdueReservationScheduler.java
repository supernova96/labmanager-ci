package com.university.labmanager.scheduler;

import com.university.labmanager.model.Reservation;
import com.university.labmanager.model.User;
import com.university.labmanager.model.enums.ReservationStatus;
import com.university.labmanager.repository.ReservationRepository;
import com.university.labmanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class OverdueReservationScheduler {

    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;

    // Run every 30 minutes
    @Scheduled(fixedRate = 1800000)
    @Transactional
    public void checkOverdueReservations() {
        log.info("Running Overdue Reservation Check...");

        List<Reservation> overdueReservations = reservationRepository.findByStatusAndEndTimeBefore(
                ReservationStatus.ACTIVE,
                LocalDateTime.now());

        for (Reservation res : overdueReservations) {
            log.warn("Reservation {} is OVERDUE. Sanctioning user {}.", res.getId(), res.getUser().getMatricula());

            // Update Reservation Status
            res.setStatus(ReservationStatus.OVERDUE);
            reservationRepository.save(res);

            // Sanction User
            User student = res.getUser();
            student.setSanctioned(true);
            userRepository.save(student);

            // TODO: Send Email Notification
        }
    }
}
