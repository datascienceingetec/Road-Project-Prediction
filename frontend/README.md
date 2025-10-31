# Road Project Prediction - Frontend

Interfaz web moderna para la gestión y predicción de costos de proyectos viales, construida con Next.js y TypeScript.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
pnpm install

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
├── public/             # Archivos estáticos
├── src/
│   ├── app/            # Rutas de Next.js 13+
│   ├── components/      # Componentes reutilizables
│   │   ├── ui/         # Componentes de UI
│   │   └── layout/     # Componentes de diseño
│   ├── lib/            # Utilidades y configuraciones
│   │   ├── api.ts      # Cliente API
│   │   └── utils.ts    # Funciones de utilidad
│   └── styles/         # Estilos globales
├── .eslintrc.json      # Configuración de ESLint
├── next.config.js      # Configuración de Next.js
└── package.json        # Dependencias y scripts
```

## 🛠️ Tecnologías Principales

- **Next.js 13+** - Framework de React para aplicaciones web
- **TypeScript** - Tipado estático para JavaScript
- **Tailwind CSS** - Framework CSS utilitario
- **shadcn/ui** - Componentes UI accesibles y personalizables
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas
- **Axios** - Cliente HTTP

## 🌐 Variables de Entorno

Crea un archivo `.env.local` en la raíz del frontend con las siguientes variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

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
