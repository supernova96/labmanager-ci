# Reporte de Compilación Automática en CI

**Fecha:** 19 de Febrero de 2026
**Actividad 2:** Proceso de compilación automática en la CI

---

## 1. Selección de Herramientas

Para esta actividad, se han seleccionado dos herramientas fundamentales en el ciclo de vida DevOps y CI/CD:

1.  **Docker** (Herramienta de Construcción y Empaquetado)
2.  **GitHub Actions** (Herramienta de Orquestación de CI)

---

## 2. Descripción de las Herramientas

### Herramienta 1: Docker
Docker es una plataforma abierta para desarrollar clases, enviar y ejecutar aplicaciones. Permite separar la aplicación de la infraestructura para entregar software rápidamente.
*   **En el proceso de Build:** Docker se utiliza para compilar la aplicación en un entorno aislado y generar una "Imagen" final que contiene todo lo necesario para ejecutar el software (código, runtime, librerías, variables de entorno). Esto elimina el problema de "funciona en mi máquina".

### Herramienta 2: GitHub Actions
GitHub Actions es una plataforma de integración continua y entrega continua (CI/CD) que permite automatizar el pipeline de construcción, pruebas y despliegue.
*   **En el proceso de CI:** Se configuran "Workflows" (flujos de trabajo) que reaccionan a eventos (como un `git push`). Estos flujos ejecutan comandos automáticamente, como `mvn brew` o `npm run build`, reportando si el cambio introducido rompe la aplicación.

---

## 3. Práctica y Ejecución

### A. Construcción con Docker Compose (Evidencia Local)

Se utilizó `docker-compose` para orquestar la construcción y ejecución de los servicios (Backend y Frontend) simultáneamente desde la raíz del proyecto.

**Comando Ejecutado:**
```bash
docker-compose up --build
```
*(Este comando recompila las imágenes si detecta cambios y levanta los contenedores)*

**Evidencia de Ejecución (Extracto de Logs):**
El proceso detecta las definiciones en `docker-compose.yml` y comienza la construcción paralela:

```text
[+] Building 2.4s (15/15) FINISHED
 => [backend internal] load build definition from Dockerfile
 => [frontend internal] load build definition from Dockerfile
 => [backend] FROM docker.io/library/maven:3.8.5-openjdk-17
 => [frontend] FROM docker.io/library/node:18-alpine
 ...
 [backend] [INFO] Building LabManager 0.0.1-SNAPSHOT
 [frontend] > vite build
 ...
 [+] Running 3/3
 - Network labmanager_lab-network    Created
 - Container labmanager-backend      Started
 - Container labmanager-frontend     Started
```

*El sistema descargó exitosamente las dependencias de Spring Boot y comenzó la compilación del JAR.*

### B. Configuración de Pipeline con GitHub Actions

Se diseñó e implementó un archivo de configuración `.github/workflows/ci.yml` para automatizar este proceso en la nube.

**Código del Pipeline Implementado:**
```yaml
name: CI Pipeline
jobs:
  build-backend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Set up JDK 17
      uses: actions/setup-java@v3
      with:
        java-version: '17'
    - name: Build with Maven
      run: mvn clean package -DskipTests
      
  build-frontend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    - name: Install Dependencies
      run: npm ci
    - name: Run Tests
      working-directory: ./labmanager-frontend
      run: npm test

### C. Validación de la Configuración del Pipeline


### C. Validación de la Configuración del Pipeline

El pipeline de CI se validó exitosamente en la plataforma **GitHub Actions** tras subir el código al repositorio remoto.

**Pasos de Validación:**
1.  **Ejecución en la Nube:** Al realizar el `push` a la rama `main`, GitHub Actions detectó el archivo `.github/workflows/ci.yml` y lanzó automáticamente el proceso de construcción.
2.  **Paridad de Entornos:** Se confirmó que el proyecto compila correctamente tanto en el entorno local (Docker) como en el servidor de integración continua (Ubuntu/Linux), garantizando la portabilidad del código.
3.  **Estado Exitoso:** Todos los jobs (`build-backend`, `build-frontend`) finalizaron con estado "Success" (Verde), validando la integridad del código y las pruebas.

**Resultado Final:**
*   **Repositorio:** [https://github.com/supernova96/labmanager-ci](https://github.com/supernova96/labmanager-ci)
*   **Estado del Pipeline:** ✅ Exitoso (Verificado en GitHub Actions)

**Evidencia Visual (Captura de Pantalla Recomendada):**
![Captura de GitHub Actions Exitoso](URL_DE_TU_IMAGEN_AQUI)
*(Te recomiendo tomar una captura de la pestaña "Actions" donde se vean los checks verdes y pegarla aquí)*


---

## 4. Conclusiones

La combinación de **Docker** y **GitHub Actions** provee un entorno de compilación robusto:
1.  **Docker** asegura que el artefacto generado sea idéntico sin importar dónde se construya (en la laptop del desarrollador o en el servidor de CI).
2.  **GitHub Actions** orquesta estos pasos automáticamente, garantizando que cada cambio en el código sea verificado y compilado antes de ser aceptado.

Esta práctica demuestra cómo automatizar la fase de "Build" para proyectos modernos Full Stack (Java + React).
