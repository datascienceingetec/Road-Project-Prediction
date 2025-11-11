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

---

## 📂 Estructura del Proyecto

```
Road-Project-Prediction/
├── backend/
├── frontend/                      → Aplicación React (Next.js)
├── docs/                          → Documentación general (Arquitectura, changelog, etc.)
├── scripts.bat                    → Script para ejecutar backend/frontend en Windows
├── scripts.sh                     → Script para ejecutar backend/frontend en Linux/Mac
├── Makefile                       → Atajos comunes para desarrollo
└── README.md                      → Documentación principal
```

---

## ⚙️ Configuración del Entorno
### 1️⃣ Clonar repositorio

```bash
git clone https://github.com/arielforero/Road-Project-Prediction.git
cd Road-Project-Prediction
git switch dev
```

### 2️⃣ Configurar el backend

#### En Windows

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
```

#### En Linux/Mac

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

#### Instalar dependencias

```bash
pip install -r requirements.txt
```

#### Crear base de datos

```bash
# desde /backend
python manage_migrations.py upgrade
```

Esto crea la base de datos en `instance/database.db`.

#### Poblar datos desde una base anterior

```bash
# desde /backend
python seed_from_old_schema.py <path_to_old_database>
# Ejemplo:
# mover bd antigua a la carpeta instance y renombrar a old_database.db
python seed_from_old_schema.py instance/old_database.db
```

#### Crear archivo de entorno

```bash
cp .env.example .env
```

Revisar y completar las variables según sea necesario.

#### Ejecutar backend

- Opción A — Manual

```bash
cd backend
flask run
```

- Opción B — Script multiplataforma

**Windows**

```bash
scripts.bat backend
```

**Linux/Mac**

```bash
chmod +x scripts.sh
./scripts.sh backend
```

Verificar: [http://127.0.0.1:5000/api/v1/proyectos](http://127.0.0.1:5000/api/v1/proyectos)

---

### 3️⃣ Configurar el frontend

#### Instalar dependencias

```bash
cd frontend
npm install -g pnpm # si no lo tienes instalado
pnpm install
```

#### Crear archivo de entorno

```bash
cp .env.example .env
```

Revisar y completar las variables según sea necesario.

#### Ejecutar frontend

- Opción A — Manual

```bash
cd frontend
pnpm dev
```

- Opción B — Script multiplataforma

**Windows**

```bash
scripts.bat frontend
```

**Linux/Mac**

```bash
chmod +x scripts.sh
./scripts.sh frontend
```

### 4️⃣ Ejecutar ambos (Flask + React)

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
| **Costos por proyecto**  | `/api/v1/proyectos/<codigo>/costos`               | CRUD de items de costo        |
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
* [x] CRUD completo desde UI
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