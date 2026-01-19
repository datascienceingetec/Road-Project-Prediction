# Road Project Prediction - Frontend

Interfaz web moderna para la gestión y predicción de costos de proyectos viales, construida con Next.js y TypeScript.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install -g pnpm # si no lo tienes instalado
pnpm install

# Crear archivo de entorno
cp .env.example .env

# Ejecutar en modo desarrollo
pnpm dev

# Construir para producción
pnpm build

# Iniciar servidor de producción
pnpm start
```

### Sincronizar Cambios del Equipo

```bash
git pull origin main
pnpm install  # Instalar nuevas dependencias
pnpm dev      # Iniciar servidor de desarrollo
```

---

## 📁 Estructura del Proyecto

```
frontend/
├── app/                    # Directorio de Rutas (App Router de Next.js)
│   ├── api/                # api routes de Next.js
│   ├── configuracion/      # Ruta para la página de Configuración
│   ├── dashboard/          # Ruta para el Dashboard
│   ├── prediccion/         # Ruta para la página de Predicción
│   ├── proyectos/          # Ruta para la gestión de Proyectos
│   ├── global.css          # Estilos globales
│   └── layout.tsx          # Layout principal de la aplicación
├── components/             # Componentes Reutilizables y Específicos
│   ├── charts/             # Componentes relacionados con Gráficos
│   ├── geometry/           # Componentes relacionados con Geometría (¿Mapas/Diagramas?)
│   ├── prediction/         # Componentes específicos para la Predicción
│   ├── ui/                 # Componentes de Interfaz de Usuario (UI - Shadcn) atómicos
├── contexts/               # Proveedores de Contexto de React
├── hooks/                  # Custom Hooks de React
├── layouts/                # Posibles layouts específicos de página (si no son el layout.tsx principal)
├── lib/                    # Utilidades, funciones de ayuda, cliente API
│   ├── api/                # Cliente API REST para el backend
│   ├── utils/              # Utilidades, funciones de ayuda, cliente API
├── navigation/             # Archivos relacionados con la lógica de navegación/rutas
├── public/                 # Archivos estáticos (imágenes, fuentes, etc.)
├── styles/                 # Estilos adicionales o configuraciones de Tailwind/CSS
├── .env                    # Variables de entorno
└── package.json            # Dependencias y scripts
└── pnpm-lock.yaml          # Archivo de dependencias de pnpm
└── README.md               # Este archivo
```

## 🛠️ Tecnologías Principales

-   **Next.js 13+** - Framework de React para aplicaciones web
-   **TypeScript** - Tipado estático para JavaScript
-   **Tailwind CSS** - Framework CSS utilitario
-   **shadcn/ui** - Componentes UI accesibles y personalizables
-   **React Hook Form** - Manejo de formularios
-   **Zod** - Validación de esquemas
-   **Axios** - Cliente HTTP

## 🌐 Variables de Entorno

Crea un archivo `.env.local` en la raíz del frontend con las siguientes variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu-google-client-id
```

Asegúrate de registrar en Google Cloud el redirect URI: `https://<tu-dominio>/auth/callback` y que `GOOGLE_CLIENT_ID` sea el mismo que usa Gestiona.

## 🧪 Testing

```bash
# Ejecutar pruebas unitarias
pnpm test

# Ejecutar pruebas en modo watch
pnpm test -- --watch
```

## 📦 Despliegue

El proyecto está configurado para ser desplegado en Vercel o cualquier plataforma compatible con Next.js.

## 📄 Licencia

MIT
