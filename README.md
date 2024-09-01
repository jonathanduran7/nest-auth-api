# Nestjs Authentication API

Este proyecto proporciona un sistema de autenticación basado en JWT para un API RESTful en NestJS. Incluye registro de usuarios, inicio de sesión y manejo de tokens de refresco. 

## Requisitos

- NodeJs v16 o superior
- NestJS CLI
- PostgreSQL

## Instalación

1. Clonar el repositorio
2. Instalar las dependencias con `npm install`
3. Crear un archivo `.env` en la raíz del proyecto con las siguientes variables de entorno:
```env
DATABASE_USER=
DATABASE_HOST=
DATABASE_PORT=
DATABASE_NAME=
DATABASE_PASSWORD=
JWT_SECRET=
```
## Uso

1. Iniciar el servidor con `npm run start:dev`

## Testing

Para ejecutar las pruebas unitarias, ejecute `npm run test`

## Funcionalidades

### Registro de usuarios

- Método: Post
- Ruta: /auth/register
- Body: 
```json
{
  "email": "email",
  "password": "password",
  "userName": "userName"
}
  ```

### Inicio de sesión

- Método: Post
- Ruta: /auth/login
- Body: 
```json
{
  "email": "email",
  "password": "password",
  "userName": "userName"
}
  ```

### Refrescar token

- Método: Post
- Ruta: /auth/refresh
- Authorization
  - Bearer token: refresh_token

### Logout

- Método: Post
- Ruta: /auth/logout
- Authorization
  - Bearer token: refresh_token

