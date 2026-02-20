package com.university.labmanager.repository;

import com.university.labmanager.model.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import java.util.List;

import com.university.labmanager.model.enums.ReservationStatus;
import java.time.LocalDateTime;

@Repository
// Force re-compile
public interface ReservationRepository extends JpaRepository<Reservation, Long>, JpaSpecificationExecutor<Reservation> {
        List<Reservation> findByUserId(Long userId);

        List<Reservation> findByStatus(ReservationStatus status);

        List<Reservation> findByStatusAndEndTimeBefore(ReservationStatus status, LocalDateTime time);

        List<Reservation> findByStartTimeAfter(LocalDateTime date);

        @org.springframework.data.jpa.repository.Query("SELECT r FROM Reservation r WHERE " +
                        "(:status IS NULL OR r.status = :status) AND " +
                        "(:start IS NULL OR r.startTime >= :start) AND " +
                        "(:end IS NULL OR r.endTime <= :end) AND " +
                        "(:userId IS NULL OR r.user.id = :userId) AND " +
                        "(:professor IS NULL OR r.professor LIKE %:professor%)")
        List<Reservation> findReservationsByFilters(
                        @org.springframework.data.repository.query.Param("status") ReservationStatus status,
                        @org.springframework.data.repository.query.Param("start") LocalDateTime start,
                        @org.springframework.data.repository.query.Param("end") LocalDateTime end,
                        @org.springframework.data.repository.query.Param("userId") Long userId,
                        @org.springframework.data.repository.query.Param("professor") String professor);

        @org.springframework.data.jpa.repository.Query("SELECT AVG(r.rating) FROM Reservation r WHERE r.laptop.id = :laptopId AND r.rating IS NOT NULL")
        Double findAverageRatingByLaptopId(@org.springframework.data.repository.query.Param("laptopId") Long laptopId);

        @org.springframework.data.jpa.repository.Query("SELECT r FROM Reservation r LEFT JOIN FETCH r.user LEFT JOIN FETCH r.laptop")
        List<Reservation> findAllWithDetails();
}
