# Planificación de Sprints (Basada en Fases del Proyecto) - LabManager

Esta planificación organiza las **7 fases del ciclo de vida del proyecto** en **4 Sprints** lógicos de trabajo, utilizando un formato profesional de Scrum.

---

## 📅 Sprint 1: Planeación y Diseño
**Fases Cubiertas:** 1. Planeación | 2. Diseño
**Objetivo:** Definir el alcance total del sistema, su arquitectura lógica y el diseño visual antes de iniciar la codificación.

### Tabla del Sprint 1

| ID | Fase | Actividad / Tarea | Prioridad | Estado | Entregable |
|:---:|:---:|:---|:---:|:---:|:---|
| **S1-01** | Planeación | Analizar problemática, objetivos y alcance del sistema. | Alta | ✅ Terminado | Documento de Visión |
| **S1-02** | Planeación | Definir roles, responsabilidades y cronograma de trabajo. | Alta | ✅ Terminado | Cronograma y Roles |
| **S1-03** | Diseño | Elaborar Modelo Entidad-Relación (BD) y Arquitectura. | Alta | ✅ Terminado | Diagrama ER y Arquitectura |
| **S1-04** | Diseño | Elaborar Diagramas de Casos de Uso (UML). | Media | ✅ Terminado | Diagramas UML |
| **S1-05** | Diseño | Diseñar Wireframes/Prototipos y validar con usuario. | Media | ✅ Terminado | Prototipos de UI |

---

## ⚙️ Sprint 2: Desarrollo Backend (Lógica del Servidor)
**Fases Cubiertas:** 3. Desarrollo Backend
**Objetivo:** Construir la API robusta que soporte toda la lógica de negocio, seguridad y gestión de datos.

### Tabla del Sprint 2

| ID | Módulo | Tarea / Historia de Usuario | Prioridad | Estado | Entregable |
|:---:|:---:|:---|:---:|:---:|:---|
| **S2-01** | Config | Configurar entorno y estructura inicial (Spring Boot). | Alta | ✅ Terminado | Repo Base Backend |
| **S2-02** | Usuarios | Implementar Registro, Login y Autenticación JWT. | Alta | ✅ Terminado | API Seguridad |
| **S2-03** | Inventario | Implementar CRUD de Equipos (Laptops/PCs). | Alta | ✅ Terminado | API Inventario |
| **S2-04** | Reservas | Implementar lógica de préstamos y validaciones. | Alta | ✅ Terminado | API Reservas |
| **S2-05** | Incidentes | Implementar reporte de fallas y notificaciones por correo. | Media | ✅ Terminado | API Incidentes/Email |

---

## � Sprint 3: Desarrollo Frontend e Integración
**Fases Cubiertas:** 4. Desarrollo Frontend
**Objetivo:** Construir la interfaz de usuario y conectarla con el Backend para hacer el sistema funcional.

### Tabla del Sprint 3

| ID | Componente | Tarea / Historia de Usuario | Prioridad | Estado | Entregable |
|:---:|:---:|:---|:---:|:---:|:---|
| **S3-01** | UI Base | Construir interfaz base (Layouts) y pantallas de Auth. | Alta | ✅ Terminado | Pantallas Login/Reg |
| **S3-02** | Dashboards | Crear Dashboards específicos por Rol (Admin/Prof/Est). | Alta | ✅ Terminado | Paneles de Control |
| **S3-03** | Gestión | Pantallas de gestión de Equipos e Inventario Visual. | Alta | ✅ Terminado | Vistas CRUD |
| **S3-04** | Acciones | Unificar lógica de Reservas e Incidentes (Front+Back). | Alta | ✅ Terminado | Sistema Integrado |
| **S3-05** | UX | Mejorar diseño visual (Glassmorphism) y usabilidad. | Media | ✅ Terminado | UI Pulida |

---

## 🚀 Sprint 4: Calidad, Documentación y Cierre
**Fases Cubiertas:** 5. Pruebas | 6. Documentación | 7. Cierre
**Objetivo:** Asegurar la calidad del software, documentarlo formalmente y preparar el despliegue final.

### Tabla del Sprint 4

| ID | Fase | Actividad / Tarea | Prioridad | Estado | Entregable |
|:---:|:---:|:---|:---:|:---:|:---|
| **S4-01** | Pruebas | Pruebas Unitarias, de Integración y de Usuario (UAT). | Alta | 🔄 En Progreso | Reporte de QA |
| **S4-02** | Pruebas | Corrección de errores (Bugs) detectados. | Alta | 🔄 En Progreso | Sistema Estable |
| **S4-03** | Doc | Elaborar Manual Técnico y de Usuario. | Media | 📝 Pendiente | Manuales PDF |
| **S4-04** | Cierre | Ajustes finales y preparación de Demo Funcional. | Alta | 📝 Pendiente | Demo Lista |
| **S4-05** | Cierre | Entrega final del proyecto y exposición. | Crítica | 📅 Programado | Entrega Final |
