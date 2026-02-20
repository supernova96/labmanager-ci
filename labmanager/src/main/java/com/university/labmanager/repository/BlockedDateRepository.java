package com.university.labmanager.repository;

import com.university.labmanager.model.BlockedDate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface BlockedDateRepository extends JpaRepository<BlockedDate, Long> {
    boolean existsByDate(LocalDate date);
}
