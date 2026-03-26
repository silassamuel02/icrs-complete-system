package com.icrs.backend.service;

import com.icrs.backend.dto.ComplaintResponseDTO;
import com.icrs.backend.dto.AutomatedAlertDTO;
import com.icrs.backend.model.entity.Complaint;
import com.icrs.backend.model.entity.Department;
import com.icrs.backend.model.entity.User;
import com.icrs.backend.model.projection.UserSummary;
import com.icrs.backend.repository.ComplaintRepository;
import com.icrs.backend.repository.DepartmentRepository;
import com.icrs.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final NlpClientService nlpClientService;

    public ComplaintService(ComplaintRepository complaintRepository,
            UserRepository userRepository,
            DepartmentRepository departmentRepository,
            NlpClientService nlpClientService) {
        this.complaintRepository = complaintRepository;
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.nlpClientService = nlpClientService;
    }

    // CREATE AUTO DETECT COMPLAINT
    public ComplaintResponseDTO createAutoDetectComplaint(AutomatedAlertDTO alertDTO) {
        Complaint complaint = new Complaint();
        complaint.setTitle("AI Auto-Detection: " + alertDTO.getEventName().toUpperCase());
        complaint.setDescription(
                String.format("Auto-generated complaint from AI detection: %s with confidence %.0f%% from %s source.",
                        alertDTO.getEventName().toUpperCase(),
                        alertDTO.getConfidence() * 100,
                        alertDTO.getSource() != null ? alertDTO.getSource() : "Camera"));

        complaint.setStatus("SUBMITTED");
        complaint.setPriority("HIGH");

        // Safety / Emergency flow
        if (alertDTO.getEventName().equalsIgnoreCase("fire") ||
                alertDTO.getEventName().equalsIgnoreCase("fighting") ||
                alertDTO.getEventName().equalsIgnoreCase("knife") ||
                alertDTO.getEventName().equalsIgnoreCase("gun")) {

            complaint.setCategory("Safety");
            complaint.setSuggestedDepartment("Admin");
            complaint.setStatus("ESCALATED");

            departmentRepository.findByDepartmentName("Admin")
                    .ifPresent(complaint::setDepartment);
        } else {
            // Unrecognized/Default
            complaint.setCategory("General");
            complaint.setSuggestedDepartment("Admin");
        }

        // Can optionally lookup a system user or attach null user.
        // Here we assign no user to represent a purely system-generated entity.
        Complaint saved = complaintRepository.save(complaint);
        return mapToDTO(saved);
    }

    // CREATE COMPLAINT
    public ComplaintResponseDTO createComplaint(String email, Complaint complaint) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        complaint.setUser(user);
        complaint.setStatus("SUBMITTED");

        // Default values in case AI fails
        if (complaint.getCategory() == null)
            complaint.setCategory("General");
        if (complaint.getPriority() == null)
            complaint.setPriority("LOW");

        Map<String, String> prediction = nlpClientService.getPrediction(complaint.getDescription());

        if (prediction != null) {

            String type = prediction.get("type");
            String category = prediction.get("category");
            String severity = prediction.get("severity");

            // SAFETY FLOW
            if ("SAFETY".equalsIgnoreCase(type)) {

                complaint.setCategory("Safety");
                complaint.setSuggestedDepartment("Admin");
                complaint.setPriority("HIGH");
                complaint.setStatus("ESCALATED");

                departmentRepository.findByDepartmentName("Admin")
                        .ifPresent(complaint::setDepartment);

            } else {

                // INFRA FLOW
                if (category != null && !isValidCategory(category)) {
                    // If AI predicted something invalid, fallback but keep trace
                    complaint.setCategory(category);
                } else if (category != null) {
                    complaint.setCategory(category);
                } else {
                    complaint.setCategory("General");
                }

                complaint.setSuggestedDepartment(complaint.getCategory());

                String mappedDept = mapCategoryToDepartment(complaint.getCategory());

                departmentRepository.findByDepartmentName(mappedDept)
                        .ifPresent(dept -> {
                            complaint.setDepartment(dept);
                            complaint.setStatus("ASSIGNED");
                        });

                if (severity != null) {
                    complaint.setPriority(mapSeverityToPriority(severity));
                } else if (complaint.getPriority() == null) {
                    complaint.setPriority("LOW");
                }

                if ("HIGH".equalsIgnoreCase(complaint.getPriority())) {
                    complaint.setStatus("ESCALATED");
                }
            }
        }

        Complaint saved = complaintRepository.save(complaint);
        return mapToDTO(saved);
    }

    // VALID CATEGORY
    private boolean isValidCategory(String category) {

        if (category == null)
            return false;

        return List.of(
                "supply",
                "water",
                "hostel",
                "network",
                "transport").contains(category.toLowerCase());
    }

    // USER COMPLAINTS
    public List<ComplaintResponseDTO> getUserComplaints(String email) {
        return complaintRepository.findDTOByEmail(email);
    }

    // ALL COMPLAINTS
    public List<ComplaintResponseDTO> getAllComplaints() {
        return complaintRepository.findAllOptimized();
    }

    // DEPARTMENT COMPLAINTS
    public List<ComplaintResponseDTO> getDepartmentComplaints(String email) {

        UserSummary user = userRepository.findSummaryByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Long deptId = user.getDepartmentId();
        if (deptId == null) {
            return List.of();
        }

        return complaintRepository.findDTOByDepartmentId(deptId);
    }

    // STATUS COUNTS
    public long getSubmittedCount() {
        return complaintRepository.countByStatus("SUBMITTED");
    }

    public long getInReviewCount() {
        return complaintRepository.countByStatus("IN_REVIEW");
    }

    public long getResolvedCount() {
        return complaintRepository.countByStatus("RESOLVED");
    }

    // CATEGORY → DEPT
    private String mapCategoryToDepartment(String category) {

        if (category == null)
            return "Electricity";

        return switch (category.toLowerCase()) {

            case "supply" -> "Electricity";
            case "water" -> "Water";
            case "hostel" -> "Hostel";
            case "network" -> "IT";
            case "transport" -> "Transport";

            default -> "Electricity";
        };
    }

    // SEVERITY → PRIORITY
    private String mapSeverityToPriority(String severity) {

        if (severity == null)
            return "LOW";

        return switch (severity.toUpperCase()) {

            case "HIGH" -> "HIGH";
            case "MEDIUM" -> "MEDIUM";
            case "LOW" -> "LOW";

            default -> "LOW";
        };
    }

    // DTO MAPPER
    private ComplaintResponseDTO mapToDTO(Complaint complaint) {

        String departmentName = null;

        if (complaint.getDepartment() != null) {
            departmentName = complaint.getDepartment().getDepartmentName();
        }

        return new ComplaintResponseDTO(
                complaint.getId(),
                complaint.getTitle(),
                complaint.getDescription(),
                complaint.getStatus(),
                departmentName,
                complaint.getCategory(),
                complaint.getSentiment(),
                complaint.getPriority(),
                complaint.getSuggestedDepartment());
    }
}
