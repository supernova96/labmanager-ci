package com.university.labmanager.repository;

import com.university.labmanager.model.Software;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
// Force re-compile
public interface SoftwareRepository extends JpaRepository<Software, Long> {
    Optional<Software> findByNameAndVersion(String name, String version);

    Optional<Software> findByName(String name);
}
