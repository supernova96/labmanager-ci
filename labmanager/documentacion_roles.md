# Documentación de Roles y Responsabilidades - Sistema LabManager

**Fecha:** 2 de Febrero de 2026
**Proyecto:** Sistema Integral de Gestión de Laboratorios (LabManager)

## 1. Introducción

El presente documento define formalmente la estructura de roles y permisos implementada en el sistema *LabManager*. El objetivo es delimitar claramente las responsabilidades, alcances y acciones permitidas para cada tipo de usuario, asegurando la integridad de los datos, la seguridad del equipamiento y la eficiencia en la gestión operativa de los laboratorios de cómputo.

El sistema implementa un modelo de Control de Acceso Basado en Roles (RBAC), donde cada usuario tiene asignado un único rol que determina su nivel de interacción con la plataforma.

## 2. Definición de Roles

El sistema reconoce tres roles jerárquicos fundamentales:

1.  **Administrador** (`ROLE_ADMIN`)
2.  **Profesor / Docente** (`ROLE_PROFFESOR`)
3.  **Estudiante** (`ROLE_STUDENT`)

---

## 3. Descripción Detallada de Roles

### 3.1. Administrador del Sistema (`ROLE_ADMIN`)

#### Descripción
El Administrador es el rol de mayor jerarquía, responsable de la gestión global, configuración y mantenimiento operativo de la plataforma. Actúa como el supervisor de los recursos físicos (laptops, periféricos) y lógicos (usuarios, software).

#### Responsabilidades Principales
*   **Gestión de Inventario:** Mantener actualizado el catálogo de equipos, gestionando altas, bajas y cambios de estado (e.g., disponible, en reparación).
*   **Gestión de Usuarios:** Supervisar el padrón de usuarios registrados y gestionar la lista blanca de matrículas permitidas.
*   **Gestión de Calendario:** Definir días inhábiles o bloqueos de fechas para el mantenimiento.
*   **Supervisión de Préstamos:** Aprobar o rechazar solicitudes de reservas masivas realizadas por docentes.
*   **Atención de Incidencias:** Recibir y procesar los reportes de fallas, coordinando la reparación o sustitución de equipos.

#### Acciones Específicas en el Sistema
*   **CRUD de Laptops:** Crear, leer, actualizar y eliminar registros de computadoras portátiles.
*   **Gestión de Software:** Administrar el catálogo de software disponible en cada equipo.
*   **Bloqueo de Fechas:** Configurar días festivos o de mantenimiento en los que no se permiten reservas (`/admin/blocked-dates`).
*   **Auditoría:** Visualizar reportes globales de uso y logs del sistema.
*   **Gestión de Sanciones:** Aplicar o levantar sanciones a estudiantes por mal uso o retraso en la entrega.
*   **Escaneo de QR:** Utilizar la cámara del dispositivo para escanear el código QR del estudiante y procesar la entrega/devolución al instante.

---

### 3.2. Profesor / Docente (`ROLE_PROFFESOR`)

#### Descripción
El rol de Profesor está diseñado para los académicos que requieren asegurar la disponibilidad de infraestructura tecnológica para sus sesiones de clase. Tienen privilegios elevados respecto a los estudiantes, permitiéndoles realizar reservas por volumen.

#### Responsabilidades Principales
*   **Planeación Académica:** Reservar con antelación los recursos necesarios para sus clases.
*   **Reporte de Instalaion:** Informar sobre el estado físico de las aulas y equipos fijos (PCs de escritorio).
*   **Validación de Recursos:** Asegurar que el software requerido esté disponible en los equipos solicitados.

#### Acciones Específicas en el Sistema
*   **Reserva Masiva (Bulk Reservation):** Solicitar múltiples equipos (cantidad $\ge$ 1) simultáneamente para una materia y horario específico.
*   **Gestión de Historial:** Consultar el estado de sus solicitudes (Pendiente, Aprobada, Rechazada).
*   **Exportación de Calendario:** Descargar confirmaciones de reservas en formato `.ics` para integración con calendarios personales.
*   **Reporte de Incidencias Multitipo:**
    *   *Falla de Equipo:* Reportar problemas con Laptops o PCs de Escritorio.
    *   *Reporte de Infraestructura:* Notificar sobre falta de limpieza o mobiliario en aulas (`Limpieza / Salón`), incluyendo evidencia fotográfica y hora del hallazgo.
*   **Calificación de Servicio:** Evaluar la calidad de los equipos recibidos tras finalizar una reserva.

---

### 3.3. Estudiante (`ROLE_STUDENT`)

#### Descripción
El rol de Estudiante representa al usuario final estándar que utiliza los equipos para actividades académicas individuales. Su acceso está restringido a operaciones de consumo personal.

#### Responsabilidades Principales
*   **Uso Responsable:** Cuidar el equipo asignado durante el periodo de préstamo.
*   **Cumplimiento de Horarios:** Retornar los equipos dentro del tiempo establecido para evitar sanciones.
*   **Reporte Oportuno:** Notificar inmediatamente cualquier anomalía detectada en el equipo al momento de recibirlo.

#### Acciones Específicas en el Sistema
*   **Reserva Individual:** Solicitar el préstamo de una única laptop para uso personal.
*   **Consulta de Disponibilidad:** Buscar equipos basados en software específico instalado (e.g., "Necesito una laptop con Android Studio").
*   **Visualización de Historial:** Ver sus préstamos activos y pasados.
*   **Código QR de Reserva:** Generar y visualizar un código QR único para cada reserva aprobada/activa, facilitando la entrega rápida en ventanilla.
*   **Reporte de Incidencias (Nivel Usuario):** Reportar fallas específicas sobre el equipo que tienen en custodia (ej. "Pantalla parpadea").
*   **Feedback:** Proporcionar retroalimentación sobre la experiencia de uso.

## 4. Matriz de Permisos (Resumen)

| Acción / Recurso | Administrador | Profesor | Estudiante |
| :--- | :---: | :---: | :---: |
| **Login / Autenticación** | ✅ | ✅ | ✅ |
| **Gestión Inventario (Laptops)** | ✅ | ❌ | ❌ |
| **Solicitud Reserva Individual** | ✅ | ❌ | ✅ |
| **Solicitud Reserva Masiva (Clase)**| ❌ | ✅ | ❌ |
| **Aprobar/Rechazar Reservas** | ✅ | ❌ | ❌ |
| **Escaneo de QR (Entrega Rápida)** | ✅ | ❌ | ❌ |
| **Generación de QR (Reserva)** | ✅ | ✅ | ✅ |
| **Reportar Falla de Equipo** | ✅ | ✅ | ✅ |
| **Reportar Falla de Aulas** | ❌ | ✅ | ❌ |
| **Gestión de Días Inhábiles** | ✅ | ❌ | ❌ |
| **Ver Historial Propio** | N/A | ✅ | ✅ |
| **Ver Todos los Préstamos** | ✅ | ❌ | ❌ |

---
*Fin del documento.*
