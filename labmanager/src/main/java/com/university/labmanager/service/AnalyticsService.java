package com.university.labmanager.service;

import com.university.labmanager.dto.AnalyticsDashboardDTO;
import com.university.labmanager.model.Incident;

import com.university.labmanager.model.Reservation;
import com.university.labmanager.model.Software;
import com.university.labmanager.repository.IncidentRepository;
import com.university.labmanager.repository.LaptopRepository;
import com.university.labmanager.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
// Service for handling Analytics Dashboard logic
public class AnalyticsService {

        private final ReservationRepository reservationRepository;
        private final IncidentRepository incidentRepository;
        private final LaptopRepository laptopRepository;

        @Transactional(readOnly = true)
        public AnalyticsDashboardDTO getDashboardMetrics() {
                // 1. Basic Counts
                long totalReservations = reservationRepository.count();
                long activeIncidents = incidentRepository.countByResolvedFalse();
                long totalLaptops = laptopRepository.count();

                // 2. Utilization Rate (Active Reservations / Total Laptops)
                long activeReservationsCount = reservationRepository.findAll().stream()
                                .filter(r -> r.getStatus() == com.university.labmanager.model.enums.ReservationStatus.ACTIVE)
                                .count();
                double utilizationRate = totalLaptops > 0 ? ((double) activeReservationsCount / totalLaptops) * 100 : 0;

                // 3. Reservations by Day (Last 7 days)
                // 3. Reservations by Day (Last 7 days)
                LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
                List<Reservation> recentReservationsForChart = reservationRepository.findByStartTimeAfter(sevenDaysAgo);

                Map<String, Long> reservationsByDayMap = new HashMap<>();
                if (recentReservationsForChart != null) {
                        Map<String, Long> grouped = recentReservationsForChart.stream()
                                        .collect(Collectors.groupingBy(
                                                        r -> r.getStartTime().toLocalDate().toString(),
                                                        Collectors.counting()));
                        reservationsByDayMap.putAll(grouped);
                }

                // 4. Incidents by Severity (Split Active vs Resolved)
                List<Incident> allIncidents = incidentRepository.findAll();
                Map<String, Long> incidentsBySeverityMap = new HashMap<>();
                Map<String, Long> activeIncidentsBySeverityMap = new HashMap<>(); // New
                Map<String, Long> resolvedIncidentsBySeverityMap = new HashMap<>(); // New

                if (allIncidents != null) {
                        // Overall
                        incidentsBySeverityMap.putAll(allIncidents.stream()
                                        .collect(Collectors.groupingBy(i -> i.getSeverity().name(),
                                                        Collectors.counting())));

                        // Active (not resolved)
                        activeIncidentsBySeverityMap.putAll(allIncidents.stream()
                                        .filter(i -> !i.isResolved())
                                        .collect(Collectors.groupingBy(i -> i.getSeverity().name(),
                                                        Collectors.counting())));

                        // Resolved
                        resolvedIncidentsBySeverityMap.putAll(allIncidents.stream()
                                        .filter(Incident::isResolved)
                                        .collect(Collectors.groupingBy(i -> i.getSeverity().name(),
                                                        Collectors.counting())));
                }

                // 5. Popular Software (Inferred from Reserved Laptops)
                // Taking last 50 reservations to analyze trends
                List<Reservation> recentReservations = reservationRepository.findAll().stream()
                                .sorted((r1, r2) -> r2.getStartTime().compareTo(r1.getStartTime()))
                                .limit(50)
                                .collect(Collectors.toList());

                Map<String, Long> softwareCount = new HashMap<>();
                for (Reservation res : recentReservations) {
                        if (res.getLaptop() != null && res.getLaptop().getInstalledSoftware() != null) {
                                for (Software sw : res.getLaptop().getInstalledSoftware()) {
                                        softwareCount.put(sw.getName(),
                                                        softwareCount.getOrDefault(sw.getName(), 0L) + 1);
                                }
                        }
                }

                // Sort and limit to top 5
                Map<String, Long> topSoftware = softwareCount.entrySet().stream()
                                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                                .limit(5)
                                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

                // 6. Incidents by Type (Laptop vs Desktop)
                Map<String, Long> incidentsByTypeMap = new HashMap<>();
                if (allIncidents != null) {
                        Map<String, Long> groupedType = allIncidents.stream()
                                        .collect(Collectors.groupingBy(
                                                        i -> i.getReportType() != null ? i.getReportType() : "LAPTOP", // Default
                                                                                                                       // to
                                                                                                                       // LAPTOP
                                                                                                                       // for
                                                                                                                       // old
                                                                                                                       // data
                                                        Collectors.counting()));
                        incidentsByTypeMap.putAll(groupedType);
                }

                return AnalyticsDashboardDTO.builder()
                                .totalReservations(totalReservations)
                                .activeIncidents(activeIncidents)
                                .historicalIncidents(incidentRepository.count())
                                .utilizationRate(utilizationRate)
                                .reservationsByDay(reservationsByDayMap)
                                .incidentsBySeverity(incidentsBySeverityMap)
                                .activeIncidentsBySeverity(activeIncidentsBySeverityMap) // New
                                .resolvedIncidentsBySeverity(resolvedIncidentsBySeverityMap) // New
                                .popularSoftware(topSoftware)
                                .incidentsByType(incidentsByTypeMap)
                                .build();
        }
}
