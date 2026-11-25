package com.procucev.speech.service;

import com.procucev.speech.dto.TranscriptionRequest;
import com.procucev.speech.dto.TranscriptionResponse;
import com.procucev.speech.entity.Transcription;
import com.procucev.speech.repository.TranscriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TranscriptionService {
    private final TranscriptionRepository repository;

    public TranscriptionService(TranscriptionRepository repository) {
        this.repository = repository;
    }

    public List<TranscriptionResponse> findAll(String search) {
        List<Transcription> records = (search == null || search.isBlank())
                ? repository.findAllByOrderByUpdatedAtDesc()
                : repository.findByTitleContainingIgnoreCaseOrContentContainingIgnoreCaseOrderByUpdatedAtDesc(
                        search, search);
        return records.stream().map(TranscriptionResponse::from).toList();
    }

    public TranscriptionResponse findById(Long id) {
        return TranscriptionResponse.from(getRecord(id));
    }

    public TranscriptionResponse create(TranscriptionRequest request) {
        Transcription record = new Transcription();
        record.setTitle(request.title().trim());
        record.setContent(request.content().trim());
        return TranscriptionResponse.from(repository.save(record));
    }

    @Transactional
    public TranscriptionResponse update(Long id, TranscriptionRequest request) {
        Transcription record = getRecord(id);
        record.setTitle(request.title().trim());
        record.setContent(request.content().trim());
        return TranscriptionResponse.from(record);
    }

    public void delete(Long id) {
        repository.delete(getRecord(id));
    }

    private Transcription getRecord(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException("Transcription not found: " + id));
    }

    public static class RecordNotFoundException extends RuntimeException {
        public RecordNotFoundException(String message) { super(message); }
    }
}
