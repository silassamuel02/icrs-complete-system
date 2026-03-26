package com.icrs.backend.service;

import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class NlpClientService {

    private final RestTemplate restTemplate;

    public NlpClientService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public Map<String, String> getPrediction(String description) {

        String url = "http://127.0.0.1:8000/predict";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> requestBody = Map.of(
                "description", description);

        HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            return response.getBody();
        } catch (Exception e) {
            System.err.println("AI Prediction Service unreachable: " + e.getMessage());
            return Map.of("category", "General", "type", "INFRA", "severity", "LOW");
        }
    }
}
