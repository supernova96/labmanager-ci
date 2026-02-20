# Plan de Pruebas Unitarias - Sistema LabManager

## 1. Introducción
Este documento describe la estrategia de pruebas unitarias implementada para el sistema **LabManager**. El objetivo es garantizar la calidad y estabilidad tanto del backend (Spring Boot) como del frontend (React), verificando la lógica de negocio crítica y la interacción de componentes de usuario.

## 2. Alcance
El alcance de estas pruebas abarca:
*   **Backend**: Servicios principales de lógica de negocio (`ReservationService`, `LogService`).
*   **Frontend**: Componentes interactivos clave (`LogsTable`, `ThemeToggle`).

## 3. Entorno de Pruebas

### 3.1 Tecnologías Backend
*   **Lenguaje**: Java 17 (Ejecutado en contenedor Docker para compatibilidad).
*   **Framework**: Spring Boot 3.2.0.
*   **Herramientas de Testing**:
    *   **JUnit 5**: Motor de ejecución de pruebas.
    *   **Mockito**: Framework para simulación de dependencias (Mocking).

### 3.2 Tecnologías Frontend
*   **Lenguaje**: TypeScript / React 18.
*   **Herramientas de Testing**:
    *   **Vitest**: Runner de pruebas rápido (compatible con Vite).
    *   **React Testing Library**: Pruebas centradas en el comportamiento del usuario.
    *   **JSDOM**: Simulación de entorno de navegador.

## 4. Estrategia de Pruebas

### 4.1 Backend
Se enfoca en probar la capa de **Servicios** de forma aislada. Se utilizan *Mocks* para aislar el servicio de la base de datos y otros componentes externos.

**Clases bajo prueba:**
1.  **ReservationService**:
    *   Validación de fechas (inicio > fin).
    *   Reglas de negocio (no reservas en fin de semana).
    *   Lógica de asignación de laptops.
    *   Manejo de estados de reserva (ACTIVE, COMPLETED).
    *   Feedback de usuarios y triggers de mantenimiento.
2.  **LogService**:
    *   Creación y persistencia de logs del sistema.

### 4.2 Frontend
Se enfoca en probar **Componentes** renderizados en un DOM virtual. Se verifican estados de carga, renderizado de datos, interacciones de usuario (clicks, filtros) y manejo de errores.

**Componentes bajo prueba:**
1.  **LogsTable**:
    *   Consumo de API (simulado/mocked).
    *   Filtrado de tablas por múltiples criterios.
    *   Visualización de estados vacíos y errores.
    *   Badges de estado (INFO, WARN, ERROR).
2.  **ThemeToggle**:
    *   Cambio de contexto de tema (Light/Dark).

## 5. Criterios de Aceptación
*   Todas las pruebas deben pasar con resultado **EXITOSO (Green)**.
*   No debe haber errores de compilación ni de ejecución en el pipeline de pruebas.
*   Cobertura mínima de casos de éxito y casos de error (Happy Path & Edge Cases).
