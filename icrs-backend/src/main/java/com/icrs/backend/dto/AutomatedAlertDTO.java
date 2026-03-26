package com.icrs.backend.dto;

public class AutomatedAlertDTO {
    
    private String eventName;
    private double confidence;
    private String source; // e.g. "camera", "audio"

    public AutomatedAlertDTO() {}

    public AutomatedAlertDTO(String eventName, double confidence, String source) {
        this.eventName = eventName;
        this.confidence = confidence;
        this.source = source;
    }

    public String getEventName() { return eventName; }
    public void setEventName(String eventName) { this.eventName = eventName; }

    public double getConfidence() { return confidence; }
    public void setConfidence(double confidence) { this.confidence = confidence; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
}
