package com.university.labmanager.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "system_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LogLevel level;

    // e.g. "AUTH", "INVENTORY", "USER_DETECTED"
    private String category;

    @Column(length = 2000)
    private String message;

    // Username or "ANONYMOUS" or "SYSTEM"
    private String username;

    public enum LogLevel {
        INFO, WARN, ERROR
    }
}
