package com.university.labmanager.dto;

import lombok.Data;
import lombok.Builder;
import java.util.Map;

// DTO for Analytics Dashboard
@Data
@Builder
// Force re-compile
public class AnalyticsDashboardDTO {
    private long totalReservations;
    private long activeIncidents;
    private long historicalIncidents;
    private double utilizationRate;
    private Map<String, Long> incidentsBySeverity;
    private Map<String, Long> activeIncidentsBySeverity;
    private Map<String, Long> resolvedIncidentsBySeverity;
    private Map<String, Long> popularSoftware;
    private Map<String, Long> reservationsByDay;

    private Map<String, Long> incidentsByType;
}
