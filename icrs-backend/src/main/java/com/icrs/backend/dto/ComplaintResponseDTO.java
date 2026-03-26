package com.icrs.backend.dto;

public class ComplaintResponseDTO {

    private Long id;
    private String title;
    private String description;
    private String status;
    private String departmentName;
    private String category;
    private String sentiment;
    private String priority;
    private String suggestedDepartment;

    public ComplaintResponseDTO() {}

    public ComplaintResponseDTO(Long id,
                                String title,
                                String description,
                                String status,
                                String departmentName,
                                String category,
                                String sentiment,
                                String priority,
                                String suggestedDepartment) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.status = status;
        this.departmentName = departmentName;
        this.category = category;
        this.sentiment = sentiment;
        this.priority = priority;
        this.suggestedDepartment = suggestedDepartment;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getStatus() {
        return status;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public String getCategory() {
        return category;
    }

    public String getSentiment() {
        return sentiment;
    }

    public String getPriority() {
        return priority;
    }

    public String getSuggestedDepartment() {
        return suggestedDepartment;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public void setSentiment(String sentiment) {
        this.sentiment = sentiment;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public void setSuggestedDepartment(String suggestedDepartment) {
        this.suggestedDepartment = suggestedDepartment;
    }
}
