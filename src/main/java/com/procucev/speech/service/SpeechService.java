package com.procucev.speech.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class SpeechService {
    private final RestClient restClient;

    public SpeechService(@Value("${speech.service.url}") String speechServiceUrl) {
        this.restClient = RestClient.builder().baseUrl(speechServiceUrl).build();
    }

    public String transcribe(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Audio file is empty.");
        }

        ByteArrayResource audio = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                String original = file.getOriginalFilename();
                return (original == null || original.isBlank()) ? "audio.webm" : original;
            }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", audio);

        try {
            TranscriptionResult result = restClient.post()
                    .uri("/transcribe")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(TranscriptionResult.class);

            return result == null || result.text() == null ? "" : result.text().trim();
        } catch (Exception ex) {
            throw new IllegalStateException("Speech recognition service is unavailable: " + ex.getMessage(), ex);
        }
    }

    public record TranscriptionResult(String text, String language) {}
}
