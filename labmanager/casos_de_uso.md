# Diagramas de Casos de Uso - LabManager

Este documento contiene los diagramas de casos de uso del sistema LabManager, descritos utilizando la sintaxis **Mermaid**. Puedes visualizar estos diagramas en editores de Markdown compatibles (como GitHub, GitLab, VS Code con extensiones) o en [Mermaid Live Editor](https://mermaid.live).

## 1. Visión General del Sistema (Actores Principales)

Este diagrama muestra los tres actores principales y sus responsabilidades de alto nivel.

```mermaid
usecaseDiagram
    actor "Estudiante" as Std
    actor "Profesor" as Prof
    actor "Administrador" as Admin

    package "LabManager System" {
        usecase "Reservar Equipo (Individual)" as UC1
        usecase "Reservar Equipos (Masivo/Clase)" as UC2
        usecase "Gestionar Inventario" as UC3
        usecase "Reportar Incidencias" as UC4
        usecase "Gestionar Usuarios y Sanciones" as UC5
        usecase "Generar Reportes y Analíticas" as UC6
    }

    Std --> UC1
    Std --> UC4
    
    Prof --> UC2
    Prof --> UC4
    
    Admin --> UC3
    Admin --> UC4
    Admin --> UC5
    Admin --> UC6
```

---

## 2. Casos de Uso: Estudiante (`ROLE_STUDENT`)

Detalle de las acciones que puede realizar un alumno.

```mermaid
usecaseDiagram
    actor "Estudiante" as S

    package "Módulo Estudiante" {
        usecase "Iniciar Sesión" as Login
        usecase "Buscar Laptops por Software" as Search
        usecase "Reservar Laptop" as Reserve
        usecase "Ver Historial de Préstamos" as History
        usecase "Reportar Falla (Mi Equipo)" as Report
        usecase "Calificar Equipo (Feedback)" as Rate
        usecase "Descargar Calendario (.ics)" as Cal
    }

    S --> Login
    S --> Search
    S --> Reserve
    S --> History
    S --> Report
    S --> Rate
    S --> Cal
    S --> QRView

    usecase "Ver Código QR" as QRView
    History ..> QRView : <<include>>

    Reserve ..> Search : <<include>>
    Rate ..> History : <<extend>>
```

---

## 3. Casos de Uso: Profesor (`ROLE_PROFESSOR`)

Los profesores tienen capacidades extendidas para la gestión de clases.

```mermaid
usecaseDiagram
    actor "Profesor" as P

    package "Módulo Profesor" {
        usecase "Reservar Lote para Clase" as BulkRes
        usecase "Reservar Equipo Individual" as SingleRes
        usecase "Reportar Falla de Aulas" as ReportRoom
        usecase "Consultar Historial de Grupo" as HistoryP
        usecase "Reportar Falla (Desktop/Laptop)" as ReportDev
    }

    P --> BulkRes
    P --> SingleRes
    P --> ReportRoom
    P --> HistoryP
    P --> ReportDev

    ReportRoom --|> ReportDev : "Tipo de Reporte"
```

---

## 4. Casos de Uso: Administrador (`ROLE_ADMIN`)

El administrador gestiona la totalidad de los recursos y usuarios.

```mermaid
usecaseDiagram
    actor "Administrador" as A

    package "Gestión de Recursos" {
        usecase "CRUD Laptops" as CRUD
        usecase "Bloquear Fechas (Días Festivos)" as BlockDates
    }

    package "Gestión Operativa" {
        usecase "Escanear QR (Entrega/Devolución)" as QR
        usecase "Aprobar/Rechazar Reservas" as Approve
        usecase "Gestionar Lista Blanca" as Whitelist
        usecase "Ver Logs del Sistema" as Logs
    }

    package "Gestión de Incidencias" {
        usecase "Ver Reportes de Fallas" as ViewIssues
        usecase "Marcar Equipo en Reparación" as Repair
    }

    A --> CRUD
    A --> BlockDates
    A --> QR
    A --> Approve
    A --> Whitelist
    A --> Logs
    A --> ViewIssues
    
    ViewIssues ..> Repair : <<include>>
```
