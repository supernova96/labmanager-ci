package com.university.labmanager.repository;

import com.university.labmanager.model.Laptop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
// Force re-compile
public interface LaptopRepository extends JpaRepository<Laptop, Long> {

        @Query("SELECT DISTINCT l FROM Laptop l " +
                        "LEFT JOIN l.installedSoftware s " +
                        "WHERE (:isAny = true OR s.name IN :softwareNames) " +
                        "AND l.status = 'AVAILABLE' " +
                        "AND l.id NOT IN (" +
                        "    SELECT r.laptop.id FROM Reservation r " +
                        "    WHERE r.status = 'ACTIVE' " +
                        "    AND (r.startTime < :end AND r.endTime > :start)" +
                        ") " +
                        "GROUP BY l " +
                        "HAVING (:isAny = true OR COUNT(DISTINCT s.name) >= :softwareCount)")
        List<Laptop> findAvailableLaptopsWithSoftware(
                        @Param("softwareNames") List<String> softwareNames,
                        @Param("isAny") boolean isAny,
                        @Param("softwareCount") long softwareCount,
                        @Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end);

        List<Laptop> findByStatus(com.university.labmanager.model.enums.LaptopStatus status);
}
