package com.icrs.backend.integration;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class AIService {

    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, String> analyzeComplaint(String description) {

        String aiApiUrl = "http://localhost:5000/analyze";

        Map<String, String> requestBody = Map.of(
                "text", description
        );

        return restTemplate.postForObject(aiApiUrl, requestBody, Map.class);
    }
}
