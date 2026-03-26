package com.icrs.backend.service;

import com.icrs.backend.model.entity.Complaint;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
public class PdfService {

    public byte[] generateComplaintHistoryPdf(Complaint complaint) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Document document = new Document();
            PdfWriter.getInstance(document, out);
            document.open();

            // Document Title
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22);
            Paragraph title = new Paragraph("ICRS Complaint History Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(Chunk.NEWLINE);

            // Basic Info Table
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);

            addTableRow(infoTable, "Complaint ID:", String.valueOf(complaint.getId()));
            addTableRow(infoTable, "Title:", complaint.getTitle());
            addTableRow(infoTable, "Category:", complaint.getCategory() != null ? complaint.getCategory() : "N/A");
            addTableRow(infoTable, "Priority:", complaint.getPriority() != null ? complaint.getPriority() : "N/A");
            addTableRow(infoTable, "Current Status:", complaint.getStatus());

            document.add(infoTable);
            document.add(Chunk.NEWLINE);

            // Actors Table (Who raised, Who attended)
            Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            document.add(new Paragraph("Audit Trail & Actors", sectionFont));
            document.add(Chunk.NEWLINE);

            PdfPTable actorTable = new PdfPTable(2);
            actorTable.setWidthPercentage(100);

            String raisedBy = "System (Auto-Generated)";
            if (complaint.getUser() != null) {
                raisedBy = complaint.getUser().getName() + " (" + complaint.getUser().getEmail() + ") - Role: "
                        + complaint.getUser().getRole();
            }
            addTableRow(actorTable, "Raised By:", raisedBy);

            String attendedBy = "Pending Assignment";
            if (complaint.getDepartment() != null) {
                attendedBy = "Department: " + complaint.getDepartment().getDepartmentName();
            } else if (complaint.getSuggestedDepartment() != null) {
                attendedBy = "Suggested Dept: " + complaint.getSuggestedDepartment() + " (Pending Accept)";
            }
            addTableRow(actorTable, "Attended By:", attendedBy);

            document.add(actorTable);
            document.add(Chunk.NEWLINE);

            // Detailed Description
            document.add(new Paragraph("Complaint Description:", sectionFont));
            document.add(new Paragraph(complaint.getDescription()));
            document.add(Chunk.NEWLINE);

            document.close();
            return out.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF document: " + e.getMessage(), e);
        }
    }

    private void addTableRow(PdfPTable table, String header, String value) {
        Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD);
        PdfPCell headerCell = new PdfPCell(new Phrase(header, boldFont));
        headerCell.setBorderWidth(0);
        headerCell.setPaddingBottom(5f);

        PdfPCell valueCell = new PdfPCell(new Phrase(value));
        valueCell.setBorderWidth(0);
        valueCell.setPaddingBottom(5f);

        table.addCell(headerCell);
        table.addCell(valueCell);
    }
}
