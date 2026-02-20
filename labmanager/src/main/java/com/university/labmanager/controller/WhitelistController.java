package com.university.labmanager.controller;

import com.university.labmanager.model.WhitelistStudent;
import com.university.labmanager.repository.WhitelistStudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/admin/whitelist")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class WhitelistController {

    private final WhitelistStudentRepository whitelistRepository;

    @GetMapping
    public ResponseEntity<List<WhitelistStudent>> getAllWhitelistedStudents() {
        return ResponseEntity.ok(whitelistRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<?> addStudentToWhitelist(@RequestBody Map<String, String> payload) {
        String matricula = payload.get("matricula");
        if (matricula == null || matricula.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Matricula is required");
        }

        if (whitelistRepository.existsById(matricula)) {
            return ResponseEntity.badRequest().body("Matricula already in whitelist");
        }

        WhitelistStudent student = WhitelistStudent.builder()
                .matricula(matricula)
                .build();

        whitelistRepository.save(student);
        return ResponseEntity.ok("Matricula added to whitelist");
    }

    @DeleteMapping("/{matricula}")
    public ResponseEntity<?> removeStudentFromWhitelist(@PathVariable String matricula) {
        if (!whitelistRepository.existsById(matricula)) {
            return ResponseEntity.badRequest().body("Matricula not found in whitelist");
        }

        whitelistRepository.deleteById(matricula);
        return ResponseEntity.ok("Matricula removed from whitelist");
    }
}
