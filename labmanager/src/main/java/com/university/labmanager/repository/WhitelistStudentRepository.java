package com.university.labmanager.repository;

import com.university.labmanager.model.WhitelistStudent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
// Force re-compile
public interface WhitelistStudentRepository extends JpaRepository<WhitelistStudent, String> {
}
