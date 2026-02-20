package com.university.labmanager.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.util.FileCopyUtils;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;

@Component
public class DataInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public DataInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("=============================================");
        System.out.println(">>> DataInitializer: STARTING DB CHECK");
        System.out.println("=============================================");

        try {
            System.out.println(">>> CHECKING EXISTING TABLES:");
            try {
                jdbcTemplate.query("SHOW TABLES", (rs) -> {
                    System.out.println(">>> FOUND TABLE: " + rs.getString(1));
                });
            } catch (Exception e) {
                System.out.println(">>> Could not list tables: " + e.getMessage());
            }

            Integer count = 0;
            try {
                count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM app_users", Integer.class);
            } catch (Exception e) {
                System.out.println(">>> TABLE 'app_users' query failed. It might not exist yet. " + e.getMessage());
            }

            if (count != null && count == 0) {
                System.out.println(">>> DataInitializer: Table empty (or missing). Attempting to load import.sql...");
                loadImportSql();
            } else {
                System.out.println(">>> DataInitializer: Users found (" + count + "). Skipping import.sql.");
            }

            // CRITICAL: Ensure Admin always exists and has known password
            Integer adminCount = 0;
            try {
                adminCount = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM app_users WHERE matricula = 'admin'", Integer.class);
            } catch (Exception e) {
                System.out.println(">>> Admin check failed. " + e.getMessage());
            }

            String encodedPassword = passwordEncoder.encode("password");

            if (adminCount == null || adminCount == 0) {
                System.out.println(">>> DataInitializer: Admin user NOT found. Creating emergency admin...");
                try {
                    jdbcTemplate.update(
                            "INSERT INTO app_users (matricula, full_name, email, password, role, is_sanctioned) VALUES (?, ?, ?, ?, ?, ?)",
                            "admin", "Super Admin", "admin@university.edu", encodedPassword, "ROLE_ADMIN", false);
                    System.out.println(">>> DataInitializer: Admin created successfully.");
                } catch (Exception e) {
                    System.out.println(">>> Failed to insert Admin. " + e.getMessage());
                }
            } else {
                // Reset password just in case
                jdbcTemplate.update("UPDATE app_users SET password = ? WHERE matricula = 'admin'", encodedPassword);
                System.out.println(">>> DataInitializer: Admin password FORCE RESET to 'password'.");
            }

            System.out.println("=============================================");
            System.out.println(">>> LOGIN CREDENTIALS: admin / password");
            System.out.println("=============================================");

        } catch (Exception e) {
            System.err.println(">>> DataInitializer: CRITICAL ERROR: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void loadImportSql() throws Exception {
        ClassPathResource resource = new ClassPathResource("import.sql");
        if (!resource.exists()) {
            System.out.println(">>> DataInitializer: import.sql NOT FOUND!");
            return;
        }

        byte[] bdata = FileCopyUtils.copyToByteArray(resource.getInputStream());
        String data = new String(bdata, StandardCharsets.UTF_8);

        String[] statements = data.split(";");
        for (String sql : statements) {
            if (!sql.trim().isEmpty()) {
                try {
                    jdbcTemplate.execute(sql.trim());
                } catch (Exception ex) {
                    // Ignore common errors like uniqueness in case of partial load
                    System.out.println(">>> DataInitializer warn: " + ex.getMessage());
                }
            }
        }
        System.out.println(">>> DataInitializer: import.sql loaded.");
    }
}
