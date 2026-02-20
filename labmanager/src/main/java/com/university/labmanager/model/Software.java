package com.university.labmanager.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "software")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
// Force re-compile
public class Software {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String version;
}
