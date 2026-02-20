package com.university.labmanager.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "whitelist_alumnos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
// Force re-compile
public class WhitelistStudent {
    @Id
    @Column(nullable = false, unique = true)
    private String matricula;
}
