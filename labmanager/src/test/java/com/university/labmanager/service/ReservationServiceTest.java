package com.university.labmanager.service;

import com.university.labmanager.model.Laptop;
import com.university.labmanager.model.Reservation;
import com.university.labmanager.model.User;
import com.university.labmanager.model.enums.LaptopStatus;
import com.university.labmanager.model.enums.ReservationStatus;
import com.university.labmanager.repository.BlockedDateRepository;
import com.university.labmanager.repository.LaptopRepository;
import com.university.labmanager.repository.ReservationRepository;
import com.university.labmanager.repository.SoftwareRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    @Mock
    private LaptopRepository laptopRepository;
    @Mock
    private BlockedDateRepository blockedDateRepository;
    @Mock
    private ReservationRepository reservationRepository;
    @Mock
    private SoftwareRepository softwareRepository;
    @Mock
    private EmailService emailService;

    @InjectMocks
    private ReservationService reservationService;

    private LocalDateTime validStart;
    private LocalDateTime validEnd;

    @BeforeEach
    void setUp() {
        // Setup a valid Monday 10:00 AM - 12:00 PM
        LocalDate today = LocalDate.now();
        // Adjust to next Monday if today is weekend
        while (today.getDayOfWeek().getValue() > 5) {
            today = today.plusDays(1);
        }
        validStart = LocalDateTime.of(today, LocalTime.of(10, 0));
        validEnd = LocalDateTime.of(today, LocalTime.of(12, 0));
    }

    // 1. Validation: Start date after End date
    @Test
    void findSmartOptions_StartDateAfterEndDate_ThrowsException() {
        LocalDateTime start = validEnd;
        LocalDateTime end = validStart;
        assertThrows(IllegalArgumentException.class, () -> reservationService.findSmartOptions("Any", start, end));
    }

    // 2. Validation: Weekend not allowed
    @Test
    void findSmartOptions_Weekend_ThrowsException() {
        // Find next Saturday
        LocalDate saturday = LocalDate.now();
        while (saturday.getDayOfWeek().getValue() != 6) {
            saturday = saturday.plusDays(1);
        }
        LocalDateTime start = LocalDateTime.of(saturday, LocalTime.of(10, 0));
        LocalDateTime end = LocalDateTime.of(saturday, LocalTime.of(12, 0));

        assertThrows(IllegalArgumentException.class, () -> reservationService.findSmartOptions("Any", start, end));
    }

    // 3. Validation: Outside hours (e.g. 6 AM)
    @Test
    void findSmartOptions_TooEarly_ThrowsException() {
        LocalDateTime start = LocalDateTime.of(validStart.toLocalDate(), LocalTime.of(6, 0));
        LocalDateTime end = LocalDateTime.of(validStart.toLocalDate(), LocalTime.of(8, 0));

        assertThrows(IllegalArgumentException.class, () -> reservationService.findSmartOptions("Any", start, end));
    }

    // 4. Success: Find Smart Options
    @Test
    void findSmartOptions_ValidRequest_ReturnsLaptops() {
        List<Laptop> mockLaptops = new ArrayList<>();
        mockLaptops.add(new Laptop());
        when(laptopRepository.findAvailableLaptopsWithSoftware(anyList(), anyBoolean(), anyLong(), any(), any()))
                .thenReturn(mockLaptops);

        List<Laptop> result = reservationService.findSmartOptions("Python", validStart, validEnd);

        assertFalse(result.isEmpty());
        verify(laptopRepository).findAvailableLaptopsWithSoftware(anyList(), anyBoolean(), anyLong(), any(), any());
    }

    // 5. Create Reservation: Success
    @Test
    void createReservation_Success() {
        Long userId = 1L;
        Long laptopId = 100L;
        Laptop laptop = new Laptop();
        laptop.setId(laptopId);

        when(laptopRepository.findById(laptopId)).thenReturn(Optional.of(laptop));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(i -> i.getArguments()[0]);

        Reservation res = reservationService.createReservation(userId, laptopId, validStart, validEnd, "Clase",
                "Profesor");

        assertNotNull(res);
        assertEquals(ReservationStatus.PENDING, res.getStatus());
        assertEquals(laptopId, res.getLaptop().getId());
    }

    // 6. Create Reservation: Laptop Not Found
    @Test
    void createReservation_LaptopNotFound_ThrowsException() {
        when(laptopRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> reservationService.createReservation(1L, 999L, validStart, validEnd, "Sub", "Prof"));
    }

    // 7. Create Bulk Reservation: Not Enough Laptops
    @Test
    void createBulkReservation_NotEnoughLaptops_ThrowsException() {
        when(laptopRepository.findAvailableLaptopsWithSoftware(anyList(), anyBoolean(), anyLong(), any(), any()))
                .thenReturn(Collections.emptyList());

        assertThrows(IllegalArgumentException.class,
                () -> reservationService.createBulkReservation(1L, 5, "Any", validStart, validEnd, "Class"));
    }

    // 8. Update Status: To ACTIVE (Should set Laptop to IN_USE)
    @Test
    void updateStatus_ToActive_UpdatesLaptopStatus() {
        Long resId = 10L;
        Reservation reservation = new Reservation();
        reservation.setId(resId);
        reservation.setStatus(ReservationStatus.APPROVED);

        Laptop laptop = new Laptop();
        laptop.setStatus(LaptopStatus.AVAILABLE);
        reservation.setLaptop(laptop);

        // Mock User for EmailService (to avoid NPE in safe object creation)
        User user = new User();
        user.setId(1L);
        user.setEmail("test@test.com");
        user.setFullName("Test User");
        reservation.setUser(user);

        when(reservationRepository.findById(resId)).thenReturn(Optional.of(reservation));
        when(reservationRepository.save(any(Reservation.class))).thenReturn(reservation);

        reservationService.updateStatus(resId, ReservationStatus.ACTIVE);

        assertEquals(LaptopStatus.IN_USE, laptop.getStatus());
        verify(laptopRepository).save(laptop);
    }

    // 9. Update Status: To COMPLETED (Should set Laptop to AVAILABLE and send
    // email)
    @Test
    void updateStatus_ToCompleted_UpdatesLaptopStatusAndSendsEmail() {
        Long resId = 10L;
        Reservation reservation = new Reservation();
        reservation.setId(resId);
        reservation.setStatus(ReservationStatus.ACTIVE);

        Laptop laptop = new Laptop();
        laptop.setStatus(LaptopStatus.IN_USE);
        reservation.setLaptop(laptop);

        User user = new User();
        user.setId(1L);
        user.setEmail("test@test.com");
        reservation.setUser(user);

        when(reservationRepository.findById(resId)).thenReturn(Optional.of(reservation));
        when(reservationRepository.save(any(Reservation.class))).thenReturn(reservation);

        reservationService.updateStatus(resId, ReservationStatus.COMPLETED);

        assertEquals(LaptopStatus.AVAILABLE, laptop.getStatus());
        verify(emailService).sendReturnConfirmation(any(), any());
    }

    // 10. Submit Feedback: Invalid Rating
    @Test
    void submitFeedback_InvalidRating_ThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> reservationService.submitFeedback(1L, 6, "Good"));
        assertThrows(IllegalArgumentException.class, () -> reservationService.submitFeedback(1L, 0, "Bad"));
    }

    // 11. Submit Feedback: Low Rating Triggers Maintenance
    @Test
    void submitFeedback_LowRating_TriggersMaintenance() {
        Long resId = 1L;
        Reservation reservation = new Reservation();
        Laptop laptop = new Laptop();
        laptop.setId(50L);
        laptop.setStatus(LaptopStatus.AVAILABLE);
        reservation.setLaptop(laptop);

        when(reservationRepository.findById(resId)).thenReturn(Optional.of(reservation));
        when(reservationRepository.findAverageRatingByLaptopId(50L)).thenReturn(2.5); // Low rating

        reservationService.submitFeedback(resId, 1, "Broken screen");

        verify(laptopRepository).save(laptop);
        assertEquals(LaptopStatus.MAINTENANCE_REQUIRED, laptop.getStatus());
    }
}
