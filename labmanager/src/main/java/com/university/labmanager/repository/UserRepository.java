package com.university.labmanager.repository;

import com.university.labmanager.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository // Force re-compile
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByMatricula(String matricula);

    boolean existsByMatricula(String matricula);

    boolean existsByEmail(String email);

    // Helper for simple login by username/matricula/email if needed - for now just
    // matricula
    default Optional<User> findByUsername(String username) {
        return findByMatricula(username);
    }

    Optional<User> findByResetPasswordToken(String token);
}
