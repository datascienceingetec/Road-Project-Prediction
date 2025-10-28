# Sistema de Predicción de Costos en Proyectos Viales

Aplicación web modular para la **gestión y predicción de costos** en proyectos de infraestructura vial.
Arquitectura basada en **Flask (backend)** y preparada para integrar una interfaz **React (frontend)**.

---
## 📋 Funcionalidades 

### ✅ Gestión de Proyectos 
- Crear, leer, actualizar y eliminar proyectos viales 
- Visualización en tabla interactiva 
- Detalles completos de cada proyecto con datos relacionados 

### 🗺️ Visualización Geográfica 
- Mapa interactivo con Google Maps 
- Rutas entre puntos de inicio y fin de proyectos 
- Marcadores clickeables - 

**Reactividad**: Al hacer clic en una fila de la tabla, la ruta se dibuja automáticamente en el mapa 

### 📊 Análisis Histórico 
- Total de proyectos 
- Inversión total acumulada 
- Longitud total de vías 
- Costo promedio por kilómetro 

### 🔍 Vista Detallada 
- Información completa del proyecto 
- **Unidades Funcionales**: Tabla con características técnicas de cada UF 
- **Items de Costo**: Desglose detallado de costos causados por item 
- Mapa de la ruta del proyecto 
- Total acumulado por items 

### 🤖 Modelo Predictivo
 - Predicción de costos basada en parámetros del proyecto 
 - Interfaz simple para ingreso de datos 
 - Preparado para integrar modelos SVR de scikit-learn

## 🧱 Arquitectura

### Backend (Flask)

* API REST modular y escalable.
* Base de datos SQLite (prototipo local).
* Lógica de negocio en servicios (`app/services/`).
* Análisis y predicción con Pandas y Scikit-learn.
* Estructura limpia y desacoplada.

### Frontend (Next.js)

* Aplicación de una sola página (SPA) construida con Next.js.
* Implementa operaciones CRUD para proyectos, unidades funcionales e ítems de costo.
* Integración robusta con la API de Flask.
* Preparado para desarrollo asistido por IA.

---

## 📂 Estructura del Proyecto

```
Road-Project-Prediction/
├── backend/
│   ├── app/
│   │   ├── models.py              → Acceso a datos y operaciones CRUD
│   │   ├── routes/                → Rutas de la API REST
│   │   ├── services/              → Lógica de negocio (EDA, predicción, cálculos)
│   │   └── config.py              → Configuración general
│   │
│   ├── data/                      → Archivos de datos fuente (CSV, XLSX)
│   ├── docs/                      → Documentación de la API REST
│   ├── instance/                  → Base de datos SQLite (`database.db`)
│   ├── notebooks/                 → Análisis y entrenamiento (EDA, ML)
│   ├── run.py                     → Ejecución de Flask en desarrollo
│   ├── requirements.txt           → Dependencias del backend
│   └── wsgi.py                    → Entrada para servidores WSGI (producción)
│
├── frontend/                      → Aplicación React (Next.js)
│   ├── app/                       → Rutas y páginas de Next.js
│   ├── components/                → Componentes reutilizables de la UI
│   ├── hooks/                     → Hooks personalizados de React
│   ├── lib/                       → Utilidades y funciones de ayuda
│   ├── public/                    → Archivos estáticos (imágenes, fuentes)
│   ├── styles/                    → Estilos globales y configuración de Tailwind CSS
│   ├── components.json            → Configuración de componentes (ej. Shadcn UI)
│   ├── next.config.mjs            → Configuración de Next.js
│   ├── package.json               → Metadatos del proyecto y dependencias
│   ├── pnpm-lock.yaml             → Archivo de bloqueo de dependencias de pnpm
│   ├── postcss.config.mjs         → Configuración de PostCSS
│   └── tsconfig.json              → Configuración de TypeScript
│
├── docs/                          → Documentación general (Arquitectura, changelog, etc.)
├── scripts.bat                    → Script para ejecutar backend/frontend en Windows
├── scripts.sh                     → Script para ejecutar backend/frontend en Linux/Mac
├── Makefile                       → Atajos comunes para desarrollo
└── README.md                      → Documentación principal
```

---

## ⚙️ Configuración del Entorno

### 1️⃣ Crear entorno virtual

#### En Windows

```bash
python -m venv .venv
.venv\Scripts\activate
```

#### En Linux/Mac

```bash
python3 -m venv venv
source venv/bin/activate
```

---

### 2️⃣ Instalar dependencias del backend

```bash
cd backend
pip install -r requirements.txt
```

---

### 3️⃣ Crear base de datos (si no existe)

```bash
python -c "from app.models import init_db; init_db()"
```

O simplemente ejecuta Flask una vez:

```bash
flask run
```

y se generará `backend/instance/database.db` automáticamente.

---

### 4️⃣ Ejecutar el backend

#### Opción A — Manual

```bash
cd backend
flask run
```

#### Opción B — Script multiplataforma

**Windows**

```bash
scripts.bat backend
```

**Linux/Mac**

```bash
chmod +x scripts.sh
./scripts.sh backend
```

---

### 5️⃣ Ejecutar ambos (Flask + React)

Cuando tengas el frontend listo:

```bash
scripts.bat both        # Windows
./scripts.sh both       # Linux/Mac
```

---

## 🧩 Endpoints Principales

| Recurso                  | Ruta                                              | Descripción                   |
| ------------------------ | ------------------------------------------------- | ----------------------------- |
| **Proyectos**            | `/api/v1/proyectos`                               | CRUD de proyectos             |
| **Unidades Funcionales** | `/api/v1/proyectos/<codigo>/unidades-funcionales` | CRUD de unidades por proyecto |
| **Items por Fase**       | `/api/v1/proyectos/<codigo>/items?fase=fase_i`    | CRUD de items de costo        |
| **Predicción**           | `/api/predict`                                    | Cálculo de costo estimado     |

---

## 💻 Scripts Disponibles

### `scripts.bat` (Windows)

```bash
scripts.bat backend     # Ejecuta Flask
scripts.bat frontend    # Ejecuta React (cuando exista)
scripts.bat both        # Levanta ambos en paralelo
```

### `scripts.sh` (Linux/Mac)

```bash
./scripts.sh backend
./scripts.sh frontend
./scripts.sh both
```

### `Makefile`

```bash
make run-backend        # Inicia Flask
make run-frontend       # Inicia React
make dev                # Ejecuta ambos (backend + frontend)
```

---

## 🧠 Requisitos

* Python 3.10+
* pip y virtualenv
* Node.js (solo si se desarrollará el frontend)
* SQLite (incluido por defecto)

---

## 🚀 Roadmap

* [x] Refactor completo del backend Flask
* [x] Modelo de datos con relaciones (Proyecto, UF, Items)
* [x] Estructura RESTful jerárquica
* [x] Inicialización de React frontend
* [ ] CRUD completo desde UI
* [ ] Integración del modelo predictivo real
* [ ] Autenticación de usuarios
* [ ] Despliegue contenedorizado (Docker)

---

## 📚 Tecnologías Principales

| Capa                       | Tecnologías                            |
| -------------------------- | -------------------------------------- |
| **Backend**                | Flask · Pandas · Scikit-learn · SQLite |
| **Frontend**               | Next.js · React · Tailwind CSS         |
| **Entorno**                | Python 3.10+ · Node 20+                |

---

## 🧩 Créditos

Desarrollado como prototipo funcional para la **predicción de costos en proyectos viales**,