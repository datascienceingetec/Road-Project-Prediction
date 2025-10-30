# Guía de Migraciones con Alembic

## 📋 Índice

1. [Introducción](#introducción)
2. [Configuración Inicial](#configuración-inicial)
3. [Comandos Básicos](#comandos-básicos)
4. [Flujo de Trabajo](#flujo-de-trabajo)
5. [Casos de Uso Comunes](#casos-de-uso-comunes)
6. [Mejores Prácticas](#mejores-prácticas)
7. [Troubleshooting](#troubleshooting)
8. [Referencias](#referencias)

---

## 🎯 Introducción

**Alembic** es una herramienta de migración de bases de datos para SQLAlchemy. Permite:

- ✅ **Control de versiones** del esquema de base de datos
- ✅ **Migraciones automáticas** basadas en cambios en modelos ORM
- ✅ **Rollback** a versiones anteriores
- ✅ **Historial completo** de cambios en el esquema
- ✅ **Trabajo en equipo** sincronizado

### ¿Por qué Alembic?

Antes usábamos `db.create_all()` que:
- ❌ No maneja cambios en tablas existentes
- ❌ No permite rollback
- ❌ No tiene historial de cambios
- ❌ Dificulta el trabajo en equipo

Con Alembic:
- ✅ Cambios controlados y versionados
- ✅ Posibilidad de revertir cambios
- ✅ Sincronización entre desarrolladores
- ✅ Migraciones automáticas y manuales

---

## ⚙️ Configuración Inicial

### 1. Instalación

Alembic ya está incluido en `requirements.txt`:

```bash
pip install -r requirements.txt
```

### 2. Estructura de Archivos

```
backend/
├── alembic.ini                 # Configuración de Alembic
├── migrations/                 # Directorio de migraciones
│   ├── env.py                 # Configuración del entorno
│   ├── script.py.mako         # Template para nuevas migraciones
│   ├── README                 # Información básica
│   └── versions/              # Scripts de migración
│       ├── .gitkeep
│       └── xxxx_initial_schema.py  # Migraciones generadas
├── app/
│   ├── models.py              # Modelos ORM (fuente de verdad)
│   └── __init__.py            # Ya NO usa db.create_all()
└── docs/
    └── ALEMBIC_MIGRATION_GUIDE.md  # Esta guía
```

### 3. Configuración de `alembic.ini`

El archivo `alembic.ini` ya está configurado con:

```ini
[alembic]
script_location = migrations
sqlalchemy.url = sqlite:///instance/database.db
```

**Nota**: La URL de la base de datos se sobrescribe dinámicamente en `migrations/env.py` usando la configuración de Flask.

### 4. Configuración de `migrations/env.py`

Este archivo:
- Importa la aplicación Flask
- Obtiene los modelos de `app.models`
- Configura `render_as_batch=True` para SQLite (importante)

---

## 🚀 Comandos Básicos

### Ver Estado Actual

```bash
# Ver la versión actual de la base de datos
alembic current

# Ver el historial de migraciones
alembic history

# Ver migraciones pendientes
alembic history --verbose
```

### Crear una Nueva Migración

#### Opción 1: Autogeneración (Recomendado)

Alembic detecta cambios en `app/models.py` automáticamente:

```bash
# Generar migración automáticamente
alembic revision --autogenerate -m "Descripción del cambio"

# Ejemplo:
alembic revision --autogenerate -m "Add email field to Proyecto"
```

#### Opción 2: Migración Manual

Para cambios que Alembic no puede detectar automáticamente:

```bash
alembic revision -m "Descripción del cambio"
```

Luego edita el archivo generado en `migrations/versions/`.

### Aplicar Migraciones

```bash
# Aplicar todas las migraciones pendientes
alembic upgrade head

# Aplicar una migración específica
alembic upgrade <revision_id>

# Aplicar N migraciones hacia adelante
alembic upgrade +2
```

### Revertir Migraciones

```bash
# Revertir la última migración
alembic downgrade -1

# Revertir a una versión específica
alembic downgrade <revision_id>

# Revertir todas las migraciones
alembic downgrade base
```

### Ver SQL sin Ejecutar

```bash
# Ver SQL que se ejecutaría (útil para debugging)
alembic upgrade head --sql

# Ver SQL de downgrade
alembic downgrade -1 --sql
```

---

## 🔄 Flujo de Trabajo

### Escenario 1: Agregar un Nuevo Campo

**Paso 1**: Modificar el modelo en `app/models.py`

```python
class Proyecto(db.Model):
    __tablename__ = 'proyectos'
    
    id = Column(Integer, primary_key=True)
    codigo = Column(String(50), unique=True, nullable=False)
    nombre = Column(String(200), nullable=False)
    email = Column(String(100))  # ← NUEVO CAMPO
    # ... resto de campos
```

**Paso 2**: Generar migración automática

```bash
alembic revision --autogenerate -m "Add email field to Proyecto"
```

**Paso 3**: Revisar el archivo generado

```bash
# Abrir el archivo en migrations/versions/xxxx_add_email_field_to_proyecto.py
```

Verificar que el contenido sea correcto:

```python
def upgrade() -> None:
    with op.batch_alter_table('proyectos', schema=None) as batch_op:
        batch_op.add_column(sa.Column('email', sa.String(length=100), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('proyectos', schema=None) as batch_op:
        batch_op.drop_column('email')
```

**Paso 4**: Aplicar la migración

```bash
alembic upgrade head
```

**Paso 5**: Verificar

```bash
alembic current
# Debería mostrar la nueva revisión
```

### Escenario 2: Crear una Nueva Tabla

**Paso 1**: Agregar modelo en `app/models.py`

```python
class Auditoria(db.Model):
    __tablename__ = 'auditoria'
    
    id = Column(Integer, primary_key=True)
    usuario = Column(String(100), nullable=False)
    accion = Column(String(200), nullable=False)
    fecha = Column(DateTime, default=datetime.utcnow)
    detalles = Column(Text)
```

**Paso 2**: Generar y aplicar migración

```bash
alembic revision --autogenerate -m "Create Auditoria table"
alembic upgrade head
```

### Escenario 3: Modificar una Columna Existente

**Paso 1**: Modificar el modelo

```python
class Proyecto(db.Model):
    # Cambiar longitud de codigo de 50 a 100
    codigo = Column(String(100), unique=True, nullable=False)  # Era String(50)
```

**Paso 2**: Generar migración

```bash
alembic revision --autogenerate -m "Increase codigo length to 100"
```

**Paso 3**: **IMPORTANTE**: Revisar y editar el archivo generado

Alembic puede no detectar cambios de longitud en SQLite. Edita manualmente:

```python
def upgrade() -> None:
    with op.batch_alter_table('proyectos', schema=None) as batch_op:
        batch_op.alter_column('codigo',
                              existing_type=sa.String(length=50),
                              type_=sa.String(length=100),
                              existing_nullable=False)


def downgrade() -> None:
    with op.batch_alter_table('proyectos', schema=None) as batch_op:
        batch_op.alter_column('codigo',
                              existing_type=sa.String(length=100),
                              type_=sa.String(length=50),
                              existing_nullable=False)
```

**Paso 4**: Aplicar migración

```bash
alembic upgrade head
```

### Escenario 4: Eliminar una Tabla

**Paso 1**: Eliminar el modelo de `app/models.py`

**Paso 2**: Generar migración

```bash
alembic revision --autogenerate -m "Drop Auditoria table"
```

**Paso 3**: Revisar y aplicar

```bash
alembic upgrade head
```

---

## 📚 Casos de Uso Comunes

### Caso 1: Migración Inicial (Primera Vez)

Si estás configurando Alembic por primera vez en un proyecto existente:

```bash
# 1. Generar migración inicial basada en modelos actuales
alembic revision --autogenerate -m "Initial schema"

# 2. Revisar el archivo generado
# 3. Aplicar la migración
alembic upgrade head
```

### Caso 2: Clonar el Proyecto (Nuevo Desarrollador)

```bash
# 1. Clonar repositorio
git clone <repo_url>
cd backend

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Aplicar todas las migraciones
alembic upgrade head

# 4. Verificar estado
alembic current
```

### Caso 3: Sincronizar con Cambios de Otros Desarrolladores

```bash
# 1. Hacer pull de cambios
git pull origin main

# 2. Aplicar nuevas migraciones
alembic upgrade head

# 3. Verificar estado
alembic current
```

### Caso 4: Migración de Datos (Data Migration)

Cuando necesitas transformar datos existentes:

```bash
# 1. Crear migración vacía
alembic revision -m "Migrate proyecto codes to uppercase"
```

```python
# 2. Editar el archivo generado
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column

def upgrade() -> None:
    # Definir tabla para operaciones de datos
    proyectos_table = table('proyectos',
        column('id', sa.Integer),
        column('codigo', sa.String)
    )
    
    # Obtener conexión
    conn = op.get_bind()
    
    # Actualizar datos
    conn.execute(
        proyectos_table.update().values(
            codigo=sa.func.upper(proyectos_table.c.codigo)
        )
    )

def downgrade() -> None:
    # Revertir cambios (si es posible)
    proyectos_table = table('proyectos',
        column('id', sa.Integer),
        column('codigo', sa.String)
    )
    
    conn = op.get_bind()
    conn.execute(
        proyectos_table.update().values(
            codigo=sa.func.lower(proyectos_table.c.codigo)
        )
    )
```

```bash
# 3. Aplicar migración
alembic upgrade head
```

### Caso 5: Rollback de Emergencia

Si una migración causa problemas en producción:

```bash
# 1. Ver historial
alembic history

# 2. Revertir a versión anterior
alembic downgrade -1

# 3. Verificar estado
alembic current

# 4. Corregir el problema en el código
# 5. Generar nueva migración corregida
alembic revision --autogenerate -m "Fix previous migration"

# 6. Aplicar corrección
alembic upgrade head
```

### Caso 6: Resetear Base de Datos Completamente

**⚠️ CUIDADO: Esto elimina todos los datos**

```bash
# Opción 1: Usando Alembic
alembic downgrade base  # Revertir todas las migraciones
alembic upgrade head    # Volver a aplicar todas

# Opción 2: Eliminar BD y recrear
rm instance/database.db
alembic upgrade head
```

---

## ✅ Mejores Prácticas

### 1. **Siempre Revisar Migraciones Autogeneradas**

```bash
# Después de generar
alembic revision --autogenerate -m "Add field"

# SIEMPRE revisar el archivo antes de aplicar
cat migrations/versions/xxxx_add_field.py
```

**Por qué**: Alembic puede no detectar todos los cambios (especialmente en SQLite).

### 2. **Usar Mensajes Descriptivos**

```bash
# ❌ Malo
alembic revision --autogenerate -m "changes"

# ✅ Bueno
alembic revision --autogenerate -m "Add email and phone fields to Proyecto model"
```

### 3. **Una Migración por Cambio Lógico**

```bash
# ❌ Malo: Mezclar cambios no relacionados
alembic revision --autogenerate -m "Add email, create Auditoria, fix typo"

# ✅ Bueno: Separar en migraciones independientes
alembic revision --autogenerate -m "Add email field to Proyecto"
alembic revision --autogenerate -m "Create Auditoria table"
alembic revision --autogenerate -m "Fix typo in UnidadFuncional field name"
```

### 4. **Probar Upgrade y Downgrade**

```bash
# Aplicar migración
alembic upgrade head

# Probar rollback
alembic downgrade -1

# Volver a aplicar
alembic upgrade head
```

### 5. **Usar `batch_alter_table` para SQLite**

SQLite tiene limitaciones. Siempre usa `batch_alter_table`:

```python
# ✅ Correcto para SQLite
def upgrade() -> None:
    with op.batch_alter_table('proyectos', schema=None) as batch_op:
        batch_op.add_column(sa.Column('email', sa.String(100)))

# ❌ Incorrecto (puede fallar en SQLite)
def upgrade() -> None:
    op.add_column('proyectos', sa.Column('email', sa.String(100)))
```

### 6. **Commitear Migraciones con el Código**

```bash
git add migrations/versions/xxxx_add_email_field.py
git add app/models.py
git commit -m "Add email field to Proyecto model"
```

### 7. **No Editar Migraciones Aplicadas**

- ❌ **NUNCA** edites una migración que ya fue aplicada en producción
- ✅ Crea una nueva migración para corregir

### 8. **Backup Antes de Migraciones en Producción**

```bash
# Backup de BD antes de migrar
cp instance/database.db instance/database.db.backup

# Aplicar migración
alembic upgrade head

# Si algo sale mal
mv instance/database.db.backup instance/database.db
```

### 9. **Documentar Migraciones Complejas**

```python
"""Add email field to Proyecto

This migration adds an email field to store contact information.
The field is nullable to allow existing records without emails.

Revision ID: abc123def456
Revises: xyz789ghi012
Create Date: 2025-10-30 12:00:00.000000

"""
```

### 10. **Usar Variables de Entorno para Configuración**

```python
# En migrations/env.py
import os
from dotenv import load_dotenv

load_dotenv()

# Usar configuración de entorno si está disponible
if os.getenv('DATABASE_URL'):
    config.set_main_option('sqlalchemy.url', os.getenv('DATABASE_URL'))
```

---

## 🐛 Troubleshooting

### Error: "Can't locate revision identified by 'xxxx'"

**Causa**: La base de datos tiene una versión que no existe en `migrations/versions/`.

**Solución**:
```bash
# Ver versión actual en BD
alembic current

# Marcar BD como en versión base (resetear)
alembic stamp base

# Aplicar todas las migraciones
alembic upgrade head
```

### Error: "Target database is not up to date"

**Causa**: Hay migraciones pendientes.

**Solución**:
```bash
alembic upgrade head
```

### Error: "FAILED: Can't emit ALTER for constraint"

**Causa**: SQLite no soporta ciertas operaciones ALTER.

**Solución**: Usar `batch_alter_table`:
```python
with op.batch_alter_table('table_name', schema=None) as batch_op:
    batch_op.add_column(...)
```

### Error: "Multiple head revisions are present"

**Causa**: Dos desarrolladores crearon migraciones en paralelo.

**Solución**:
```bash
# Crear migración de merge
alembic merge -m "Merge heads" <rev1> <rev2>

# Aplicar merge
alembic upgrade head
```

### Error: Migración autogenerada está vacía

**Causa**: Alembic no detectó cambios.

**Soluciones**:
1. Verificar que los modelos estén importados en `app/models.py`
2. Verificar que `target_metadata` en `env.py` esté configurado correctamente
3. Crear migración manual si es necesario

### Base de Datos Corrupta

**Solución**:
```bash
# 1. Backup de datos (si es posible)
# 2. Eliminar BD
rm instance/database.db

# 3. Recrear desde migraciones
alembic upgrade head

# 4. Restaurar datos desde backup
```

---

## 🔍 Comandos de Diagnóstico

```bash
# Ver versión actual
alembic current

# Ver historial completo
alembic history --verbose

# Ver diferencias entre modelo y BD
alembic check

# Ver SQL que se ejecutaría (sin ejecutar)
alembic upgrade head --sql

# Ver información de una revisión específica
alembic show <revision_id>

# Ver todas las cabezas (heads)
alembic heads

# Ver todas las ramas
alembic branches
```

---

## 📖 Comandos de Referencia Rápida

| Comando | Descripción |
|---------|-------------|
| `alembic revision --autogenerate -m "msg"` | Crear migración automática |
| `alembic revision -m "msg"` | Crear migración vacía |
| `alembic upgrade head` | Aplicar todas las migraciones |
| `alembic upgrade +1` | Aplicar siguiente migración |
| `alembic downgrade -1` | Revertir última migración |
| `alembic downgrade base` | Revertir todas las migraciones |
| `alembic current` | Ver versión actual |
| `alembic history` | Ver historial |
| `alembic stamp head` | Marcar BD como actualizada sin ejecutar |
| `alembic check` | Verificar diferencias modelo vs BD |

---

## 🎓 Recursos Adicionales

- **Documentación Oficial**: https://alembic.sqlalchemy.org/
- **Tutorial Alembic**: https://alembic.sqlalchemy.org/en/latest/tutorial.html
- **Alembic con Flask**: https://flask-migrate.readthedocs.io/ (alternativa)
- **SQLAlchemy Docs**: https://docs.sqlalchemy.org/

---

## 📝 Ejemplo Completo: Agregar Campo y Migrar Datos

```bash
# 1. Modificar modelo
# En app/models.py: agregar campo 'estado' a Proyecto

# 2. Generar migración
alembic revision --autogenerate -m "Add estado field to Proyecto"
```

```python
# 3. Editar migración generada para incluir migración de datos
"""Add estado field to Proyecto

Revision ID: abc123
Revises: xyz789
Create Date: 2025-10-30
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column

def upgrade() -> None:
    # Agregar columna
    with op.batch_alter_table('proyectos', schema=None) as batch_op:
        batch_op.add_column(sa.Column('estado', sa.String(50), nullable=True))
    
    # Migrar datos: establecer estado por defecto
    proyectos_table = table('proyectos',
        column('id', sa.Integer),
        column('estado', sa.String)
    )
    
    conn = op.get_bind()
    conn.execute(
        proyectos_table.update().values(estado='Activo')
    )
    
    # Hacer columna NOT NULL después de migrar datos
    with op.batch_alter_table('proyectos', schema=None) as batch_op:
        batch_op.alter_column('estado', nullable=False)


def downgrade() -> None:
    with op.batch_alter_table('proyectos', schema=None) as batch_op:
        batch_op.drop_column('estado')
```

```bash
# 4. Aplicar migración
alembic upgrade head

# 5. Verificar
alembic current
```

---

## ⚡ Tips Avanzados

### 1. Crear Migración Inicial desde BD Existente

Si ya tienes una BD y quieres empezar a usar Alembic:

```bash
# Marcar BD actual como versión inicial
alembic stamp head

# Ahora puedes crear nuevas migraciones normalmente
alembic revision --autogenerate -m "Add new field"
```

### 2. Usar Múltiples Bases de Datos

Editar `alembic.ini` y `env.py` para soportar múltiples BDs.

### 3. Migraciones Offline (Generar SQL)

```bash
# Generar SQL para ejecutar manualmente
alembic upgrade head --sql > migration.sql
```

### 4. Custom Naming Convention

En `app/models.py`:

```python
from sqlalchemy import MetaData

metadata = MetaData(naming_convention={
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
})

db = SQLAlchemy(metadata=metadata)
```

---

**Última actualización**: 30 de octubre de 2025  
**Versión**: 1.0  
**Autor**: Cascade AI Assistant
