package com.procucev.speech.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TranscriptionRequest(
        @NotBlank @Size(max = 150) String title,
        @NotBlank String content
) {}
