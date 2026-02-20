package com.university.labmanager.service;

import com.university.labmanager.model.SystemLog;
import com.university.labmanager.repository.SystemLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LogServiceTest {

    @Mock
    private SystemLogRepository logRepository;

    @InjectMocks
    private LogService logService;

    @Test
    void testLog_Success() {
        // Arrange
        String category = "AUTH";
        String message = "User logged in";
        String username = "admin";

        // Act
        logService.log(SystemLog.LogLevel.INFO, category, message, username);

        // Assert
        ArgumentCaptor<SystemLog> logCaptor = ArgumentCaptor.forClass(SystemLog.class);
        verify(logRepository).save(logCaptor.capture());

        SystemLog capturedLog = logCaptor.getValue();
        assertEquals(SystemLog.LogLevel.INFO, capturedLog.getLevel());
        assertEquals(category, capturedLog.getCategory());
        assertEquals(message, capturedLog.getMessage());
        assertEquals(username, capturedLog.getUsername());
        assertNotNull(capturedLog.getTimestamp());
    }

    @Test
    void testLog_TruncateMessage() {
        // Arrange
        String longMessage = "a".repeat(2005);

        // Act
        logService.log(SystemLog.LogLevel.ERROR, "TEST", longMessage, "system");

        // Assert
        ArgumentCaptor<SystemLog> logCaptor = ArgumentCaptor.forClass(SystemLog.class);
        verify(logRepository).save(logCaptor.capture());

        SystemLog capturedLog = logCaptor.getValue();
        assertEquals(2000, capturedLog.getMessage().length());
    }

    @Test
    void testLog_ExceptionHandling() {
        // Arrange
        doThrow(new RuntimeException("DB Error")).when(logRepository).save(any(SystemLog.class));

        // Act & Assert (Should not throw exception)
        assertDoesNotThrow(() -> logService.log(SystemLog.LogLevel.INFO, "TEST", "Message", "user"));
    }

    @Test
    void testInfoHelper() {
        // Act
        logService.info("CAT", "Msg", "Usr");

        // Assert
        verify(logRepository).save(any(SystemLog.class));
    }

    @Test
    void testErrorHelper() {
        // Act
        logService.error("CAT", "Msg", "Usr");

        // Assert
        verify(logRepository).save(any(SystemLog.class));
    }

    @Test
    void testGetRecentLogs() {
        // Arrange
        SystemLog log1 = SystemLog.builder().message("Log 1").build();
        SystemLog log2 = SystemLog.builder().message("Log 2").build();
        when(logRepository.findAllByOrderByTimestampDesc()).thenReturn(Arrays.asList(log1, log2));

        // Act
        List<SystemLog> logs = logService.getRecentLogs();

        // Assert
        assertEquals(2, logs.size());
        verify(logRepository).findAllByOrderByTimestampDesc();
    }
}
