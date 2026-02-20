package com.university.labmanager.controller;

import com.university.labmanager.dto.MessageResponse;
import com.university.labmanager.dto.SignupRequest;
import com.university.labmanager.model.User;
import com.university.labmanager.model.enums.Role;
import com.university.labmanager.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        if (userRepository.existsByMatricula(signUpRequest.getMatricula())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Matricula is already taken!"));
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is already in use!"));
        }

        java.util.Set<String> strRoles = signUpRequest.getRole();
        Role role = Role.ROLE_STUDENT;

        if (strRoles != null && !strRoles.isEmpty()) {
            if (strRoles.contains("admin")) {
                role = Role.ROLE_ADMIN;
            } else if (strRoles.contains("prof") || strRoles.contains("professor")) {
                role = Role.ROLE_PROFFESOR;
            }
        }

        User user = User.builder()
                .matricula(signUpRequest.getMatricula())
                .email(signUpRequest.getEmail())
                .fullName(signUpRequest.getFullName())
                .password(encoder.encode(signUpRequest.getPassword()))
                .role(role)
                .isSanctioned(false)
                .build();

        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }

    @Autowired
    com.university.labmanager.service.EmailService emailService;

    @PutMapping("/{id}/sanction")
    public ResponseEntity<?> toggleSanction(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error: User not found."));

        boolean newStatus = !user.isSanctioned();
        user.setSanctioned(newStatus);
        userRepository.save(user);

        if (newStatus) {
            // Send sanction notification
            emailService.sendSanctionNotification(user,
                    "Incumplimiento de normas del laboratorio (Sanción manual por administrador).");
        }

        return ResponseEntity.ok(new MessageResponse("User sanction status updated to: " + user.isSanctioned()));
    }
}
