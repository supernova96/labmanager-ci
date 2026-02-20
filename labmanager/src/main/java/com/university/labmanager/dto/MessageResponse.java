package com.university.labmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder; // Added import for @Builder
import lombok.Data;

@Data
@Builder // Added @Builder annotation
@AllArgsConstructor
// Force re-compile
public class MessageResponse {
    private String message;
}
