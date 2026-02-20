package com.university.labmanager.controller;

import com.university.labmanager.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/incidents/{format}")
    public ResponseEntity<byte[]> getIncidentReport(@PathVariable String format) {
        try {
            byte[] content;
            String fileName;
            MediaType mediaType;

            if ("pdf".equalsIgnoreCase(format)) {
                content = reportService.generateIncidentReportPdf();
                fileName = "incidents_report.pdf";
                mediaType = MediaType.APPLICATION_PDF;
            } else {
                content = reportService.generateIncidentReportExcel();
                fileName = "incidents_report.xlsx";
                mediaType = MediaType.APPLICATION_OCTET_STREAM;
            }

            @SuppressWarnings("null")
            ResponseEntity.BodyBuilder response = ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + fileName)
                    .contentType(mediaType);
            return response.body(content);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/inventory/{format}")
    public ResponseEntity<byte[]> getInventoryReport(@PathVariable String format,
            @RequestParam(defaultValue = "ALL") String status) {
        try {
            byte[] content;
            String fileName;
            MediaType mediaType;

            if ("pdf".equalsIgnoreCase(format)) {
                content = reportService.generateLaptopReportPdf(status);
                fileName = "inventory_report.pdf";
                mediaType = MediaType.APPLICATION_PDF;
            } else {
                content = reportService.generateLaptopReportExcel(status);
                fileName = "inventory_report.xlsx";
                mediaType = MediaType.APPLICATION_OCTET_STREAM;
            }

            @SuppressWarnings("null")
            ResponseEntity.BodyBuilder response = ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + fileName)
                    .contentType(mediaType);
            return response.body(content);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/reservations/pdf")
    public ResponseEntity<byte[]> getReservationReportPdf(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime start,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime end,
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) String professor) {
        try {
            byte[] content = reportService.generateReservationReportPdf(status, start, end, studentId, professor);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=reservations_report.pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(content);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
