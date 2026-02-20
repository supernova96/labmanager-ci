-- ==========================================
-- ESTRUCTURA DE BASE DE DATOS (Solo Schema)
-- Generado para LabManager - Para Diagrama ER
-- ==========================================

-- 1. Tablas Independientes

CREATE TABLE IF NOT EXISTS whitelist_alumnos (
    matricula VARCHAR(255) NOT NULL,
    PRIMARY KEY (matricula)
);

CREATE TABLE IF NOT EXISTS blocked_dates (
    id BIGINT AUTO_INCREMENT NOT NULL,
    date DATE NOT NULL,
    reason VARCHAR(255),
    PRIMARY KEY (id),
    CONSTRAINT UQ_BlockedDates_Date UNIQUE (date)
);

CREATE TABLE IF NOT EXISTS software (
    id BIGINT AUTO_INCREMENT NOT NULL,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT UQ_Software_Name UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS laptops (
    id BIGINT AUTO_INCREMENT NOT NULL,
    serial_number VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('AVAILABLE','IN_USE','EN_REPARACION','INACTIVE','MAINTENANCE_REQUIRED')),
    PRIMARY KEY (id),
    CONSTRAINT UQ_Laptops_Serial UNIQUE (serial_number)
);

CREATE TABLE IF NOT EXISTS app_users (
    id BIGINT AUTO_INCREMENT NOT NULL,
    matricula VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ROLE_STUDENT','ROLE_ADMIN','ROLE_PROFFESOR')),
    is_sanctioned BOOLEAN DEFAULT FALSE,
    reset_password_token VARCHAR(255),
    reset_password_token_expiry DATETIME(6),
    PRIMARY KEY (id),
    CONSTRAINT UQ_Users_Matricula UNIQUE (matricula),
    CONSTRAINT UQ_Users_Email UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS system_logs (
    id BIGINT AUTO_INCREMENT NOT NULL,
    timestamp DATETIME(6) NOT NULL,
    level VARCHAR(50) NOT NULL CHECK (level IN ('INFO','WARN','ERROR')),
    category VARCHAR(255),
    message VARCHAR(2000),
    username VARCHAR(255),
    PRIMARY KEY (id)
);

-- 2. Tablas Dependientes (Relaciones)

CREATE TABLE IF NOT EXISTS reservations (
    id BIGINT AUTO_INCREMENT NOT NULL,
    user_id BIGINT NOT NULL,
    laptop_id BIGINT NOT NULL,
    start_time DATETIME(6) NOT NULL,
    end_time DATETIME(6) NOT NULL,
    subject VARCHAR(255),
    professor VARCHAR(255),
    status VARCHAR(50) NOT NULL CHECK (status IN ('ACTIVE','COMPLETED','CANCELLED','OVERDUE','APPROVED')),
    batch_id VARCHAR(255),
    rating INT,
    feedback VARCHAR(1000),
    PRIMARY KEY (id),
    CONSTRAINT FK_Reservations_User FOREIGN KEY (user_id) REFERENCES app_users (id),
    CONSTRAINT FK_Reservations_Laptop FOREIGN KEY (laptop_id) REFERENCES laptops (id)
);

CREATE TABLE IF NOT EXISTS incidents (
    id BIGINT AUTO_INCREMENT NOT NULL,
    description VARCHAR(255) NOT NULL,
    reported_at DATETIME(6) NOT NULL,
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    laptop_id BIGINT,
    reporter_id BIGINT,
    resolved BOOLEAN DEFAULT FALSE,
    report_type VARCHAR(255),
    location VARCHAR(255),
    evidence_path VARCHAR(255),
    PRIMARY KEY (id),
    CONSTRAINT FK_Incidents_Laptop FOREIGN KEY (laptop_id) REFERENCES laptops (id),
    CONSTRAINT FK_Incidents_Reporter FOREIGN KEY (reporter_id) REFERENCES app_users (id)
);

CREATE TABLE IF NOT EXISTS laptop_software (
    laptop_id BIGINT NOT NULL,
    software_id BIGINT NOT NULL,
    PRIMARY KEY (laptop_id, software_id),
    CONSTRAINT FK_LaptopSoftware_Laptop FOREIGN KEY (laptop_id) REFERENCES laptops (id),
    CONSTRAINT FK_LaptopSoftware_Software FOREIGN KEY (software_id) REFERENCES software (id)
);
