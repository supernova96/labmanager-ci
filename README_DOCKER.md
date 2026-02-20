# 🐳 LabManager - Guía de Docker

Esta guía explica cómo ejecutar el sistema completo (Frontend + Backend) en cualquier máquina utilizando Docker.

## 📋 Requisitos
- **Docker Desktop** instalado y correndo.

## 🚀 Ejecución Rápida

1. Abre una terminal en la carpeta raíz (`integradora`).
2. Ejecuta el siguiente comando:

```bash
docker-compose up --build
```

> **Nota:** Usa `--build` solo cuando hayas hecho cambios en el código. Si solo quieres iniciar el sistema tal cual estaba la última vez, usa:
> ```bash
> docker-compose up
> ```

3. Espera a que termine la construcción (puede tardar unos minutos la primera vez mientras descarga dependencias).

## 🌐 Acceso al Sistema

Una vez que los contenedores estén corriendo:

- **Web App (Frontend)**: [http://localhost](http://localhost)
- **API (Backend)**: [http://localhost:8080](http://localhost:8080)
- **Base de Datos (H2 Console)**: [http://localhost:8080/h2-console](http://localhost:8080/h2-console)
    - JDBC URL: `jdbc:h2:mem:labmanagerdb`
    - User: `sa`
    - Password: `password`

## 🛠️ Notas Importantes

- **Persistencia**: Por defecto, la base de datos es **en memoria (H2)**. Si detienes los contenedores, los datos se perderán (se reiniciarán con los datos semilla). Esto es ideal para pruebas rápidas.
- **Puertos**: Asegúrate de que los puertos `80` y `8080` estén libres en tu máquina.
- **Detener el sistema**: Presiona `Ctrl + C` en la terminal o ejecuta `docker-compose down`.
