package com.icrs.backend.controller;

import com.icrs.backend.dto.ComplaintResponseDTO;
import com.icrs.backend.model.entity.Complaint;
import com.icrs.backend.dto.AutomatedAlertDTO;
import com.icrs.backend.service.ComplaintService;
import com.icrs.backend.service.PdfService;
import com.icrs.backend.repository.ComplaintRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private final ComplaintService complaintService;
    private final PdfService pdfService;
    private final ComplaintRepository complaintRepository;

    public ComplaintController(ComplaintService complaintService, PdfService pdfService,
            ComplaintRepository complaintRepository) {
        this.complaintService = complaintService;
        this.pdfService = pdfService;
        this.complaintRepository = complaintRepository;
    }

    // GENERATE PDF
    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadComplaintPdf(@PathVariable Long id) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found with ID: " + id));

        byte[] pdfBytes = pdfService.generateComplaintHistoryPdf(complaint);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "Complaint_" + id + "_History.pdf");

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }

    // AUTO-DETECT ALERT
    @PostMapping("/auto-detect")
    public ComplaintResponseDTO createAutoDetection(@RequestBody AutomatedAlertDTO alertDTO) {
        return complaintService.createAutoDetectComplaint(alertDTO);
    }

    // CREATE COMPLAINT
    @PostMapping
    public ComplaintResponseDTO createComplaint(@RequestBody Complaint complaint,
            Authentication authentication) {

        if (authentication == null) {
            throw new RuntimeException("Unauthorized request");
        }

        String email = authentication.getName();
        return complaintService.createComplaint(email, complaint);
    }

    // USER COMPLAINTS
    @GetMapping("/my")
    public List<ComplaintResponseDTO> getUserComplaints(Authentication authentication) {

        if (authentication == null) {
            throw new RuntimeException("Unauthorized request");
        }

        String email = authentication.getName();
        return complaintService.getUserComplaints(email);
    }

    // ADMIN — ALL COMPLAINTS
    @GetMapping("/all")
    public List<ComplaintResponseDTO> getAllComplaints() {
        return complaintService.getAllComplaints();
    }

    // STAFF — DEPARTMENT COMPLAINTS
    @GetMapping("/department")
    public List<ComplaintResponseDTO> getDepartmentComplaints(Authentication authentication) {

        if (authentication == null) {
            throw new RuntimeException("Unauthorized request");
        }

        String email = authentication.getName();
        return complaintService.getDepartmentComplaints(email);
    }

    // STATUS METRICS
    @GetMapping("/submitted/count")
    public long getSubmittedComplaintCount() {
        return complaintService.getSubmittedCount();
    }

    @GetMapping("/inreview/count")
    public long getInReviewCount() {
        return complaintService.getInReviewCount();
    }

    @GetMapping("/resolved/count")
    public long getResolvedCount() {
        return complaintService.getResolvedCount();
    }
}
