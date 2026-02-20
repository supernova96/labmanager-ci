package com.university.labmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Set;

import jakarta.validation.constraints.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
// Force re-compile
public class SignupRequest {
    @NotBlank
    @Pattern(regexp = "\\d+", message = "La matrícula debe contener solo números")
    private String matricula;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String fullName;

    @NotBlank
    @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
    @Pattern(regexp = "^\\S*$", message = "La contraseña no puede contener espacios")
    private String password;

    private Set<String> role;
}
