package com.university.labmanager.service;

import com.university.labmanager.model.Laptop;
import com.university.labmanager.repository.LaptopRepository;
import com.university.labmanager.model.enums.LaptopStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final LaptopRepository laptopRepository;
    private final com.university.labmanager.repository.BlockedDateRepository blockedDateRepository;

    @Transactional(readOnly = true)
    public List<Laptop> findSmartOptions(String softwareNeeded, LocalDateTime start, LocalDateTime end) {
        if (start.isAfter(end) || start.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Horario inválido para la reserva");
        }
        validateReservationTime(start, end);

        List<String> softwareList = new java.util.ArrayList<>();
        boolean isAny = true;
        long softwareCount = 0;

        if (softwareNeeded != null && !softwareNeeded.trim().equalsIgnoreCase("Any")
                && !softwareNeeded.trim().isEmpty()) {
            isAny = false;
            String[] parts = softwareNeeded.split(",");
            for (String p : parts) {
                if (!p.trim().isEmpty()) {
                    softwareList.add(p.trim());
                }
            }
            softwareCount = softwareList.size();
            if (softwareCount == 0)
                isAny = true;
        }

        // Prevent SQL error with empty list in IN clause
        if (softwareList.isEmpty()) {
            softwareList.add("DUMMY_SOFTWARE_TO_PREVENT_SQL_SYNTAX_ERROR");
        }

        // Búsqueda inteligente usando el repositorio
        return laptopRepository.findAvailableLaptopsWithSoftware(softwareList, isAny, softwareCount, start, end);
    }

    @Transactional
    public com.university.labmanager.model.Reservation createReservation(Long userId, Long laptopId,
            LocalDateTime start, LocalDateTime end, String subject, String professor) {
        if (start.isAfter(end))
            throw new IllegalArgumentException("Start date must be before end date");
        validateReservationTime(start, end);

        // 2. Verificar disponibilidad
        // Si hay una reserva ACCEPTED o PENDING en ese horario, no se puede.
        // TODO: Mejorar query para incluir PENDING/ACCEPTED en bloqueo.
        // Por ahora mantenemos logica simple (si query devuelve laptop, es "valida").

        com.university.labmanager.model.User user = new com.university.labmanager.model.User();
        user.setId(userId);

        com.university.labmanager.model.Laptop laptop = laptopRepository.findById(laptopId)
                .orElseThrow(() -> new IllegalArgumentException("Laptop not found with ID: " + laptopId));

        com.university.labmanager.model.Reservation reservation = com.university.labmanager.model.Reservation.builder()
                .user(user)
                .laptop(laptop)
                .startTime(start)
                .endTime(end)
                .subject(subject)
                .professor(professor)
                .status(com.university.labmanager.model.enums.ReservationStatus.PENDING)
                .build();

        return reservationRepository.save(reservation);
    }

    @Transactional
    public List<com.university.labmanager.model.Reservation> createBulkReservation(Long userId, Integer quantity,
            String softwareNeeded,
            LocalDateTime start, LocalDateTime end, String subject) {
        if (start.isAfter(end))
            throw new IllegalArgumentException("Start date must be before end date");
        validateReservationTime(start, end);

        // Parse software requirements similarly to findSmartOptions
        List<String> softwareList = new java.util.ArrayList<>();
        boolean isAny = true;
        long softwareCount = 0;

        if (softwareNeeded != null && !softwareNeeded.trim().equalsIgnoreCase("Any")
                && !softwareNeeded.trim().isEmpty()) {
            isAny = false;
            String[] parts = softwareNeeded.split(",");
            for (String p : parts) {
                if (!p.trim().isEmpty()) {
                    softwareList.add(p.trim());
                }
            }
            softwareCount = softwareList.size();
        }

        if (softwareList.isEmpty()) {
            softwareList.add("DUMMY_SOFTWARE_TO_PREVENT_SQL_SYNTAX_ERROR");
        }

        List<Laptop> available = laptopRepository.findAvailableLaptopsWithSoftware(softwareList, isAny, softwareCount,
                start, end);

        if (available.size() < quantity) {
            throw new IllegalArgumentException(
                    "Not enough laptops available. Requested: " + quantity + ", Found: " + available.size());
        }

        String batchId = java.util.UUID.randomUUID().toString();
        List<com.university.labmanager.model.Reservation> reservations = new java.util.ArrayList<>();

        com.university.labmanager.model.User user = new com.university.labmanager.model.User();
        user.setId(userId);

        for (int i = 0; i < quantity; i++) {
            Laptop laptop = available.get(i);
            com.university.labmanager.model.Reservation res = com.university.labmanager.model.Reservation.builder()
                    .user(user)
                    .laptop(laptop)
                    .startTime(start)
                    .endTime(end)
                    .subject(subject)
                    .professor(user.getFullName()) // Professor requesting for themselves/class
                    .status(com.university.labmanager.model.enums.ReservationStatus.PENDING)
                    .batchId(batchId)
                    .build();
            reservations.add(res);
        }

        return reservationRepository.saveAll(reservations);
    }

    public List<com.university.labmanager.model.Reservation> getReservationsByUserId(Long userId) {
        return reservationRepository.findByUserId(userId);
    }

    public List<com.university.labmanager.model.Reservation> getAllReservations() {
        return reservationRepository.findAllWithDetails();
    }

    private final EmailService emailService;

    public com.university.labmanager.model.Reservation updateStatus(Long reservationId,
            com.university.labmanager.model.enums.ReservationStatus status) {
        com.university.labmanager.model.Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        reservation.setStatus(status);
        com.university.labmanager.model.Reservation updated = reservationRepository.save(reservation);

        // Update Laptop Status based on Reservation Status
        Laptop laptop = reservation.getLaptop();
        boolean laptopUpdated = false;

        if (status == com.university.labmanager.model.enums.ReservationStatus.ACTIVE) {
            laptop.setStatus(LaptopStatus.IN_USE);
            laptopUpdated = true;
        } else if (status == com.university.labmanager.model.enums.ReservationStatus.COMPLETED) {
            laptop.setStatus(LaptopStatus.AVAILABLE);
            laptopUpdated = true;
        }

        if (laptopUpdated) {
            laptopRepository.save(laptop);
        }

        try {
            // Create "Safe" (Detached) objects to pass to Async method
            // This prevents Hibernate Proxy errors (Illegal pop) when accessing entities in
            // a different thread
            com.university.labmanager.model.User safeUser = new com.university.labmanager.model.User();
            safeUser.setId(updated.getUser().getId());
            safeUser.setEmail(updated.getUser().getEmail());
            safeUser.setFullName(updated.getUser().getFullName());
            safeUser.setMatricula(updated.getUser().getMatricula());

            com.university.labmanager.model.Laptop safeLaptop = new com.university.labmanager.model.Laptop();
            safeLaptop.setModel(updated.getLaptop().getModel());
            safeLaptop.setSerialNumber(updated.getLaptop().getSerialNumber());

            com.university.labmanager.model.Reservation safeReservation = new com.university.labmanager.model.Reservation();
            safeReservation.setId(updated.getId());
            safeReservation.setSubject(updated.getSubject());
            safeReservation.setStartTime(updated.getStartTime());
            safeReservation.setEndTime(updated.getEndTime());
            safeReservation.setLaptop(safeLaptop);

            if (status == com.university.labmanager.model.enums.ReservationStatus.APPROVED) {
                emailService.sendReservationConfirmation(safeReservation, safeUser);
            } else if (status == com.university.labmanager.model.enums.ReservationStatus.COMPLETED) {
                emailService.sendReturnConfirmation(safeReservation, safeUser);
            }
        } catch (Exception e) {
            // Log error but don't fail the transaction
            System.err.println(">>> EMAIL SENDING FAILED (Transaction safe): " + e.getMessage());
            e.printStackTrace();
        }

        return updated;
    }

    @Transactional
    public void submitFeedback(Long reservationId, Integer rating, String feedback) {
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Calificación debe ser entre 1 y 5");
        }

        com.university.labmanager.model.Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

        reservation.setRating(rating);
        reservation.setFeedback(feedback);
        reservationRepository.save(reservation);

        // Check Average Rating for Laptop
        Double average = reservationRepository.findAverageRatingByLaptopId(reservation.getLaptop().getId());
        if (average != null && average < 3.0) {
            Laptop laptop = reservation.getLaptop();
            laptop.setStatus(LaptopStatus.MAINTENANCE_REQUIRED);
            laptopRepository.save(laptop);
            System.out.println(
                    ">>> LAPTOP " + laptop.getSerialNumber() + " MARKED FOR MAINTENANCE (Avg Rating: " + average + ")");
        }
    }

    public List<Laptop> findAllLaptops() {
        return laptopRepository.findAll();
    }

    @Transactional
    public Laptop saveLaptop(Laptop laptop) {
        if (laptop.getInstalledSoftware() != null) {
            java.util.Set<com.university.labmanager.model.Software> persistentSoftware = new java.util.HashSet<>();
            for (com.university.labmanager.model.Software sw : laptop.getInstalledSoftware()) {
                // Fix: Check by NAME only because 'name' has a unique constraint in the DB.
                // We cannot have multiple "Python" entries with different versions.
                com.university.labmanager.model.Software persistent = softwareRepository
                        .findByName(sw.getName())
                        .orElseGet(() -> softwareRepository.save(sw));
                persistentSoftware.add(persistent);
            }
            laptop.setInstalledSoftware(persistentSoftware);
        }
        return laptopRepository.save(laptop);
    }

    public void deleteLaptop(Long id) {
        laptopRepository.deleteById(id);
    }

    private void validateReservationTime(LocalDateTime start, LocalDateTime end) {
        // 1. Check Day (Mon-Fri)
        java.time.DayOfWeek day = start.getDayOfWeek();
        if (day == java.time.DayOfWeek.SATURDAY || day == java.time.DayOfWeek.SUNDAY) {
            throw new IllegalArgumentException("Reservations are only allowed Monday to Friday.");
        }

        // 2. Check Hours (7 AM - 9 PM)
        int startHour = start.getHour();
        int endHour = end.getHour();
        // Adjust logic: if end is exactly 21:00, that's fine. If 21:01, that's wrong.
        // Simple check: start hour >= 7. End hour <= 21. If end hour is 21, minute must
        // be 0.
        if (startHour < 7 || endHour > 21 || (endHour == 21 && end.getMinute() > 0)) {
            throw new IllegalArgumentException("Reservations are only allowed between 7:00 AM and 9:00 PM.");
        }

        // 3. Check Blocked Dates
        if (blockedDateRepository.existsByDate(start.toLocalDate())) {
            throw new IllegalArgumentException("The selected date is blocked by administration (e.g., Holiday).");
        }
    }

    private final com.university.labmanager.repository.ReservationRepository reservationRepository;
    private final com.university.labmanager.repository.SoftwareRepository softwareRepository;
}
