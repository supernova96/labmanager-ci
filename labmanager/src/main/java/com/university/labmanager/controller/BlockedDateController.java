package com.university.labmanager.controller;

import com.university.labmanager.model.BlockedDate;
import com.university.labmanager.repository.BlockedDateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/admin/blocked-dates")
public class BlockedDateController {

    @Autowired
    private BlockedDateRepository blockedDateRepository;

    @GetMapping
    public List<BlockedDate> getAllBlockedDates() {
        return blockedDateRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addBlockedDate(@RequestBody BlockedDate blockedDate) {
        if (blockedDateRepository.existsByDate(blockedDate.getDate())) {
            return ResponseEntity.badRequest().body("Date is already blocked");
        }
        return ResponseEntity.ok(blockedDateRepository.save(blockedDate));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteBlockedDate(@PathVariable Long id) {
        if (!blockedDateRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        blockedDateRepository.deleteById(id);
        return ResponseEntity.ok("Blocked date removed");
    }
}
