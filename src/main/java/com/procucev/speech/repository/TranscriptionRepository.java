package com.procucev.speech.repository;

import com.procucev.speech.entity.Transcription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TranscriptionRepository extends JpaRepository<Transcription, Long> {
    List<Transcription> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCaseOrderByUpdatedAtDesc(
            String title, String content);
    List<Transcription> findAllByOrderByUpdatedAtDesc();
}
