# Reporte de Prácticas con Herramientas de Pruebas Automáticas

**Fecha:** 10 de Febrero de 2026
**Materia:** Pruebas de Software
**Tema:** Práctica con Herramientas de Pruebas Automáticas

---

## 1. Selección de Herramientas

Para cumplir con el objetivo de la práctica, se han seleccionado dos conjuntos de herramientas líderes en la industria para el desarrollo de software moderno:

1.  **JUnit 5 + Mockito** (Para Backend/Java)
2.  **Vitest + React Testing Library** (Para Frontend/React)

Esta selección permite cubrir tanto la lógica de negocio del servidor como la interactividad de la interfaz de usuario.

---

## 2. Descripción de las Herramientas

### Herramienta 1: JUnit 5 & Mockito

*   **JUnit 5**: Es la quinta versión del framework de pruebas unitarias más popular para el ecosistema Java. Permite definir casos de prueba, aserciones (validaciones) y ciclos de vida de ejecución (@BeforeEach, @Test).
*   **Mockito**: Es un framework de aislamiento (mocking) que permite simular el comportamiento de dependencias externas. Esto es crucial en pruebas unitarias para probar una clase sin depender de la base de datos o servicios externos reales.

**¿Por qué se eligieron?**
Son el estándar de facto en el desarrollo profesional con Spring Boot, ofreciendo robustez y una amplia comunidad de soporte.

### Herramienta 2: Vitest & React Testing Library

*   **Vitest**: Es un ejecutor de pruebas (test runner) de nueva generación, diseñado para ser extremadamente rápido y compatible nativamente con Vite (la herramienta de construcción usada en este proyecto). Reemplaza a herramientas más antiguas como Jest.
*   **React Testing Library (RTL)**: Es una librería metodológica que fomenta probar los componentes "como los usaría un usuario", buscando elementos por texto o rol en lugar de por implementación interna.

**¿Por qué se eligieron?**
Ofrecen una experiencia de desarrollo superior (velocidad de ejecución) y fomentan mejores prácticas de testing accesibles.

---

## 3. Práctica y Ejecución

### Escenario 1: Pruebas de Backend (ReservationService)

**Objetivo**: Validar la lógica de creación de reservas de laptops, asegurando que no se permitan fechas inválidas y que el sistema maneje correctamente la falta de inventario.

**Código de Prueba (Extracto):**
```java
@Test
void findSmartOptions_StartDateAfterEndDate_ThrowsException() {
    // Configuración
    LocalDateTime start = LocalDateTime.now().plusDays(2);
    LocalDateTime end = LocalDateTime.now().plusDays(1); // Error: Fin antes de inicio

    // Ejecución y Verificación
    assertThrows(IllegalArgumentException.class, () -> {
        reservationService.findSmartOptions(start, end, null);
    });
}
```

**Resultado de Ejecución (Consola Docker):**
```
[INFO] Running com.university.labmanager.service.ReservationServiceTest
[INFO] Tests run: 17, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```
*Todas las pruebas pasaron exitosamente, validando 17 escenarios críticos.*

### Escenario 2: Pruebas de Frontend (LogsTable)

**Objetivo**: Validar que la tabla de logs se renderice correctamente, consuma la API simulada y permita filtrar resultados por texto.

**Código de Prueba (Extracto):**
```typescript
it('filters logs by message', async () => {
    // Mock de API
    (api.get as any).mockResolvedValue({ data: mockLogs });
    render(<LogsTable />);
    
    // Simulación de interacción
    const searchInput = screen.getByPlaceholderText('Buscar logs...');
    fireEvent.change(searchInput, { target: { value: 'memory' } });
    
    // Verificación
    expect(screen.getByText('High memory usage')).toBeInTheDocument();
});
```

**Resultado de Ejecución (Consola npm):**
```
✓ src/components/__tests__/LogsTable.test.tsx (11 tests)
✓ src/components/__tests__/ThemeToggle.test.tsx (2 tests)
  
Test Files  2 passed (2)
Tests  13 passed (13)
```
*El componente LogsTable superó los 11 casos de prueba diseñados.*

---

## 4. Conclusiones

La implementación de estas herramientas permitió detectar errores lógicos (como validaciones de fechas) antes de desplegar la aplicación. 
*   **Vitest** demostró ser extremadamente rápido, brindando feedback inmediato al desarrollar componentes visuales.
*   **Mockito** fue esencial para probar la lógica compleja de reservaciones sin necesidad de levantar una base de datos real, simplificando el entorno de pruebas.

Ambas herramientas cumplen con los estándares de la industria y mejoran significativamente la calidad del código entregado.
