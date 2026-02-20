package com.university.labmanager.service;

import com.university.labmanager.model.Laptop;
import com.university.labmanager.model.enums.LaptopStatus;
import com.university.labmanager.model.enums.ReservationStatus;
import com.university.labmanager.repository.LaptopRepository;
import com.university.labmanager.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaintenanceService {

    private final LaptopRepository laptopRepository;
    private final ReservationRepository reservationRepository;
    private final EmailService emailService;

    // Maintenance Threshold (e.g., 50 reservations = ~100 hours of heavy use)
    private static final int MAINTENANCE_THRESHOLD_RESERVATIONS = 50;

    @Scheduled(cron = "0 0 2 * * *") // Run daily at 2 AM
    @Transactional
    public void performMaintenanceCheck() {
        log.info("🛠️ Starting Predictive Maintenance Check...");
        try {
            List<Laptop> allLaptops = laptopRepository.findAll();

            for (Laptop laptop : allLaptops) {
                try {
                    if (laptop.getStatus() == LaptopStatus.AVAILABLE || laptop.getStatus() == LaptopStatus.INACTIVE) {
                        // Determine usage based on reservation count since last maintenance (mocked
                        // here by total count for simplicity)
                        // In a real system, we would check 'LastMaintenanceDate'
                        long usageCount = reservationRepository.findAll().stream()
                                .filter(r -> r.getLaptop().getId().equals(laptop.getId())
                                        && (r.getStatus() == ReservationStatus.COMPLETED
                                                || r.getStatus() == ReservationStatus.ACTIVE))
                                .count();

                        if (usageCount > MAINTENANCE_THRESHOLD_RESERVATIONS) {
                            // Check if already in maintenance
                            if (laptop.getStatus() != LaptopStatus.MAINTENANCE_REQUIRED
                                    && laptop.getStatus() != LaptopStatus.EN_REPARACION) {
                                log.warn("⚠️ Laptop {} (SN: {}) requires maintenance. Usage: {} reservations.",
                                        laptop.getModel(), laptop.getSerialNumber(), usageCount);

                                laptop.setStatus(LaptopStatus.MAINTENANCE_REQUIRED);
                                laptopRepository.save(laptop);

                                // Notify Admin
                                emailService.sendSimpleMessage("admin@university.edu",
                                        "Maintenance Alert: " + laptop.getModel(),
                                        "Laptop " + laptop.getSerialNumber() + " has exceeded usage thresholds ("
                                                + usageCount
                                                + " uses). Please inspect.");
                            }
                        }
                    }
                } catch (Exception e) {
                    log.error("Error processing maintenance for laptop {}: {}", laptop.getId(), e.getMessage());
                }
            }
            log.info("✅ Maintenance check completed.");
        } catch (Exception e) {
            log.error("Error in scheduled task performMaintenanceCheck: {}", e.getMessage());
        }
    }
}
