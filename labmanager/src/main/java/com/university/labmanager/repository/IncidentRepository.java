package com.university.labmanager.repository;

import com.university.labmanager.model.Incident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
// Force re-compile
public interface IncidentRepository extends JpaRepository<Incident, Long> {
    List<Incident> findByLaptopId(Long laptopId);

    @org.springframework.data.jpa.repository.Query("SELECT i.severity, COUNT(i) FROM Incident i GROUP BY i.severity")
    List<Object[]> countBySeverity();

    long countByResolvedFalse();
}
