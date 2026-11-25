package com.procucev.speech.controller;

import com.procucev.speech.dto.TranscriptionRequest;
import com.procucev.speech.dto.TranscriptionResponse;
import com.procucev.speech.service.SpeechService;
import com.procucev.speech.service.TranscriptionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transcriptions")
public class TranscriptionController {
    private final TranscriptionService transcriptionService;
    private final SpeechService speechService;

    public TranscriptionController(TranscriptionService transcriptionService, SpeechService speechService) {
        this.transcriptionService = transcriptionService;
        this.speechService = speechService;
    }

    @PostMapping(value = "/transcribe", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> transcribe(@RequestParam("file") MultipartFile file) throws IOException {
        try {
            return Map.of("text", speechService.transcribe(file));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        } catch (IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, ex.getMessage());
        }
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TranscriptionResponse create(@Valid @RequestBody TranscriptionRequest request) {
        return transcriptionService.create(request);
    }

    @GetMapping
    public List<TranscriptionResponse> getAll(@RequestParam(required = false) String search) {
        return transcriptionService.findAll(search);
    }

    @GetMapping("/{id}")
    public TranscriptionResponse getOne(@PathVariable Long id) {
        return transcriptionService.findById(id);
    }

    @PutMapping("/{id}")
    public TranscriptionResponse update(@PathVariable Long id,
                                        @Valid @RequestBody TranscriptionRequest request) {
        return transcriptionService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        transcriptionService.delete(id);
    }
}
