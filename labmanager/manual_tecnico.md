# Manual Técnico - LabManager

**Versión:** 1.0
**Fecha:** 3 de Febrero de 2026
**Proyecto:** Sistema de Gestión de Laboratorios

---

## 1. Introducción
Este documento detalla los aspectos técnicos del desarrollo e implementación del sistema *LabManager*. Describe las herramientas utilizadas, la estructura del código, la configuración del entorno y la lógica de los componentes principales. Su propósito es servir como guía para desarrolladores y administradores de sistemas.

## 2. Tecnologías Utilizadas (Stack Tecnológico)

### 2.1 Backend (Servidor)
*   **Lenguaje:** Java 17 (JDK 17/21).
*   **Framework:** Spring Boot 3.2.0.
*   **Seguridad:** Spring Security + JWT (JSON Web Tokens).
*   **Persistencia:** Spring Data JPA + Hibernate.
*   **Base de Datos:** MySQL 8.0 (Producción) / H2 (Desarrollo).
*   **Herramientas:** Maven (Gestión de dependencias), Lombok (Reducción de código boilerplate).

### 2.2 Frontend (Cliente)
*   **Lenguaje:** TypeScript + React 18.
*   **Build Tool:** Vite.
*   **Estilos:** TailwindCSS (Diseño Utility-First).
*   **Librerías Clave:**
    *   `axios`: Consumo de API REST.
    *   `react-router-dom`: Navegación SPA.
    *   `react-hook-form`: Gestión de formularios.
    *   `lucide-react`: Iconografía.
    *   `recharts`: Gráficos de analíticas.
    *   `react-qr-code`: Generación de códigos QR para reservas.
    *   `@yudiel/react-qr-scanner`: Escaneo de QR en Dashboard Administrativo.
    *   `date-fns`: Manejo robusto de fechas y zonas horarias.

---

## 3. Arquitectura del Sistema

El sistema sigue una **Arquitectura en Capas** clásica para asegurar la separación de responsabilidades:

1.  **Capa de Presentación (Frontend):** Interfaz de usuario React que consume servicios REST.
    *   *Gestión de Tema:* `ThemeContext` para manejo global de modo claro/oscuro con persistencia en localStorage.
    *   *Manejo Offline:* `OfflineManager` para encolar peticiones cuando no hay red.
2.  **Capa de Controladores (Backend Controller):** Recibe peticiones HTTP (`GET`, `POST`, etc.) y valida entradas.
    *   *Ejemplo:* `ReservationController.java`.
    *   *Manejo de Errores:* `GlobalExceptionHandler` unifica las respuestas de error (e.g., mapea `IllegalArgumentException` a 400 Bad Request).
3.  **Capa de Servicio (Backend Service):** Contiene la lógica de negocio pura.
    *   *Ejemplo:* `ReservationService.java` (Valida si una laptop está libre).
4.  **Capa de Acceso a Datos (Repository):** Interactúa con la base de datos.
    *   *Ejemplo:* `ReservationRepository.java` (Ejecuta consultas SQL/JPQL).
5.  **Capa de Datos (Database):** Tablas Relacionales (MySQL).

---

## 4. Estructura del Proyecto

### 4.1 Backend (`/src/main/java/com/university/labmanager`)
*   `config/`: Configuraciones globales (Seguridad, CORS, Swagger).
*   `controller/`: Endpoints de la API REST.
*   `model/`: Entidades JPA (Tablas de la BD).
*   `repository/`: Interfaces de acceso a datos.
*   `service/`: Lógica de negocio.
*   `dto/`: Objetos de transferencia de datos (JSON Requests/Responses).

### 4.2 Frontend (`/src`)
*   `components/`: Piezas reutilizables de UI (Botones, Modales, Tablas).
*   `pages/`: Pantallas principales (Login, Dashboards).
*   `context/`: Gestión de estado global (AuthContext).
*   `services/`: Lógica de comunicación con el Backend (api.ts).

---

## 5. Implementación de Módulos Clave

### 5.1 Módulo de Seguridad (Autenticación)
Se implementó un filtro de seguridad (`AuthTokenFilter`) que intercepta cada petición HTTP.
*   **Login:** El usuario envía credenciales -> Servidor valida -> Servidor responde con un **JWT**.
*   **Uso:** El Frontend guarda el JWT y lo envía en el header `Authorization: Bearer <token>` en cada petición subsiguiente.
*   **Roles:** Se usan anotaciones `@PreAuthorize("hasRole('ADMIN')")` para proteger endpoints sensibles.

### 5.2 Módulo de Reservas
*   **Validación:** Antes de guardar, el sistema consulta `reservationRepository.findOverlapping(...)` para asegurar que el equipo no esté ocupado en ese horario.
*   **Transaccionalidad:** Se usa `@Transactional` para evitar inconsistencias si falla un paso intermedio.

### 5.3 Módulo de Incidentes
*   Permite la subida de imágenes. El backend guarda los archivos en una carpeta local (`uploads/`) y guarda solo la **ruta relativa** en la base de datos.
*   Un "Manejador de Recursos Estáticos" expone esa carpeta para que el frontend pueda visualizar las fotos.

---

## 6. Instalación y Despliegue

### Requisitos Previos
*   Java JDK 17+
*   Node.js 18+
*   Docker (Opcional, recomendado)

### Pasos de Ejecución (Local)
1.  **Base de Datos:** Levantar MySQL o usar configuración H2 en memoria.
2.  **Backend:** Ejecutar `./mvnw spring-boot:run` en la carpeta raíz.
3.  **Frontend:** Ejecutar `npm install` y luego `npm run dev` en la carpeta `frontend`.

### Dockerización
El proyecto incluye un `docker-compose.yml` que orquesta los servicios:
*   `app-backend`: Puerto 8080.
*   `app-frontend`: Puerto 80 (Nginx).
*   `db`: MySQL 8.0.

---

## 7. Conclusión
La implementación exitosa de LabManager demuestra el uso de patrones de diseño modernos y prácticas de desarrollo robustas, resultando en un sistema escalable, seguro y fácil de mantener.
