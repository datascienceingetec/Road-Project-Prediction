# Road Project Prediction - Backend

API REST para gestión y predicción de costos de proyectos viales.

## 🚀 Inicio Rápido

```bash
# 1. Instalar dependencias
pip install -r requirements.txt

# 2. Crear base de datos (primera vez)
python manage_migrations.py upgrade

# 3. (Opcional) Poblar con datos antiguos
python seed_from_old_schema.py instance/database_backup_XXXXXX.db

# 4. Crear archivo de entorno
cp .env.example .env

# 5. Ejecutar aplicación
python run.py
```

### Sincronizar Cambios del Equipo

```bash
git pull origin main
python manage_migrations.py upgrade  # Aplicar nuevas migraciones
python run.py
```

---

## 📁 Estructura del Proyecto

```
backend/
├── app/
│   ├── __init__.py             # Inicialización de Flask
│   ├── config.py               # Configuración
│   ├── models.py               # Modelos ORM (SQLAlchemy)
│   ├── enums.py                # Enumerados de tipos
│   ├── routes/                 # Endpoints de la API
│   │   ├── v1/                 # API v1
│   │   │   ├── proyectos.py
│   │   │   ├── fases.py
│   │   │   └── items.py
│   │   services/               # Lógica de negocio
│   │   adapters/               # Adaptadores de servicios
│   └── utils/                  # Utilidades
├── migrations/                 # Migraciones de Alembic
│   ├── versions/               # Scripts de migración
│   └── env.py                  # Configuración de Alembic
├── notebooks/                  # Jupyter notebooks para análisis
│   ├── eda.ipynb
│   ├── machine_learning.ipynb
│   └── test.ipynb
├── tests/                      # Pruebas unitarias
├── docs/                       # Documentación
├── data/                       # Datos fuente
├── instance/                   # Base de datos SQLite
├── alembic.ini                 # Configuración de Alembic
├── manage_migrations.py        # Gestión de migraciones
├── seed_from_old_schema.py     # Poblar BD desde esquema antiguo
├── requirements.txt            # Dependencias
└── run.py                  # Punto de entrada
```

---

## 🗄️ Base de Datos

### Esquema

El proyecto usa **SQLAlchemy ORM** con el siguiente esquema normalizado:

- **`fases`** - Catálogo de fases (Prefactibilidad, Factibilidad, Diseño Detallado)
- **`proyectos`** - Proyectos viales
- **`unidad_funcional`** - Unidades funcionales por proyecto
- **`item_tipo`** - Catálogo de tipos de items de costo
- **`fase_item_requerido`** - Relación fase-items con labels
- **`costo_item`** - Costos por proyecto e item
- **`anual_increment`** - Incrementos anuales para valor presente

### Migraciones con Alembic

```bash
# Ver estado
python manage_migrations.py status

# Crear migración (después de modificar models.py)
python manage_migrations.py create "Add email field to Proyecto"

# Aplicar migraciones
python manage_migrations.py upgrade

# Revertir
python manage_migrations.py downgrade
```

### Poblar BD desde Esquema Antiguo

Si tienes una BD con el esquema legacy (sin Alembic):

```bash
# 1. Aplicar migraciones primero
python manage_migrations.py upgrade

# 2. Poblar con datos antiguos
python seed_from_old_schema.py instance/database_backup_XXXXXX.db
```

📖 **Más info**: [docs/ALEMBIC_MIGRATION_GUIDE.md](docs/ALEMBIC_MIGRATION_GUIDE.md)

---

## 🔌 API Endpoints

### Proyectos

- `GET /api/proyectos` - Listar todos los proyectos
- `GET /api/proyectos/<codigo>` - Obtener proyecto por código
- `POST /api/proyectos` - Crear nuevo proyecto
- `PUT /api/proyectos/<codigo>` - Actualizar proyecto
- `DELETE /api/proyectos/<codigo>` - Eliminar proyecto

### Fases

- `GET /api/fases` - Listar todas las fases
- `GET /api/fases/<id>` - Obtener fase por ID
- `GET /api/fases/<id>/items` - Obtener items requeridos por fase

### Items

- `GET /api/items` - Listar todos los tipos de items
- `GET /api/items/<id>` - Obtener item por ID

---

## 📊 Notebooks

El proyecto incluye notebooks Jupyter para análisis y machine learning:

- **`eda.ipynb`** - Análisis exploratorio de datos
- **`machine_learning.ipynb`** - Modelos predictivos
- **`test.ipynb`** - Pruebas y visualizaciones
- **`reset_reload_db.ipynb`** - Reset y recarga de base de datos

⚠️ **Nota**: Los notebooks requieren actualización para trabajar con el nuevo esquema ORM.  
📖 **Guía de migración**: [docs/NOTEBOOKS_MIGRATION_GUIDE.md](docs/NOTEBOOKS_MIGRATION_GUIDE.md)

---

## 🛠️ Desarrollo

### Modificar el Esquema

```bash
# 1. Editar app/models.py
# 2. Crear migración
python manage_migrations.py create "Descripción del cambio"
# 3. Revisar archivo generado en migrations/versions/
# 4. Aplicar
python manage_migrations.py upgrade
```

---

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén disponibles)
pytest

# Con cobertura
pytest --cov=app
```

---

## 📦 Dependencias Principales

- **Flask 3.1.2** - Framework web
- **Flask-SQLAlchemy 3.1.1** - ORM
- **SQLAlchemy 2.0.23** - Motor de base de datos
- **Alembic 1.13.1** - Migraciones de BD
- **scikit-learn 1.7.2** - Machine learning
- **pandas 2.3.2** - Análisis de datos
- **plotly 6.3.1** - Visualizaciones

---

## 🔧 Configuración

### Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
SECRET_KEY=tu-secret-key-aqui
SQLALCHEMY_ECHO=False
```

### Configuración de Base de Datos

Por defecto, el proyecto usa SQLite en `instance/database.db`.

Para cambiar a otra base de datos, editar `app/config.py`:

```python
SQLALCHEMY_DATABASE_URI = "postgresql://user:pass@localhost/dbname"
```

---

## 📚 Documentación

- **[Guía de Migraciones](docs/ALEMBIC_MIGRATION_GUIDE.md)** - Uso completo de Alembic
- **[Migración de Notebooks](docs/NOTEBOOKS_MIGRATION_GUIDE.md)** - Adaptar notebooks al nuevo esquema

---

## 🚨 Troubleshooting

### Error: "Can't locate revision"

```bash
alembic stamp head
alembic upgrade head
```

### Error: "Target database is not up to date"

```bash
python manage_migrations.py upgrade
```

### Base de datos corrupta

```bash
# Backup
cp instance/database.db instance/database.db.backup

# Recrear desde migraciones
rm instance/database.db
alembic upgrade head
```

---
