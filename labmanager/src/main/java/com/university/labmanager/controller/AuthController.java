package com.university.labmanager.controller;

import com.university.labmanager.dto.JwtResponse;
import com.university.labmanager.dto.LoginRequest;
import com.university.labmanager.dto.MessageResponse;
import com.university.labmanager.dto.SignupRequest;
import com.university.labmanager.model.User;
import com.university.labmanager.model.enums.Role;
import com.university.labmanager.repository.UserRepository;
import com.university.labmanager.repository.WhitelistStudentRepository;
import com.university.labmanager.security.JwtUtils;
import com.university.labmanager.security.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
// Force re-compile
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    WhitelistStudentRepository whitelistStudentRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getMatricula(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

        return ResponseEntity.ok(new JwtResponse(jwt,
                userDetails.getId(),
                userDetails.getMatricula(),
                userDetails.getFullName(),
                roles,
                userDetails.isSanctioned()));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        if (userRepository.existsByMatricula(signUpRequest.getMatricula())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: ¡La matrícula ya está registrada!"));
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: ¡El correo electrónico ya está en uso!"));
        }

        // CRITICAL BUSINESS RULE: Verify Whitelist
        if (!whitelistStudentRepository.existsById(signUpRequest.getMatricula())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse(
                            "Error: Matrícula NO permitida en la lista blanca. Contacta al Administrador."));
        }

        // Create new user's account
        User user = User.builder()
                .matricula(signUpRequest.getMatricula())
                .email(signUpRequest.getEmail())
                .fullName(signUpRequest.getFullName())
                .password(encoder.encode(signUpRequest.getPassword()))
                .role(Role.ROLE_STUDENT) // Default
                .isSanctioned(false)
                .build();

        // Basic Role Handling (Only Student for now based on prompt, but Admin can be
        // added manually)
        if (signUpRequest.getRole() != null && signUpRequest.getRole().contains("admin")) {
            user.setRole(Role.ROLE_ADMIN);
        }

        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("¡Usuario registrado exitosamente!"));
    }

    @Autowired
    com.university.labmanager.service.EmailService emailService;

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody java.util.Map<String, String> request) {
        String email = request.get("email");
        System.out.println(">>> FORGOT PASSWORD REQUEST: " + email);

        com.university.labmanager.model.User user = userRepository.findAll().stream()
                .filter(u -> u.getEmail() != null && u.getEmail().equalsIgnoreCase(email))
                .findFirst()
                .orElse(null);

        System.out.println(">>> User found: " + (user != null ? user.getId() : "null"));

        // Security: Don't reveal if user exists. Always say "If email exists..."
        if (user != null) {
            String token = java.util.UUID.randomUUID().toString();
            user.setResetPasswordToken(token);
            user.setResetPasswordTokenExpiry(java.time.LocalDateTime.now().plusMinutes(30));
            userRepository.save(user); // Important: User entity must have these fields
            System.out.println(">>> Token saved for user " + user.getId() + ": " + token);
            emailService.sendPasswordResetLink(user.getEmail(), token);
        }

        return ResponseEntity
                .ok(new MessageResponse(
                        "Si existe una cuenta con este correo, se ha enviado un enlace de restablecimiento."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody java.util.Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");

        System.out.println(">>> RESET PASSWORD REQUEST. Token: " + token);

        com.university.labmanager.model.User user = userRepository.findByResetPasswordToken(token)
                .orElse(null);

        System.out.println(">>> User found by token: " + (user != null ? user.getId() : "null"));

        if (user != null) {
            System.out.println(">>> Expiry time: " + user.getResetPasswordTokenExpiry());
            System.out.println(">>> Current time: " + java.time.LocalDateTime.now());
        }

        if (user == null || user.getResetPasswordTokenExpiry().isBefore(java.time.LocalDateTime.now())) {
            System.out.println(">>> VALIDATION FAILED: User null or Token expired");
            return ResponseEntity.badRequest().body(new MessageResponse("Token inválido o expirado."));
        }

        user.setPassword(encoder.encode(newPassword));
        user.setResetPasswordToken(null);
        user.setResetPasswordTokenExpiry(null);
        userRepository.save(user);

        System.out.println(">>> PASSWORD RESET SUCCESSFUL for user " + user.getId());

        return ResponseEntity
                .ok(new MessageResponse("Contraseña restablecida correctamente. Ya puedes iniciar sesión."));
    }
}
