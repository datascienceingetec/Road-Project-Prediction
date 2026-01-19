# Autenticación y Autorización

Este documento describe la arquitectura y el flujo de autenticación y autorización implementado en la aplicación **Road Project Prediction**. El sistema utiliza **Google OAuth 2.0** como proveedor de identidad y **JWT (JSON Web Tokens)** manejados via cookies `HttpOnly` para la gestión de sesiones seguras.

## 🏗 Arquitectura General

La seguridad de la aplicación se basa en un modelo **Backend-for-Frontend (BFF)** simplificado, donde el backend actúa como la autoridad confiable que valida los tokens de Google y emite una sesión propia.

### Componentes Clave

1.  **Frontend (Next.js)**:
    -   Maneja el flujo de UI (Login, Callback, Logout).
    -   **Middleware (`middleware.ts`)**: Protege las rutas verificando la existencia de la cookie de sesión. **No** realiza lógica OAuth compleja, solo redirige.
    -   **Contexto (`AuthProvider`)**: Mantiene el estado del usuario en memoria para la UI (Avatar, Nombre, etc.).
2.  **Backend (Flask)**:
    -   Valida el `authorization_code` a través de **Gestiona**.
    -   Verifica si el usuario existe y cumple con los requisitos de **Categoría y Departamento**.
    -   Emite una cookie segura `roadcost_session`.
3.  **Google Identity Services**: Proveedor de identidad (IdP).

---

## 🔐 Flujo de Autenticación (Paso a Paso)

### 1. Inicio de Sesión (Silent-First Strategy)

Para mejorar la experiencia de usuario (UX), implementamos una estrategia "silenciosa primero".

1.  **Usuario entra a la app (`/`)**:
    -   El `middleware.ts` detecta que no hay cookie `roadcost_session`.
    -   Redirige a `/login`.
2.  **Página de Login (`/login`)**:
    -   Automáticamente inicia un intento de autenticación silenciosa con Google (`prompt=none`).
    -   **Escenario A (Ya logueado en Google)**: Google redirige a `/auth/callback` con un código válido.
    -   **Escenario B (No logueado)**: Google devuelve un error `login_required`.
        -   La página captura este error y suspende el auto-login.
        -   Muestra un botón **"Iniciar Sesión con Google"** (interactivo, `prompt=select_account`).

### 2. Procesamiento del Callback (`/auth/callback`)

1.  El frontend recibe el `code` de Google.
2.  Envía el `code` al backend: `POST /api/v1/auth/google`.
3.  **Validación en Backend**:
    -   Intercambia el `code` de Google a través de la **API Gestiona** para obtener un token corporativo.
    -   Obtiene la información detallada del usuario desde Gestiona usando este token.
    -   **Autorización**: Verifica reglas de negocio estrictas:
        -   **Categoría**: El ID del cargo (`employeeCategorieId`) debe estar en la lista permitida.
        -   **Departamento**: El departamento (`employeeDepartment`) debe estar en la lista permitida.
        -   **Admin**: Los usuarios en la lista de administradores tienen acceso total por email.
4.  **Emisión de Sesión**:
    -   Si es válido, genera un JWT firmado con los datos del usuario.
    -   Lo establece en una cookie `HttpOnly`, `Secure` (en prod), `SameSite=None` (o `Lax`).
    -   Devuelve los datos del usuario al frontend.
5.  **Finalización**:
    -   El frontend guarda los datos en `AuthProvider`.
    -   Redirige al usuario al Dashboard (`/`).

---

## 🚪 Flujo de Cierre de Sesión (Logout)

El logout es crítico para evitar bucles de redirección con la estrategia _Silent-First_.

1.  Usuario hace clic en **"Cerrar Sesión"** en el menú de perfil.
2.  Frontend llama a `POST /api/v1/auth/logout` (Backend borra la cookie).
3.  **Redirección Inteligente**:
    -   El frontend redirige explícitamente a `/login?logout=true`.
4.  **Prevención de Bucle**:
    -   La página `/login` detecta el parámetro `logout=true`.
    -   **NO** intenta el login silencioso automático.
    -   Muestra un mensaje de confirmación "Sesión Cerrada" y el botón para volver a entrar manualmente.

---

## 🛡 Medidas de Seguridad

### Cookies

-   **HttpOnly**: Previene acceso desde JavaScript (mitigación XSS).
-   **Secure**: Solo se envía por HTTPS (obligatorio en Producción).
-   **SameSite**: Configurado para soportar el entorno (generalmente `None` en dev cruzado, `Lax` en prod).

### Autorización (RBAC)

-   **Nivel App**: El middleware bloquea el acceso a rutas si no hay sesión.
-   **Nivel API**:
    -   Decoradores como `@require_authenticated_user` validan el JWT de la cookie en cada petición.
    -   Nuevas validaciones granulares (ej. `@require_category_id`) están disponibles para proteger endpoints específicos.
-   **Reglas de Acceso**: La autorización principal combina `ALLOWED_CATEGORIES_ID` y `ALLOWED_DEPARTMENTS`.

### Manejo de Errores

-   **401 Unauthorized**: Sesión inválida o expirada. Frontend redirige a login.
-   **403 Forbidden**: Usuario autenticado correctamente en Google, pero **sin permisos** en la aplicación (no está en la lista blanca de roles). Muestra pantalla de "Acceso Denegado".

---

## 👤 Gestión de Usuario en Frontend

-   **Persistencia**: Aunque la sesión reside en la cookie (invisible), los datos de perfil (Nombre, Avatar) se cargan en memoria en el `AuthProvider`.
-   **Sincronización**:
    -   Al hacer login, los datos se cargan inmediatamente.
    -   Al recargar la página (`F5`), el endpoint `/api/v1/auth/me` restaura los datos del usuario desde la cookie.
