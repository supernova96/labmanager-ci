package com.university.labmanager.model;

import com.university.labmanager.model.enums.LaptopStatus;
import jakarta.persistence.*;
import lombok.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "laptops")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
// Force re-compile
public class Laptop {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String serialNumber;

    @Column(nullable = false)
    private String model;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LaptopStatus status;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "laptop_software", joinColumns = @JoinColumn(name = "laptop_id"), inverseJoinColumns = @JoinColumn(name = "software_id"))
    private Set<Software> installedSoftware = new HashSet<>();

    public void addSoftware(Software software) {
        this.installedSoftware.add(software);
    }
}
