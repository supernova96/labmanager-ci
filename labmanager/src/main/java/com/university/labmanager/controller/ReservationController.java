package com.university.labmanager.controller;

import com.university.labmanager.dto.MessageResponse;
import com.university.labmanager.dto.ReservationRequest;
import com.university.labmanager.model.Reservation;
import com.university.labmanager.security.UserDetailsImpl;
import com.university.labmanager.service.ReservationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.university.labmanager.dto.FeedbackRequest;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    @Autowired
    ReservationService reservationService;

    @PostMapping
    public ResponseEntity<?> createReservation(@Valid @RequestBody ReservationRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            Long userId = userDetails.getId();

            if (request.getQuantity() != null && request.getQuantity() >= 1) {
                // Bulk reservation for Professor
                // Note: In real app, check if user has ROLE_PROFESSOR
                List<Reservation> reservations = reservationService.createBulkReservation(
                        userId,
                        request.getQuantity(),
                        "Any", // Default or passed in logic
                        request.getStart(),
                        request.getEnd(),
                        request.getSubject());
                return ResponseEntity.ok(reservations);
            } else {
                // Single reservation
                Reservation reservation = reservationService.createReservation(
                        userId,
                        request.getLaptopId(),
                        request.getStart(),
                        request.getEnd(),
                        request.getSubject(),
                        request.getProfessor());
                return ResponseEntity.ok(reservation);
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error processing reservation: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam String status) {

        try {
            com.university.labmanager.model.enums.ReservationStatus newStatus = com.university.labmanager.model.enums.ReservationStatus
                    .valueOf(status.toUpperCase());
            return ResponseEntity.ok(reservationService.updateStatus(id, newStatus));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error updating status: " + e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<List<Reservation>> getMyReservations(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        List<Reservation> reservations = reservationService.getReservationsByUserId(userDetails.getId());
        return ResponseEntity.ok(reservations);
    }

    @GetMapping("/all")
    public ResponseEntity<List<Reservation>> getAllReservations() {
        // In a real app, ensure only Admin can access this via WebSecurityConfig
        List<Reservation> reservations = reservationService.getAllReservations();
        return ResponseEntity.ok(reservations);
    }

    @PostMapping("/{id}/feedback")
    public ResponseEntity<?> submitFeedback(@PathVariable Long id, @RequestBody FeedbackRequest request) {
        try {
            reservationService.submitFeedback(id, request.getRating(), request.getFeedback());
            return ResponseEntity.ok(new MessageResponse("Feedback submitted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error submitting feedback: " + e.getMessage()));
        }
    }
}
