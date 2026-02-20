package com.university.labmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;
import lombok.Builder;

@Data
@AllArgsConstructor
@Builder
// Force re-compile
public class JwtResponse {
    private String token;
    private Long id;
    private String matricula;
    private String fullName;
    private List<String> roles;
    @com.fasterxml.jackson.annotation.JsonProperty("isSanctioned")
    private boolean isSanctioned;
}
