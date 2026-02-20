package com.university.labmanager.controller;

import com.university.labmanager.model.Incident;
import com.university.labmanager.model.Laptop;
import com.university.labmanager.model.enums.IncidentSeverity;
import com.university.labmanager.model.enums.LaptopStatus;
import com.university.labmanager.repository.IncidentRepository;
import com.university.labmanager.repository.LaptopRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    @Autowired
    IncidentRepository incidentRepository;

    @Autowired
    LaptopRepository laptopRepository;

    @GetMapping
    public List<Incident> getAllIncidents() {
        return incidentRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> reportIncident(
            @RequestParam(value = "image", required = false) org.springframework.web.multipart.MultipartFile image,
            @RequestParam("description") String description,
            @RequestParam("severity") String severityStr,
            @RequestParam(value = "reportType", defaultValue = "LAPTOP") String reportType,
            @RequestParam(value = "laptopId", required = false) Long laptopId,
            @RequestParam(value = "location", required = false) String location) {

        try {
            // Get current user
            org.springframework.security.core.Authentication authentication = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            com.university.labmanager.security.UserDetailsImpl userDetails = (com.university.labmanager.security.UserDetailsImpl) authentication
                    .getPrincipal();

            com.university.labmanager.model.User reporter = new com.university.labmanager.model.User();
            reporter.setId(userDetails.getId());

            Incident incident = new Incident();
            incident.setDescription(description);
            incident.setSeverity(IncidentSeverity.valueOf(severityStr));
            incident.setReportedAt(LocalDateTime.now());
            incident.setReporter(reporter);
            incident.setReportType(reportType);

            // Handle Image Upload
            if (image != null && !image.isEmpty()) {
                String uploadDir = "uploads/incidents/";
                java.io.File directory = new java.io.File(uploadDir);
                if (!directory.exists()) {
                    directory.mkdirs();
                }
                String fileName = java.util.UUID.randomUUID().toString() + "_" + image.getOriginalFilename();
                java.nio.file.Path filePath = java.nio.file.Paths.get(uploadDir + fileName);
                java.nio.file.Files.copy(image.getInputStream(), filePath,
                        java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                incident.setEvidencePath("/uploads/incidents/" + fileName);
            }

            if ("LAPTOP".equals(reportType)) {
                if (laptopId == null) {
                    return ResponseEntity.badRequest().body("Laptop ID is required for LAPTOP incidents");
                }
                Laptop laptop = laptopRepository.findById(laptopId)
                        .orElseThrow(() -> new RuntimeException("Laptop not found"));
                incident.setLaptop(laptop);

                // Update laptop status if severity is high
                if (IncidentSeverity.valueOf(severityStr) == IncidentSeverity.HIGH) {
                    laptop.setStatus(LaptopStatus.EN_REPARACION);
                    laptopRepository.save(laptop);
                }
            } else {
                // Desktop / Fixed Equipment
                if (location == null || location.isEmpty()) {
                    return ResponseEntity.badRequest().body("Location is required for DESKTOP incidents");
                }
                incident.setLocation(location);
            }

            incidentRepository.save(incident);
            return ResponseEntity.ok("Incident reported successfully");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error reporting incident: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<?> resolveIncident(@PathVariable Long id) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incident not found"));

        incident.setResolved(true);
        incidentRepository.save(incident);

        // Auto-fix Laptop Status if it was broken
        Laptop laptop = incident.getLaptop();
        if (laptop != null && (laptop.getStatus() == LaptopStatus.EN_REPARACION
                || laptop.getStatus() == LaptopStatus.MAINTENANCE_REQUIRED)) {
            laptop.setStatus(LaptopStatus.AVAILABLE);
            laptopRepository.save(laptop);
        }

        return ResponseEntity.ok("Incident resolved and laptop status updated.");
    }
}
