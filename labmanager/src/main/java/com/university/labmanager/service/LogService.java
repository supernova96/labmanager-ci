package com.university.labmanager.service;

import com.university.labmanager.model.SystemLog;
import com.university.labmanager.repository.SystemLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LogService {

    private final SystemLogRepository logRepository;

    // Use REQUIRES_NEW propagation to ensure logs are saved even if the main
    // transaction fails (e.g. an error log)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(SystemLog.LogLevel level, String category, String message, String username) {
        try {
            SystemLog log = SystemLog.builder()
                    .timestamp(LocalDateTime.now())
                    .level(level)
                    .category(category)
                    .message(message != null && message.length() > 2000 ? message.substring(0, 2000) : message) // Truncate
                                                                                                                // if
                                                                                                                // too
                                                                                                                // long
                    .username(username != null ? username : "SYSTEM")
                    .build();
            logRepository.save(log);
        } catch (Exception e) {
            // Fallback to console if DB logging fails
            System.err.println("FAILED TO WRITE TO DB LOG: " + e.getMessage());
        }
    }

    public void info(String category, String message, String username) {
        log(SystemLog.LogLevel.INFO, category, message, username);
    }

    public void error(String category, String message, String username) {
        log(SystemLog.LogLevel.ERROR, category, message, username);
    }

    public void warn(String category, String message, String username) {
        log(SystemLog.LogLevel.WARN, category, message, username);
    }

    public List<SystemLog> getRecentLogs() {
        // Retrieve all sorted by date desc. Ideally pagination in future.
        return logRepository.findAllByOrderByTimestampDesc();
    }
}
