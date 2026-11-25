package com.procucev.speech.dto;

import com.procucev.speech.entity.Transcription;
import java.time.LocalDateTime;

public record TranscriptionResponse(
        Long id, String title, String content,
        LocalDateTime createdAt, LocalDateTime updatedAt
) {
    public static TranscriptionResponse from(Transcription t) {
        return new TranscriptionResponse(t.getId(), t.getTitle(), t.getContent(),
                t.getCreatedAt(), t.getUpdatedAt());
    }
}
