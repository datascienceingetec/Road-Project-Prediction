# Guía de Migración de Notebooks al Nuevo Esquema ORM

## 📋 Resumen Ejecutivo

Este documento detalla los cambios necesarios para adaptar los notebooks existentes al nuevo esquema de base de datos normalizado con SQLAlchemy ORM. El objetivo es conservar la mayor funcionalidad posible mientras se actualiza el código para trabajar con el nuevo esquema.

---

## 🗂️ Notebooks Analizados

1. **`eda.ipynb`** - Análisis exploratorio de datos
2. **`machine_learning.ipynb`** - Modelos de machine learning
3. **`reset_reload_db.ipynb`** - Reset y recarga de base de datos
4. **`test.ipynb`** - Pruebas y análisis de costos

---

## 🔄 Cambios Principales en el Esquema

### Esquema Antiguo → Esquema Nuevo

| Concepto Antiguo | Concepto Nuevo | Cambio Principal |
|-----------------|----------------|------------------|
| `proyectos` (tabla única) | `Proyecto` (modelo ORM) | Ahora incluye `fase_id` (FK) en lugar de `fase` (string) |
| `unidad_funcional` | `UnidadFuncional` | Cambio de `codigo` (FK) a `proyecto_id` (FK), campo `unidad_funcional` → `numero` |
| `item_fase_i`, `item_fase_ii`, `item_fase_iii` (3 tablas) | `CostoItem` (tabla única) + `ItemTipo` (catálogo) | **Cambio estructural mayor**: datos pivoteados a formato normalizado |
| N/A | `Fase` (catálogo) | Nueva tabla de catálogo para fases |
| N/A | `FaseItemRequerido` (relación) | Nueva tabla que define qué items son requeridos por fase |
| `anual_increment` | `AnualIncrement` | Sin cambios estructurales significativos |

---

## 📝 Cambios Requeridos por Notebook

### 1. **`eda.ipynb`** - Análisis Exploratorio de Datos

#### ❌ Problemas Identificados

1. **Función `load_dataframe_from_database()`** (celda 8):
   - Usa queries SQL raw con JOINs de tablas antiguas
   - Referencia a tabla `item` que ya no existe
   - Mapeo hardcodeado de campos a columnas Excel

2. **Queries SQL directas**:
   ```python
   query = """
   SELECT ... FROM proyectos p
   INNER JOIN unidad_funcional uf ON p.codigo = uf.codigo
   INNER JOIN item i ON p.codigo = i.codigo
   """
   ```

#### ✅ Soluciones Propuestas

**Opción A: Usar ORM (Recomendado)**
```python
def load_dataframe_from_database_orm(fase_id=None):
    """Cargar datos usando SQLAlchemy ORM"""
    from app.models import db, Proyecto, UnidadFuncional, CostoItem, ItemTipo
    from sqlalchemy.orm import joinedload
    
    # Query con ORM
    query = db.session.query(Proyecto).options(
        joinedload(Proyecto.unidades_funcionales),
        joinedload(Proyecto.costos)
    )
    
    if fase_id:
        query = query.filter(Proyecto.fase_id == fase_id)
    
    proyectos = query.all()
    
    # Construir DataFrame
    rows = []
    for proyecto in proyectos:
        for uf in proyecto.unidades_funcionales:
            row = {
                'NOMBRE DEL PROYECTO': proyecto.nombre,
                'CÓDIGO DEL PROYECTO': proyecto.codigo,
                'AÑO INICIO': proyecto.anio_inicio,
                'FASE': proyecto.fase.nombre,
                'DEPARTAMENTO': proyecto.ubicacion,
                'LONGITUD KM': uf.longitud_km,
                # ... más campos de UF
            }
            
            # Agregar costos por item
            for costo in proyecto.costos:
                item_nombre = costo.item_tipo.nombre
                # Mapear a formato Excel (ej: "Transporte" → "1 - TRANSPORTE")
                excel_col = map_item_to_excel_column(item_nombre, proyecto.fase_id)
                row[excel_col] = costo.valor
            
            rows.append(row)
    
    return pd.DataFrame(rows)
```

**Opción B: Usar SQL con nuevas tablas**
```python
def load_dataframe_from_database_sql(fase_id=None):
    """Cargar datos usando SQL con nuevo esquema"""
    query = """
    SELECT 
        p.nombre AS 'NOMBRE DEL PROYECTO',
        p.codigo AS 'CÓDIGO DEL PROYECTO',
        p.anio_inicio AS 'AÑO INICIO',
        f.nombre AS 'FASE',
        p.ubicacion AS 'DEPARTAMENTO',
        uf.longitud_km AS 'LONGITUD KM',
        uf.puentes_vehiculares_und AS 'PUENTES VEHICULARES UND',
        -- ... más campos de UF
        it.nombre AS 'ITEM_NOMBRE',
        ci.valor AS 'ITEM_VALOR'
    FROM proyectos p
    INNER JOIN fases f ON p.fase_id = f.id
    INNER JOIN unidad_funcional uf ON p.id = uf.proyecto_id
    LEFT JOIN costo_item ci ON p.id = ci.proyecto_id
    LEFT JOIN item_tipo it ON ci.item_tipo_id = it.id
    """
    
    if fase_id:
        query += f" WHERE p.fase_id = {fase_id}"
    
    df = pd.read_sql_query(query, conn)
    
    # Pivotar items de formato largo a ancho
    df_pivot = df.pivot_table(
        index=['CÓDIGO DEL PROYECTO', 'NOMBRE DEL PROYECTO', ...],
        columns='ITEM_NOMBRE',
        values='ITEM_VALOR',
        aggfunc='first'
    ).reset_index()
    
    return df_pivot
```

**Función auxiliar para mapeo de items:**
```python
def map_item_to_excel_column(item_nombre, fase_id):
    """Mapear nombre de ItemTipo a columna Excel según fase"""
    # Usar los labels de FaseItemRequerido.descripcion
    from app.models import FaseItemRequerido
    
    fase_item = FaseItemRequerido.query.filter_by(
        fase_id=fase_id,
        item_tipo_id=ItemTipo.query.filter_by(nombre=item_nombre).first().id
    ).first()
    
    return fase_item.descripcion if fase_item else item_nombre
```

#### 📌 Cambios Específicos

- **Celda 8**: Reemplazar completamente `load_dataframe_from_database()`
- **Celda 1**: Actualizar `pv.fetch_incremento_from_database()` para usar nuevo esquema
- **Celda 11**: Verificar que `create_dataset()` funcione con nuevo formato

---

### 2. **`machine_learning.ipynb`** - Modelos de ML

#### ❌ Problemas Identificados

1. **Dependencia de `EDA.assemble_projects_from_database()`**:
   - Usa el mismo query SQL problemático
   - Espera estructura de datos antigua

2. **Columnas hardcodeadas**:
   ```python
   target_columns = ['1 - TRANSPORTE', '2.1 - INFORMACIÓN GEOGRÁFICA', ...]
   ```
   - Estas columnas deben coincidir con los labels de `FaseItemRequerido.descripcion`

#### ✅ Soluciones Propuestas

**1. Actualizar carga de datos:**
```python
# Celda 1 - Reemplazar
fase = "III"
preproccesing = EDA()
df_raw = preproccesing.assemble_projects_from_database_orm(fase_id=3)  # Usar nueva función
df_vp = preproccesing.create_dataset(pv.present_value_costs, fase=fase)
```

**2. Obtener columnas dinámicamente:**
```python
def get_target_columns_for_fase(fase_id):
    """Obtener columnas de items según fase"""
    from app.models import FaseItemRequerido
    
    fase_items = FaseItemRequerido.query.filter_by(fase_id=fase_id).all()
    return [fi.descripcion for fi in fase_items]

# Uso
target_columns = get_target_columns_for_fase(fase_id=3)
```

#### 📌 Cambios Específicos

- **Celda 1**: Actualizar carga de datos
- **Celda 5**: Usar `get_target_columns_for_fase()` en lugar de lista hardcodeada
- **Todas las celdas**: Verificar que los nombres de columnas coincidan con nuevos labels

---

### 3. **`reset_reload_db.ipynb`** - Reset y Recarga de BD

#### ❌ Problemas Identificados

1. **Función `drop_all_tables()`** (celda 2):
   - Elimina tablas antiguas que ya no existen
   - No elimina nuevas tablas del esquema ORM

2. **Función `create_database()`** (celda 3):
   - Crea tablas con esquema antiguo
   - No usa `db.create_all()` de SQLAlchemy

3. **Inserción de datos**:
   - Usa SQL raw en lugar de ORM
   - Estructura de datos incompatible

#### ✅ Soluciones Propuestas

**Reemplazar completamente con:**
```python
def reset_database():
    """Resetear base de datos usando ORM"""
    from app import create_app
    from app.models import db
    
    app = create_app()
    with app.app_context():
        # Drop all
        db.drop_all()
        print("✓ Tablas eliminadas")
        
        # Create all
        db.create_all()
        print("✓ Tablas creadas")
        
        # Inicializar catálogos
        from migrate_db import initialize_catalog_data
        initialize_catalog_data(app)
        print("✓ Catálogos inicializados")

def load_data_from_excel(filename):
    """Cargar datos desde Excel usando ORM"""
    from app.models import Proyecto, UnidadFuncional, CostoItem, ItemTipo, Fase
    
    # Leer Excel
    preproccesing = EDA(filename)
    df = preproccesing.assemble_projects_from_excel()
    
    # Insertar con ORM
    for codigo in df['CÓDIGO DEL PROYECTO'].unique():
        df_proyecto = df[df['CÓDIGO DEL PROYECTO'] == codigo]
        
        # Crear proyecto
        fase = Fase.query.filter_by(nombre=df_proyecto.iloc[0]['FASE']).first()
        proyecto = Proyecto(
            codigo=codigo,
            nombre=df_proyecto.iloc[0]['NOMBRE DEL PROYECTO'],
            anio_inicio=df_proyecto.iloc[0]['AÑO INICIO'],
            ubicacion=df_proyecto.iloc[0]['DEPARTAMENTO'],
            fase_id=fase.id
        )
        db.session.add(proyecto)
        db.session.flush()
        
        # Crear unidades funcionales
        for idx, row in df_proyecto.iterrows():
            uf = UnidadFuncional(
                proyecto_id=proyecto.id,
                numero=idx + 1,
                longitud_km=row['LONGITUD KM'],
                # ... más campos
            )
            db.session.add(uf)
        
        # Crear costos
        item_columns = [col for col in df.columns if col.startswith(('1 -', '2 -', ...))]
        for item_col in item_columns:
            valor = df_proyecto[item_col].sum()
            if valor > 0:
                # Buscar ItemTipo por label
                item_tipo = ItemTipo.query.join(FaseItemRequerido).filter(
                    FaseItemRequerido.descripcion == item_col,
                    FaseItemRequerido.fase_id == fase.id
                ).first()
                
                if item_tipo:
                    costo = CostoItem(
                        proyecto_id=proyecto.id,
                        item_tipo_id=item_tipo.id,
                        valor=valor
                    )
                    db.session.add(costo)
        
        db.session.commit()
```

#### 📌 Cambios Específicos

- **Celda 2**: Reemplazar `drop_all_tables()` con `db.drop_all()`
- **Celda 3**: Reemplazar `create_database()` con `db.create_all()`
- **Celda 5-6**: Reemplazar lógica de inserción con ORM

---

### 4. **`test.ipynb`** - Pruebas y Análisis

#### ❌ Problemas Identificados

1. **Query SQL directo** (celda 2):
   ```python
   df_proyectos = pd.read_sql_query("SELECT codigo, anio_inicio, fase FROM proyectos", conn)
   ```
   - Campo `fase` ya no existe (ahora es `fase_id`)

2. **Agregación de costos**:
   - Asume que todos los costos están en el DataFrame
   - No considera estructura normalizada

#### ✅ Soluciones Propuestas

**Celda 2 - Actualizar query:**
```python
# Opción 1: SQL con JOIN
query = """
SELECT p.codigo, p.anio_inicio, f.nombre as fase 
FROM proyectos p
INNER JOIN fases f ON p.fase_id = f.id
"""
df_proyectos = pd.read_sql_query(query, conn)

# Opción 2: ORM
from app.models import Proyecto
proyectos = Proyecto.query.all()
df_proyectos = pd.DataFrame([{
    'codigo': p.codigo,
    'anio_inicio': p.anio_inicio,
    'fase': p.fase.nombre
} for p in proyectos])
```

**Agregación de costos:**
```python
# Calcular costo total por proyecto usando ORM
def get_project_total_cost(proyecto_id):
    from app.models import CostoItem
    total = db.session.query(func.sum(CostoItem.valor)).filter_by(
        proyecto_id=proyecto_id
    ).scalar()
    return total or 0

# Agregar al DataFrame
df_project['COSTO_TOTAL_VP'] = df_project['CÓDIGO'].apply(
    lambda codigo: get_project_total_cost(
        Proyecto.query.filter_by(codigo=codigo).first().id
    )
)
```

#### 📌 Cambios Específicos

- **Celda 2**: Actualizar query de proyectos
- **Celda 2**: Actualizar agregación de costos
- **Celda 3-4**: Verificar que las columnas de items coincidan con labels

---

## 🔧 Módulo `app.services.EDA`

### Cambios Necesarios

El módulo `EDA` (probablemente en `app/services/eda.py`) necesita actualizaciones mayores:

#### Métodos a Actualizar

1. **`assemble_projects_from_database()`**:
   - Reemplazar SQL raw con ORM queries
   - Manejar estructura normalizada de items

2. **`create_dataset()`**:
   - Verificar que funcione con nuevo formato de columnas
   - Actualizar mapeo de items

3. **`calculate_cost_per_km()`**:
   - Verificar compatibilidad con nuevos nombres de columnas

#### Ejemplo de Actualización

```python
class EDA:
    def assemble_projects_from_database(self, fase_id=None):
        """Ensamblar proyectos desde BD usando ORM"""
        from app.models import Proyecto, UnidadFuncional, CostoItem, ItemTipo, FaseItemRequerido
        
        query = Proyecto.query.options(
            joinedload(Proyecto.unidades_funcionales),
            joinedload(Proyecto.costos).joinedload(CostoItem.item_tipo),
            joinedload(Proyecto.fase)
        )
        
        if fase_id:
            query = query.filter(Proyecto.fase_id == fase_id)
        
        proyectos = query.all()
        
        rows = []
        for proyecto in proyectos:
            # Obtener labels de items para esta fase
            fase_items = {
                fi.item_tipo_id: fi.descripcion 
                for fi in proyecto.fase.items_requeridos
            }
            
            for uf in proyecto.unidades_funcionales:
                row = {
                    'NOMBRE DEL PROYECTO': proyecto.nombre,
                    'CÓDIGO DEL PROYECTO': proyecto.codigo,
                    'AÑO INICIO': proyecto.anio_inicio,
                    'FASE': proyecto.fase.nombre,
                    'DEPARTAMENTO': proyecto.ubicacion,
                    'LONGITUD KM': uf.longitud_km,
                    'PUENTES VEHICULARES UND': uf.puentes_vehiculares_und,
                    'PUENTES VEHICULARES M2': uf.puentes_vehiculares_mt2,
                    'PUENTES PEATONALES UND': uf.puentes_peatonales_und,
                    'PUENTES PEATONALES M2': uf.puentes_peatonales_mt2,
                    'TUNELES UND': uf.tuneles_und,
                    'TUNELES KM': uf.tuneles_km,
                    'ALCANCE': uf.alcance,
                    'ZONA': uf.zona,
                    'TIPO TERRENO': uf.tipo_terreno,
                    'NOMBRE UF': f'UF{uf.numero}'
                }
                
                # Agregar costos con labels correctos
                for costo in proyecto.costos:
                    label = fase_items.get(costo.item_tipo_id, costo.item_tipo.nombre)
                    row[label] = costo.valor
                
                rows.append(row)
        
        return pd.DataFrame(rows)
```

---

## 📊 Mapeo de Columnas de Items

### Problema

Los notebooks esperan columnas con formato específico (ej: `"1 - TRANSPORTE"`), pero ahora estos labels están en `FaseItemRequerido.descripcion`.

### Solución

Crear función de mapeo centralizada:

```python
def get_item_column_mapping(fase_id):
    """Obtener mapeo de ItemTipo.nombre → FaseItemRequerido.descripcion"""
    from app.models import FaseItemRequerido, ItemTipo
    
    fase_items = FaseItemRequerido.query.filter_by(fase_id=fase_id).join(ItemTipo).all()
    
    return {
        fi.item_tipo.nombre: fi.descripcion
        for fi in fase_items
    }

# Uso
mapping = get_item_column_mapping(fase_id=3)
# {'Transporte': '1 - TRANSPORTE', 'Geología': '3.1 - GEOLOGÍA', ...}
```

---

## ✅ Checklist de Migración

### Por Notebook

- [ ] **`eda.ipynb`**
  - [ ] Actualizar `load_dataframe_from_database()`
  - [ ] Verificar `create_dataset()`
  - [ ] Probar con datos reales

- [ ] **`machine_learning.ipynb`**
  - [ ] Actualizar carga de datos (celda 1)
  - [ ] Usar columnas dinámicas (celda 5)
  - [ ] Verificar entrenamiento de modelos

- [ ] **`reset_reload_db.ipynb`**
  - [ ] Reemplazar `drop_all_tables()`
  - [ ] Reemplazar `create_database()`
  - [ ] Actualizar lógica de inserción

- [ ] **`test.ipynb`**
  - [ ] Actualizar query de proyectos
  - [ ] Actualizar agregación de costos
  - [ ] Verificar visualizaciones

### Módulos de Soporte

- [ ] **`app/services/eda.py`**
  - [ ] Actualizar `assemble_projects_from_database()`
  - [ ] Actualizar `create_dataset()`
  - [ ] Crear función de mapeo de columnas

- [ ] **`app/services/present_value.py`**
  - [ ] Actualizar `fetch_incremento_from_database()`
  - [ ] Verificar compatibilidad con nuevo esquema

---

## 🚀 Orden de Migración Recomendado

1. **Primero**: Actualizar `app/services/eda.py` con nuevas funciones ORM
2. **Segundo**: Migrar `reset_reload_db.ipynb` para poder resetear BD
3. **Tercero**: Migrar `eda.ipynb` para análisis exploratorio
4. **Cuarto**: Migrar `machine_learning.ipynb` para modelos
5. **Quinto**: Migrar `test.ipynb` para pruebas finales

---

## 📚 Referencias

- **Modelos ORM**: `backend/app/models.py`
- **Script de Migración**: `backend/migrate_db.py`
- **Documentación de Esquema**: `backend/DB_REDESIGN.md` (si existe)
- **Colección Postman**: `backend/Road_Project_API.postman_collection.json`

---

## ⚠️ Notas Importantes

1. **Backup**: Siempre hacer backup de la BD antes de probar notebooks migrados
2. **Testing**: Probar cada notebook celda por celda después de migración
3. **Datos de Prueba**: Usar proyectos de prueba antes de trabajar con datos reales
4. **Performance**: Las queries ORM pueden ser más lentas que SQL raw - considerar optimización si es necesario
5. **Compatibilidad**: Mantener nombres de columnas Excel consistentes para no romper análisis existentes

---

## 🆘 Problemas Comunes

### Error: "Table 'item' doesn't exist"
**Solución**: Actualizar query SQL para usar `costo_item` en lugar de `item`

### Error: "Column 'fase' not found"
**Solución**: Usar `fase_id` o hacer JOIN con tabla `fases`

### Error: Columnas de items no coinciden
**Solución**: Usar función `get_item_column_mapping()` para mapeo dinámico

### Error: Datos duplicados en agregación
**Solución**: Verificar que la agregación por proyecto esté sumando correctamente los costos de todas las UFs

---

**Última actualización**: 30 de octubre de 2025
**Autor**: Cascade AI Assistant
**Versión**: 1.0
