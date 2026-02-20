package com.university.labmanager.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import com.university.labmanager.model.Laptop;
import com.university.labmanager.model.Reservation;
import com.university.labmanager.repository.LaptopRepository;
import com.university.labmanager.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final LaptopRepository laptopRepository;
    private final ReservationRepository reservationRepository;
    private final com.university.labmanager.repository.IncidentRepository incidentRepository;

    public byte[] generateLaptopReportPdf(String status) throws DocumentException {
        List<Laptop> laptops = "ALL".equals(status) ? laptopRepository.findAll()
                : laptopRepository.findByStatus(com.university.labmanager.model.enums.LaptopStatus.valueOf(status));

        Document document = new Document();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, out);

        document.open();
        com.itextpdf.text.Font font = FontFactory.getFont(FontFactory.COURIER, 14, BaseColor.BLACK);
        Paragraph para = new Paragraph("Reporte de Inventario - " + status, font);
        para.setAlignment(Element.ALIGN_CENTER);
        document.add(para);
        document.add(Chunk.NEWLINE);

        PdfPTable table = new PdfPTable(3);
        Stream.of("ID", "Modelo", "Estado").forEach(headerTitle -> {
            PdfPCell header = new PdfPCell();
            header.setBackgroundColor(BaseColor.LIGHT_GRAY);
            header.setBorderWidth(2);
            header.setPhrase(new Phrase(headerTitle));
            table.addCell(header);
        });

        for (Laptop laptop : laptops) {
            table.addCell(String.valueOf(laptop.getId()));
            table.addCell(laptop.getModel());
            table.addCell(translateLaptopStatus(laptop.getStatus()));
        }

        document.add(table);
        document.close();

        return out.toByteArray();
    }

    public byte[] generateLaptopReportExcel(String status) throws Exception {
        List<Laptop> laptops = "ALL".equals(status) ? laptopRepository.findAll()
                : laptopRepository.findByStatus(com.university.labmanager.model.enums.LaptopStatus.valueOf(status));

        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Laptops");

        Row headerRow = sheet.createRow(0);
        String[] columns = { "ID", "Modelo", "Número de Serie", "Estado" };
        for (int i = 0; i < columns.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(columns[i]);
        }

        int rowNum = 1;
        for (Laptop laptop : laptops) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(laptop.getId());
            row.createCell(1).setCellValue(laptop.getModel());
            row.createCell(2).setCellValue(laptop.getSerialNumber());
            row.createCell(3).setCellValue(translateLaptopStatus(laptop.getStatus()));
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        workbook.write(out);
        workbook.close();
        return out.toByteArray();
    }

    public byte[] generateReservationReportPdf(String status, LocalDateTime start, LocalDateTime end, Long studentId,
            String professor) throws DocumentException {
        List<Reservation> reservations = reservationRepository.findReservationsByFilters(
                status != null && !status.isEmpty() && !"ALL".equals(status)
                        ? com.university.labmanager.model.enums.ReservationStatus.valueOf(status)
                        : null,
                start, end, studentId, professor != null && !professor.isEmpty() ? professor : null);

        Document document = new Document();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, out);

        document.open();
        com.itextpdf.text.Font font = FontFactory.getFont(FontFactory.COURIER, 14, BaseColor.BLACK);
        Paragraph para = new Paragraph("Reporte de Reservas", font);
        para.setAlignment(Element.ALIGN_CENTER);
        document.add(para);

        String filterText = "";
        if (start != null)
            filterText += " Desde: " + start.toLocalDate();
        if (end != null)
            filterText += " Hasta: " + end.toLocalDate();
        if (!filterText.isEmpty()) {
            Paragraph sub = new Paragraph(filterText, FontFactory.getFont(FontFactory.COURIER, 10));
            sub.setAlignment(Element.ALIGN_CENTER);
            document.add(sub);
        }

        document.add(Chunk.NEWLINE);

        PdfPTable table = new PdfPTable(4);
        Stream.of("Laptop", "Estudiante", "Profesor", "Estado").forEach(headerTitle -> {
            PdfPCell header = new PdfPCell();
            header.setBackgroundColor(BaseColor.LIGHT_GRAY);
            header.setBorderWidth(2);
            header.setPhrase(new Phrase(headerTitle));
            table.addCell(header);
        });

        for (Reservation res : reservations) {
            table.addCell(res.getLaptop() != null ? res.getLaptop().getModel() : "N/A");
            table.addCell(res.getUser() != null ? res.getUser().getFullName() : "N/A");
            table.addCell(res.getProfessor() != null ? res.getProfessor() : "N/A");
            table.addCell(res.getStatus() != null ? translateReservationStatus(res.getStatus()) : "N/A");
        }

        document.add(table);
        document.close();

        return out.toByteArray();
    }

    private String translateLaptopStatus(com.university.labmanager.model.enums.LaptopStatus status) {
        switch (status) {
            case AVAILABLE:
                return "Disponible";
            case IN_USE:
                return "En Uso";
            case MAINTENANCE_REQUIRED:
                return "Mantenimiento";
            case EN_REPARACION:
                return "En Reparación";
            case INACTIVE:
                return "Inactivo";
            default:
                return status.toString();
        }
    }

    private String translateReservationStatus(com.university.labmanager.model.enums.ReservationStatus status) {
        switch (status) {
            case ACTIVE:
                return "Activa";
            case PENDING:
                return "Pendiente";
            case APPROVED:
                return "Aprobada";
            case REJECTED:
                return "Rechazada";
            case COMPLETED:
                return "Completada";
            case CANCELLED:
                return "Cancelada";
            case OVERDUE:
                return "Vencida";
            default:
                return status.toString();
        }
    }

    public byte[] generateIncidentReportPdf() throws DocumentException {
        List<com.university.labmanager.model.Incident> incidents = incidentRepository.findAll();

        Document document = new Document();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, out);

        document.open();
        com.itextpdf.text.Font font = FontFactory.getFont(FontFactory.COURIER, 14, BaseColor.BLACK);
        Paragraph para = new Paragraph("Reporte de Incidentes", font);
        para.setAlignment(Element.ALIGN_CENTER);
        document.add(para);
        document.add(Chunk.NEWLINE);

        PdfPTable table = new PdfPTable(5);
        Stream.of("Tipo", "Equipo/Ubicación", "Descripción", "Severidad", "Fecha").forEach(headerTitle -> {
            PdfPCell header = new PdfPCell();
            header.setBackgroundColor(BaseColor.LIGHT_GRAY);
            header.setBorderWidth(2);
            header.setPhrase(new Phrase(headerTitle));
            table.addCell(header);
        });

        for (com.university.labmanager.model.Incident incident : incidents) {
            table.addCell(formatReportType(incident));
            table.addCell(formatEquipment(incident));
            table.addCell(incident.getDescription());
            table.addCell(translateSeverity(incident.getSeverity()));
            table.addCell(
                    incident.getReportedAt() != null ? incident.getReportedAt().toLocalDate().toString() : "N/A");
        }

        document.add(table);
        document.close();

        return out.toByteArray();
    }

    public byte[] generateIncidentReportExcel() throws Exception {
        List<com.university.labmanager.model.Incident> incidents = incidentRepository.findAll();

        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Incidentes");

        Row headerRow = sheet.createRow(0);
        String[] columns = { "Tipo", "Equipo/Ubicación", "Descripción", "Severidad", "Fecha" };
        for (int i = 0; i < columns.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(columns[i]);
        }

        int rowNum = 1;
        for (com.university.labmanager.model.Incident incident : incidents) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(formatReportType(incident));
            row.createCell(1).setCellValue(formatEquipment(incident));
            row.createCell(2).setCellValue(incident.getDescription());
            row.createCell(3).setCellValue(translateSeverity(incident.getSeverity()));
            row.createCell(4).setCellValue(
                    incident.getReportedAt() != null ? incident.getReportedAt().toLocalDate().toString() : "N/A");
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        workbook.write(out);
        workbook.close();
        return out.toByteArray();
    }

    private String translateSeverity(com.university.labmanager.model.enums.IncidentSeverity severity) {
        if (severity == null)
            return "N/A";
        switch (severity) {
            case CRITICAL:
                return "Crítica";
            case HIGH:
                return "Alta";
            case MEDIUM:
                return "Media";
            case LOW:
                return "Baja";
            default:
                return severity.toString();
        }
    }

    private String formatReportType(com.university.labmanager.model.Incident incident) {
        if ("DESKTOP".equals(incident.getReportType())) {
            return "Escritorio";
        }
        return "Laptop";
    }

    private String formatEquipment(com.university.labmanager.model.Incident incident) {
        if ("DESKTOP".equals(incident.getReportType())) {
            return incident.getLocation() != null ? incident.getLocation() : "Sin Ubicación";
        }
        return incident.getLaptop() != null
                ? incident.getLaptop().getModel() + " (" + incident.getLaptop().getSerialNumber() + ")"
                : "N/A";
    }
}
