package com.university.labmanager.controller;

import com.university.labmanager.model.Laptop;
import com.university.labmanager.service.ReservationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/laptops")
public class LaptopController {

    @Autowired
    ReservationService reservationService;

    @GetMapping("/search")
    public ResponseEntity<List<Laptop>> searchLaptops(
            @RequestParam String software,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {

        List<Laptop> available = reservationService.findSmartOptions(software, start, end);
        return ResponseEntity.ok(available);
    }

    @GetMapping("/all")
    public ResponseEntity<List<Laptop>> getAllLaptops() {
        return ResponseEntity.ok(reservationService.findAllLaptops());
    }

    @PostMapping
    public ResponseEntity<Laptop> createLaptop(@RequestBody Laptop laptop) {
        try {
            System.out.println(">>> DEBUG: Creating Laptop: " + laptop);
            return ResponseEntity.ok(reservationService.saveLaptop(laptop));
        } catch (Exception e) {
            System.err.println(">>> ERROR CREATING LAPTOP: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Laptop> updateLaptop(@PathVariable Long id, @RequestBody Laptop laptop) {
        laptop.setId(id);
        return ResponseEntity.ok(reservationService.saveLaptop(laptop));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteLaptop(@PathVariable Long id) {
        reservationService.deleteLaptop(id);
        return ResponseEntity.ok().build();
    }
}
