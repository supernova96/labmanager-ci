-- ==========================================
-- SCRIPT DE BASE DE DATOS COMPLETO (Schema + Data)
-- Generado para LabManager
-- ==========================================

-- 1. LIMPIEZA (Opcional - Descomentar si se desea reiniciar la DB)
-- DROP TABLE IF EXISTS laptop_software;
-- DROP TABLE IF EXISTS reservations;
-- DROP TABLE IF EXISTS incidents;
-- DROP TABLE IF EXISTS system_logs;
-- DROP TABLE IF EXISTS users; -- Legacy table name
-- DROP TABLE IF EXISTS app_users;
-- DROP TABLE IF EXISTS laptops;
-- DROP TABLE IF EXISTS software;
-- DROP TABLE IF EXISTS blocked_dates;
-- DROP TABLE IF EXISTS whitelist_alumnos;

-- ==========================================
-- 2. CREACIÓN DE TABLAS
-- ==========================================

-- Whitelist
CREATE TABLE IF NOT EXISTS whitelist_alumnos (
    matricula VARCHAR(255) NOT NULL,
    PRIMARY KEY (matricula)
);

-- Blocked Dates
CREATE TABLE IF NOT EXISTS blocked_dates (
    id BIGINT AUTO_INCREMENT NOT NULL,
    date DATE NOT NULL,
    reason VARCHAR(255),
    PRIMARY KEY (id),
    CONSTRAINT UQ_BlockedDates_Date UNIQUE (date)
);

-- Software
CREATE TABLE IF NOT EXISTS software (
    id BIGINT AUTO_INCREMENT NOT NULL,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT UQ_Software_Name UNIQUE (name)
);

-- Laptops
CREATE TABLE IF NOT EXISTS laptops (
    id BIGINT AUTO_INCREMENT NOT NULL,
    serial_number VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('AVAILABLE','IN_USE','EN_REPARACION','INACTIVE','MAINTENANCE_REQUIRED')),
    PRIMARY KEY (id),
    CONSTRAINT UQ_Laptops_Serial UNIQUE (serial_number)
);

-- Users (Table name: app_users to avoid reserved word conflict)
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

-- System Logs
CREATE TABLE IF NOT EXISTS system_logs (
    id BIGINT AUTO_INCREMENT NOT NULL,
    timestamp DATETIME(6) NOT NULL,
    level VARCHAR(50) NOT NULL CHECK (level IN ('INFO','WARN','ERROR')),
    category VARCHAR(255),
    message VARCHAR(2000),
    username VARCHAR(255),
    PRIMARY KEY (id)
);

-- Reservations
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

-- Incidents
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

-- Laptop_Software (Join Table)
CREATE TABLE IF NOT EXISTS laptop_software (
    laptop_id BIGINT NOT NULL,
    software_id BIGINT NOT NULL,
    PRIMARY KEY (laptop_id, software_id),
    CONSTRAINT FK_LaptopSoftware_Laptop FOREIGN KEY (laptop_id) REFERENCES laptops (id),
    CONSTRAINT FK_LaptopSoftware_Software FOREIGN KEY (software_id) REFERENCES software (id)
);

-- ==========================================
-- 3. INSERTAR DATOS INICIALES (SEEDING)
-- ==========================================

-- Whitelist
INSERT INTO whitelist_alumnos (matricula) VALUES ('A00123456');
INSERT INTO whitelist_alumnos (matricula) VALUES ('A00987654');
INSERT INTO whitelist_alumnos (matricula) VALUES ('A00555555');
INSERT INTO whitelist_alumnos (matricula) VALUES ('A00112233');
INSERT INTO whitelist_alumnos (matricula) VALUES ('A00101010');
INSERT INTO whitelist_alumnos (matricula) VALUES ('A00202020');
INSERT INTO whitelist_alumnos (matricula) VALUES ('A00303030');
INSERT INTO whitelist_alumnos (matricula) VALUES ('admin');

-- App Users
-- Password es 'password' hasheado con BCrypt
INSERT INTO app_users (matricula, full_name, email, password, role, is_sanctioned) VALUES ('admin', 'Administrador del Sistema', 'admin@test.com', '$2a$10$slYQmyNdGzTn7ZLBXBChFOC9f6kFjAqPhccnP6DxlWXx2lPk1C3G6', 'ROLE_ADMIN', false);
INSERT INTO app_users (matricula, full_name, email, password, role, is_sanctioned) VALUES ('A00123456', 'Juan Pérez González', 'juan@test.com', '$2a$10$slYQmyNdGzTn7ZLBXBChFOC9f6kFjAqPhccnP6DxlWXx2lPk1C3G6', 'ROLE_STUDENT', false);
INSERT INTO app_users (matricula, full_name, email, password, role, is_sanctioned) VALUES ('A00987654', 'María Rodríguez', 'maria@test.com', '$2a$10$slYQmyNdGzTn7ZLBXBChFOC9f6kFjAqPhccnP6DxlWXx2lPk1C3G6', 'ROLE_STUDENT', true);
INSERT INTO app_users (matricula, full_name, email, password, role, is_sanctioned) VALUES ('A00555555', 'Carlos López Martínez', 'carlos@test.com', '$2a$10$slYQmyNdGzTn7ZLBXBChFOC9f6kFjAqPhccnP6DxlWXx2lPk1C3G6', 'ROLE_STUDENT', false);
INSERT INTO app_users (matricula, full_name, email, password, role, is_sanctioned) VALUES ('A00112233', 'Ana García Fernández', 'ana@test.com', '$2a$10$slYQmyNdGzTn7ZLBXBChFOC9f6kFjAqPhccnP6DxlWXx2lPk1C3G6', 'ROLE_STUDENT', false);
INSERT INTO app_users (matricula, full_name, email, password, role, is_sanctioned) VALUES ('A00101010', 'Pedro Martínez Ruiz', 'pedro@test.com', '$2a$10$slYQmyNdGzTn7ZLBXBChFOC9f6kFjAqPhccnP6DxlWXx2lPk1C3G6', 'ROLE_STUDENT', false);
INSERT INTO app_users (matricula, full_name, email, password, role, is_sanctioned) VALUES ('A00202020', 'Laura Torres Sánchez', 'laura@test.com', '$2a$10$slYQmyNdGzTn7ZLBXBChFOC9f6kFjAqPhccnP6DxlWXx2lPk1C3G6', 'ROLE_STUDENT', false);
INSERT INTO app_users (matricula, full_name, email, password, role, is_sanctioned) VALUES ('P001', 'Dr. Roberto Hernández', 'roberto@test.com', '$2a$10$slYQmyNdGzTn7ZLBXBChFOC9f6kFjAqPhccnP6DxlWXx2lPk1C3G6', 'ROLE_PROFFESOR', false);

-- Software
INSERT INTO software (name, version) VALUES ('Android Studio', '2023.1');
INSERT INTO software (name, version) VALUES ('Visual Studio Code', '1.85');
INSERT INTO software (name, version) VALUES ('Docker Desktop', '4.26');
INSERT INTO software (name, version) VALUES ('IntelliJ IDEA', '2023.3');
INSERT INTO software (name, version) VALUES ('PostgreSQL', '16');
INSERT INTO software (name, version) VALUES ('Unity Hub', '2023.2');
INSERT INTO software (name, version) VALUES ('Python', '3.12');
INSERT INTO software (name, version) VALUES ('Node.js', '20.0 LTS');
INSERT INTO software (name, version) VALUES ('Xcode', '15.0');

-- Laptops
INSERT INTO laptops (serial_number, model, status) VALUES ('LPT-HIGH-001', 'Dell XPS 15 (i9, 32GB)', 'AVAILABLE');
INSERT INTO laptops (serial_number, model, status) VALUES ('LPT-HIGH-002', 'MacBook Pro M3 Max', 'AVAILABLE');
INSERT INTO laptops (serial_number, model, status) VALUES ('LPT-HIGH-003', 'Alienware m15', 'AVAILABLE');
INSERT INTO laptops (serial_number, model, status) VALUES ('LPT-HIGH-004', 'Asus ROG Zephyrus', 'IN_USE');
INSERT INTO laptops (serial_number, model, status) VALUES ('LPT-STD-001', 'MacBook Air M2', 'AVAILABLE');
INSERT INTO laptops (serial_number, model, status) VALUES ('LPT-STD-002', 'Lenovo ThinkPad T14', 'IN_USE');
INSERT INTO laptops (serial_number, model, status) VALUES ('LPT-STD-003', 'Dell Latitude', 'AVAILABLE');
INSERT INTO laptops (serial_number, model, status) VALUES ('LPT-STD-004', 'HP EliteBook 840', 'AVAILABLE');
INSERT INTO laptops (serial_number, model, status) VALUES ('LPT-STD-005', 'Acer Swift 5', 'IN_USE');
INSERT INTO laptops (serial_number, model, status) VALUES ('LPT-SRV-001', 'ThinkPad X1 Carbon', 'AVAILABLE');
INSERT INTO laptops (serial_number, model, status) VALUES ('LPT-SRV-002', 'HP EliteBook', 'AVAILABLE');
INSERT INTO laptops (serial_number, model, status) VALUES ('LPT-SRV-003', 'System76 Lemur Pro', 'AVAILABLE');
INSERT INTO laptops (serial_number, model, status) VALUES ('LPT-BROKEN-01', 'HP Pavilion Legacy', 'EN_REPARACION');
INSERT INTO laptops (serial_number, model, status) VALUES ('LPT-BROKEN-02', 'Dell Inspiron', 'MAINTENANCE_REQUIRED');
INSERT INTO laptops (serial_number, model, status) VALUES ('LPT-LOST-01', 'MacBook Pro 2019', 'INACTIVE');

-- Laptop Software
INSERT INTO laptop_software (laptop_id, software_id) VALUES (1, 1);
INSERT INTO laptop_software (laptop_id, software_id) VALUES (1, 2);
INSERT INTO laptop_software (laptop_id, software_id) VALUES (1, 4);
INSERT INTO laptop_software (laptop_id, software_id) VALUES (2, 9);
INSERT INTO laptop_software (laptop_id, software_id) VALUES (2, 2);
INSERT INTO laptop_software (laptop_id, software_id) VALUES (3, 6);
INSERT INTO laptop_software (laptop_id, software_id) VALUES (3, 2);
INSERT INTO laptop_software (laptop_id, software_id) VALUES (5, 2);
INSERT INTO laptop_software (laptop_id, software_id) VALUES (5, 8);
INSERT INTO laptop_software (laptop_id, software_id) VALUES (6, 2);
INSERT INTO laptop_software (laptop_id, software_id) VALUES (6, 7);
INSERT INTO laptop_software (laptop_id, software_id) VALUES (7, 2);
INSERT INTO laptop_software (laptop_id, software_id) VALUES (7, 8);
INSERT INTO laptop_software (laptop_id, software_id) VALUES (8, 2);
INSERT INTO laptop_software (laptop_id, software_id) VALUES (9, 2);
INSERT INTO laptop_software (laptop_id, software_id) VALUES (10, 3);
INSERT INTO laptop_software (laptop_id, software_id) VALUES (10, 5);
INSERT INTO laptop_software (laptop_id, software_id) VALUES (11, 3);

-- Reservations
INSERT INTO reservations (user_id, laptop_id, start_time, end_time, status, subject, professor, batch_id) VALUES (2, 5, DATEADD('DAY', -6, CURRENT_TIMESTAMP), DATEADD('DAY', -6, DATEADD('HOUR', 2, CURRENT_TIMESTAMP)), 'COMPLETED', 'Programación Web', 'Dr. Hernández', 'RES-001');
INSERT INTO reservations (user_id, laptop_id, start_time, end_time, status, subject, professor, batch_id) VALUES (4, 6, DATEADD('DAY', -6, CURRENT_TIMESTAMP), DATEADD('DAY', -6, DATEADD('HOUR', 3, CURRENT_TIMESTAMP)), 'COMPLETED', 'Bases de Datos', 'Dra. López', 'RES-002');
INSERT INTO reservations (user_id, laptop_id, start_time, end_time, status, subject, professor, batch_id) VALUES (5, 7, DATEADD('DAY', -5, CURRENT_TIMESTAMP), DATEADD('DAY', -5, DATEADD('HOUR', 4, CURRENT_TIMESTAMP)), 'COMPLETED', 'Redes', 'Ing. García', 'RES-003');
INSERT INTO reservations (user_id, laptop_id, start_time, end_time, status, subject, professor, batch_id) VALUES (6, 1, DATEADD('DAY', -5, CURRENT_TIMESTAMP), DATEADD('DAY', -5, DATEADD('HOUR', 2, CURRENT_TIMESTAMP)), 'COMPLETED', 'Desarrollo Móvil', 'Dr. Hernández', 'RES-004');
INSERT INTO reservations (user_id, laptop_id, start_time, end_time, status, subject, professor, batch_id) VALUES (2, 2, DATEADD('DAY', -5, CURRENT_TIMESTAMP), DATEADD('DAY', -5, DATEADD('HOUR', 1, CURRENT_TIMESTAMP)), 'COMPLETED', 'iOS Dev', 'Dr. Hernández', 'RES-005');
INSERT INTO reservations (user_id, laptop_id, start_time, end_time, status, subject, professor, batch_id) VALUES (4, 10, DATEADD('DAY', -4, CURRENT_TIMESTAMP), DATEADD('DAY', -4, DATEADD('HOUR', 5, CURRENT_TIMESTAMP)), 'COMPLETED', 'DevOps', 'Ing. Martínez', 'RES-006');
INSERT INTO reservations (user_id, laptop_id, start_time, end_time, status, subject, professor, batch_id) VALUES (5, 5, DATEADD('DAY', -4, CURRENT_TIMESTAMP), DATEADD('DAY', -4, DATEADD('HOUR', 2, CURRENT_TIMESTAMP)), 'COMPLETED', 'Programación Web', 'Dr. Hernández', 'RES-007');
INSERT INTO reservations (user_id, laptop_id, start_time, end_time, status, subject, professor, batch_id) VALUES (6, 3, DATEADD('DAY', -3, CURRENT_TIMESTAMP), DATEADD('DAY', -3, DATEADD('HOUR', 3, CURRENT_TIMESTAMP)), 'COMPLETED', 'Gráficas Computacionales', 'Dra. Ruiz', 'RES-008');
INSERT INTO reservations (user_id, laptop_id, start_time, end_time, status, subject, professor, batch_id) VALUES (7, 4, DATEADD('DAY', -3, CURRENT_TIMESTAMP), DATEADD('DAY', -3, DATEADD('HOUR', 2, CURRENT_TIMESTAMP)), 'COMPLETED', 'Algoritmos', 'Dr. Pérez', 'RES-009');
INSERT INTO reservations (user_id, laptop_id, start_time, end_time, status, subject, professor, batch_id) VALUES (2, 11, DATEADD('DAY', -3, CURRENT_TIMESTAMP), DATEADD('DAY', -3, DATEADD('HOUR', 1, CURRENT_TIMESTAMP)), 'COMPLETED', 'Sistemas Operativos', 'Ing. García', 'RES-010');
INSERT INTO reservations (user_id, laptop_id, start_time, end_time, status, subject, professor, batch_id) VALUES (4, 1, DATEADD('DAY', -3, CURRENT_TIMESTAMP), DATEADD('DAY', -3, DATEADD('HOUR', 4, CURRENT_TIMESTAMP)), 'COMPLETED', 'Android Studio', 'Dr. Hernández', 'RES-011');
INSERT INTO reservations (user_id, laptop_id, start_time, end_time, status, subject, professor, batch_id) VALUES (5, 8, DATEADD('DAY', -2, CURRENT_TIMESTAMP), DATEADD('DAY', -2, DATEADD('HOUR', 2, CURRENT_TIMESTAMP)), 'COMPLETED', 'Programación Web', 'Dr. Hernández', 'RES-012');
INSERT INTO reservations (user_id, laptop_id, start_time, end_time, status, subject, professor, batch_id) VALUES (6, 9, DATEADD('DAY', -2, CURRENT_TIMESTAMP), DATEADD('DAY', -2, DATEADD('HOUR', 3, CURRENT_TIMESTAMP)), 'COMPLETED', 'Proyecto Final', 'Dra. López', 'RES-013');
INSERT INTO reservations (user_id, laptop_id, start_time, end_time, status, subject, professor, batch_id) VALUES (2, 2, DATEADD('DAY', -1, CURRENT_TIMESTAMP), DATEADD('DAY', -1, DATEADD('HOUR', 2, CURRENT_TIMESTAMP)), 'COMPLETED', 'iOS Dev', 'Dr. Hernández', 'RES-014');
INSERT INTO reservations (user_id, laptop_id, start_time, end_time, status, subject, professor, batch_id) VALUES (7, 10, DATEADD('DAY', -1, CURRENT_TIMESTAMP), DATEADD('DAY', -1, DATEADD('HOUR', 4, CURRENT_TIMESTAMP)), 'COMPLETED', 'DevOps', 'Ing. Martínez', 'RES-015');
INSERT INTO reservations (user_id, laptop_id, start_time, end_time, status, subject, professor, batch_id) VALUES (2, 6, DATEADD('MINUTE', -30, CURRENT_TIMESTAMP), DATEADD('HOUR', 2, CURRENT_TIMESTAMP), 'ACTIVE', 'Bases de Datos', 'Dra. López', 'RES-016');
INSERT INTO reservations (user_id, laptop_id, start_time, end_time, status, subject, professor, batch_id) VALUES (4, 4, DATEADD('MINUTE', -15, CURRENT_TIMESTAMP), DATEADD('HOUR', 2, CURRENT_TIMESTAMP), 'ACTIVE', 'Algoritmos', 'Dr. Pérez', 'RES-017');
INSERT INTO reservations (user_id, laptop_id, start_time, end_time, status, subject, professor, batch_id) VALUES (5, 9, DATEADD('MINUTE', -45, CURRENT_TIMESTAMP), DATEADD('HOUR', 2, CURRENT_TIMESTAMP), 'ACTIVE', 'Proyecto Final', 'Dra. López', 'RES-018');
INSERT INTO reservations (user_id, laptop_id, start_time, end_time, status, subject, professor, batch_id) VALUES (2, 3, DATEADD('HOUR', 1, CURRENT_TIMESTAMP), DATEADD('HOUR', 5, CURRENT_TIMESTAMP), 'APPROVED', 'Gráficas Computacionales', 'Dra. Ruiz', 'RES-019');
INSERT INTO reservations (user_id, laptop_id, start_time, end_time, status, subject, professor, batch_id) VALUES (6, 1, DATEADD('HOUR', 1, CURRENT_TIMESTAMP), DATEADD('HOUR', 3, CURRENT_TIMESTAMP), 'APPROVED', 'Desarrollo Móvil', 'Dr. Hernández', 'RES-020');
INSERT INTO reservations (user_id, laptop_id, start_time, end_time, status, subject, professor, batch_id) VALUES (7, 5, DATEADD('HOUR', 2, CURRENT_TIMESTAMP), DATEADD('HOUR', 4, CURRENT_TIMESTAMP), 'APPROVED', 'Programación Web', 'Dr. Hernández', 'RES-021');
INSERT INTO reservations (user_id, laptop_id, start_time, end_time, status, subject, professor, batch_id) VALUES (2, 7, DATEADD('HOUR', -10, CURRENT_TIMESTAMP), DATEADD('HOUR', -8, CURRENT_TIMESTAMP), 'OVERDUE', 'Redes', 'Ing. García', 'RES-022');

-- Incidents
-- Nota: H2 usa DATEADD. Para MySQL usar: DATE_ADD(NOW(), INTERVAL -5 DAY)
INSERT INTO incidents (laptop_id, description, severity, reported_at, reporter_id) VALUES (13, 'La pantalla parpadea constantemente', 'HIGH', DATEADD('DAY', -5, CURRENT_TIMESTAMP), 2);
INSERT INTO incidents (laptop_id, description, severity, reported_at, reporter_id) VALUES (14, 'La batería se descarga en 15 minutos', 'MEDIUM', DATEADD('DAY', -3, CURRENT_TIMESTAMP), 4);
INSERT INTO incidents (laptop_id, description, severity, reported_at, reporter_id) VALUES (15, 'Extraviado durante evento', 'CRITICAL', DATEADD('DAY', -10, CURRENT_TIMESTAMP), 2);
INSERT INTO incidents (laptop_id, description, severity, reported_at, reporter_id) VALUES (6, 'La tecla "A" se queda pegada', 'LOW', DATEADD('DAY', -1, CURRENT_TIMESTAMP), 5);
INSERT INTO incidents (laptop_id, description, severity, reported_at, reporter_id) VALUES (2, 'Rasguños leves en la carcasa', 'LOW', DATEADD('DAY', -8, CURRENT_TIMESTAMP), 6);
