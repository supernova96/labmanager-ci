package com.university.labmanager.repository;

import com.university.labmanager.model.SystemLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SystemLogRepository extends JpaRepository<SystemLog, Long> {
    // Basic finding, typically we want latest first
    List<SystemLog> findAllByOrderByTimestampDesc();
}
