# Otros Diagramas UML Recomendados - LabManager

Para un trabajo académico completo, además de los Casos de Uso, es fundamental incluir diagramas que muestren la estructura estática, el comportamiento dinámico y los estados de las entidades críticas.

A continuación, se presentan los 3 diagramas más relevantes para tu sistema: **Clases**, **Secuencia** y **Estados**.

## 1. Diagrama de Clases (Estructura Estática)

Muestra las entidades, sus atributos principales y cómo se relacionan entre sí.

```mermaid
classDiagram
    class User {
        +Long id
        +String matricula
        +String fullName
        +String email
        +Role role
        +boolean isSanctioned
        +register()
        +login()
    }

    class Laptop {
        +Long id
        +String serialNumber
        +String model
        +LaptopStatus status
        +addSoftware()
    }

    class Software {
        +Long id
        +String name
        +String version
    }

    class Reservation {
        +Long id
        +LocalDateTime startTime
        +LocalDateTime endTime
        +ReservationStatus status
        +Integer rating
        +String feedback
    }

    class Incident {
        +Long id
        +String description
        +IncidentSeverity severity
        +String evidencePath
        +boolean resolved
    }

    User "1" --> "*" Reservation : realiza
    User "1" --> "*" Incident : reporta
    Laptop "1" --> "*" Reservation : es reservada
    Laptop "1" --> "*" Incident : tiene
    Laptop "*" -- "*" Software : tiene instalado
```

---

## 2. Diagrama de Secuencia (Flujo de Reserva)

Este diagrama es vital porque muestra la interacción temporal entre el Estudiante, el Sistema (API) y la Base de Datos para el proceso más importante: **Hacer una Reserva**.

```mermaid
sequenceDiagram
    actor Estudiante
    participant Frontend as App Web
    participant Controller as ReservationController
    participant Service as ReservationService
    participant Repo as Repository
    participant Email as EmailService

    Estudiante->>Frontend: Solicita Reserva (Laptop, Hora)
    Frontend->>Controller: POST /api/reservations
    Controller->>Service: createReservation(...)
    
    Service->>Repo: checkAvailability(Laptop, Hora)
    Repo-->>Service: Disponible (True)
    
    Service->>Repo: save(Reservation)
    Repo-->>Service: Reserva Guardada (ID: 101)
    
    Service->>Email: sendConfirmationEmail(User, Reservation)
    Email-->>Service: Email Enviado
    
    Service-->>Controller: ReservaDTO (Confirmada)
    Controller-->>Frontend: HTTP 200 OK
    Frontend-->>Estudiante: Muestra "Reserva Exitosa"
```

---

## 3. Diagrama de Estados (Ciclo de Vida de una Laptop)

Explica cómo cambia el estado de un equipo, lo cual es clave para la lógica de negocio del inventario.

```mermaid
stateDiagram-v2
    [*] --> AVAILABLE : Alta en Inventario

    AVAILABLE --> IN_USE : Préstamo Iniciado
    IN_USE --> AVAILABLE : Devolución Exitosa
    
    IN_USE --> MAINTENANCE_REQUIRED : Reporte de Falla (Leve)
    IN_USE --> EN_REPARACION : Reporte de Falla (Grave)
    
    MAINTENANCE_REQUIRED --> AVAILABLE : Mantenimiento Completado
    EN_REPARACION --> AVAILABLE : Reparación Finalizada
    
    AVAILABLE --> INACTIVE : Baja Definitiva
    EN_REPARACION --> INACTIVE : Irreparable
    
    INACTIVE --> [*]
```

## Resumen de Utilidad

1.  **Diagrama de Clases:** Sirve para explicar tu base de datos y modelo de objetos en la sección de "Diseño del Sistema".
2.  **Diagrama de Secuencia:** Sirve para detallar la lógica del backend en la sección de "Funcionamiento".
3.  **Diagrama de Estados:** Sirve para justificar las reglas de negocio sobre cuándo se puede prestar un equipo y cuándo no.
