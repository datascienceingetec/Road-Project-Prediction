
import sqlite3
from flask import current_app
from app.config import Config

def get_db():
    try:
        db_path = current_app.config["DATABASE"]
    except RuntimeError:
        db_path = Config.DATABASE

    db = sqlite3.connect(db_path)
    db.row_factory = sqlite3.Row
    return db

class Proyecto:
    @staticmethod
    def get_all():
        db = get_db()
        print(db)
        proyectos = db.execute('SELECT * FROM proyectos ORDER BY created_at DESC').fetchall()
        db.close()
        return [dict(p) for p in proyectos]
    
    @staticmethod
    def get_by_id(proyecto_id):
        db = get_db()
        proyecto = db.execute('SELECT * FROM proyectos WHERE id = ?', (proyecto_id,)).fetchone()
        db.close()
        return dict(proyecto) if proyecto else None
    
    @staticmethod
    def get_by_codigo(codigo):
        db = get_db()
        proyecto = db.execute('SELECT * FROM proyectos WHERE codigo = ?', (codigo,)).fetchone()
        db.close()
        return dict(proyecto) if proyecto else None
    
    @staticmethod
    def create(data):
        db = get_db()
        cursor = db.execute('''
            INSERT INTO proyectos (nombre, codigo, num_ufs, longitud, anio_inicio, duracion, fase, ubicacion, costo, lat_inicio, lng_inicio, lat_fin, lng_fin)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['nombre'], data['codigo'], data['num_ufs'], data['longitud'],
            data['anio_inicio'], data['duracion'], data['fase'], data['ubicacion'],
            data['costo'], data['lat_inicio'], data['lng_inicio'], data['lat_fin'], data['lng_fin']
        ))
        db.commit()
        proyecto_id = cursor.lastrowid
        db.close()
        return proyecto_id
    
    @staticmethod
    def update(proyecto_id, data):
        db = get_db()
        db.execute('''
            UPDATE proyectos 
            SET nombre=?, codigo=?, num_ufs=?, longitud=?, anio_inicio=?, duracion=?, fase=?, ubicacion=?, costo=?, lat_inicio=?, lng_inicio=?, lat_fin=?, lng_fin=?
            WHERE id=?
        ''', (
            data['nombre'], data['codigo'], data['num_ufs'], data['longitud'],
            data['anio_inicio'], data['duracion'], data['fase'], data['ubicacion'],
            data['costo'], data['lat_inicio'], data['lng_inicio'], data['lat_fin'], data['lng_fin'],
            proyecto_id
        ))
        db.commit()
        db.close()
    
    @staticmethod
    def delete(proyecto_id):
        db = get_db()
        db.execute('DELETE FROM proyectos WHERE id = ?', (proyecto_id,))
        db.commit()
        db.close()


class UnidadFuncional:
    @staticmethod
    def get_by_codigo(codigo):
        db = get_db()
        ufs = db.execute('SELECT * FROM unidad_funcional WHERE codigo = ? ORDER BY unidad_funcional', (codigo,)).fetchall()
        db.close()
        return [dict(uf) for uf in ufs]
    
    @staticmethod
    def create(data):
        db = get_db()
        cursor = db.execute('''
            INSERT INTO unidad_funcional (codigo, unidad_funcional, longitud_km, puentes_vehiculares_und, puentes_vehiculares_mt2,
                                         puentes_peatonales_und, puentes_peatonales_mt2, tuneles_und, tuneles_km, alcance, zona, tipo_terreno)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['codigo'], data['unidad_funcional'], data['longitud_km'], data['puentes_vehiculares_und'],
            data['puentes_vehiculares_mt2'], data['puentes_peatonales_und'], data['puentes_peatonales_mt2'],
            data['tuneles_und'], data['tuneles_km'], data['alcance'], data['zona'], data['tipo_terreno']
        ))
        db.commit()
        uf_id = cursor.lastrowid
        db.close()
        return uf_id
    
    @staticmethod
    def delete(uf_id):
        db = get_db()
        db.execute('DELETE FROM unidad_funcional WHERE id = ?', (uf_id,))
        db.commit()
        db.close()


class Item:
    """Clase base para los modelos de ítems por fase (manejo CRUD genérico)."""

    TABLE_NAME = None       # Debe definirse en la subclase
    ITEM_COLUMNS = []       # Lista de columnas (excluye 'codigo')
    ITEM_LABELS = {}        # Etiquetas legibles

    @classmethod
    def get_by_codigo(cls, codigo):
        """Obtiene un registro por código."""
        db = get_db()
        query = f"SELECT * FROM {cls.TABLE_NAME} WHERE codigo = ?"
        row = db.execute(query, (codigo,)).fetchone()
        db.close()
        return dict(row) if row else None

    @classmethod
    def create(cls, data):
        """Crea un nuevo registro basado en data (dict)."""
        db = get_db()
        columns = ['codigo'] + cls.ITEM_COLUMNS
        placeholders = ', '.join(['?'] * len(columns))
        col_names = ', '.join(columns)
        values = [data.get('codigo')] + [data.get(c, 0) for c in cls.ITEM_COLUMNS]

        cursor = db.execute(
            f"INSERT INTO {cls.TABLE_NAME} ({col_names}) VALUES ({placeholders})",
            values
        )
        db.commit()
        new_id = cursor.lastrowid
        db.close()
        return new_id

    @classmethod
    def update(cls, codigo, data):
        """Actualiza un registro existente."""
        db = get_db()
        set_clause = ', '.join([f"{col} = ?" for col in cls.ITEM_COLUMNS])
        values = [data.get(col, 0) for col in cls.ITEM_COLUMNS] + [codigo]

        db.execute(
            f"UPDATE {cls.TABLE_NAME} SET {set_clause} WHERE codigo = ?",
            values
        )
        db.commit()
        db.close()

    @classmethod
    def delete(cls, codigo):
        """Elimina un registro por código."""
        db = get_db()
        db.execute(f"DELETE FROM {cls.TABLE_NAME} WHERE codigo = ?", (codigo,))
        db.commit()
        db.close()


class ItemFaseI(Item):
    """Model for Fase I - Prefactibilidad items (13 fields)"""
    TABLE_NAME = "item_fase_i"
    ITEM_COLUMNS = [
        "transporte", "diseno_geometrico", "prefactibilidad_tuneles",
        "geologia", "geotecnia", "hidrologia_hidraulica", "ambiental_social",
        "predial", "riesgos_sostenibilidad", "evaluacion_economica",
        "socioeconomica_financiera", "estructuras", "direccion_coordinacion"
    ]
    ITEM_LABELS = {
        "transporte": "1 - TRANSPORTE",
        "diseno_geometrico": "2 - DISEÑO GEOMÉTRICO",
        "prefactibilidad_tuneles": "3 - PREFACTIBILIDAD TÚNELES",
        "geologia": "4 - GEOLOGÍA",
        "geotecnia": "5 - GEOTECNIA",
        "hidrologia_hidraulica": "6 - HIDROLOGÍA E HIDRÁULICA",
        "ambiental_social": "7 - AMBIENTAL Y SOCIAL",
        "predial": "8 - PREDIAL",
        "riesgos_sostenibilidad": "9 - RIESGOS Y SOSTENIBILIDAD",
        "evaluacion_economica": "10 - EVALUACIÓN ECONÓMICA",
        "socioeconomica_financiera": "11 - SOCIOECONÓMICA Y FINANCIERA",
        "estructuras": "12 - ESTRUCTURAS",
        "direccion_coordinacion": "13 - DIRECCIÓN Y COORDINACIÓN"
    }


class ItemFaseII(Item):
    """Model for Fase II - Factibilidad items (13 fields, with aggregated subcomponents)"""
    TABLE_NAME = "item_fase_ii"
    ITEM_COLUMNS = [
        "transporte", "topografia", "geologia", "taludes",
        "hidrologia_hidraulica", "estructuras", "tuneles", "pavimento",
        "predial", "ambiental_social", "costos_presupuestos",
        "socioeconomica", "direccion_coordinacion"
    ]
    ITEM_LABELS = {
        "transporte": "1 - TRANSPORTE",
        "topografia": "2 - TOPOGRAFÍA",
        "geologia": "3 - GEOLOGÍA",
        "taludes": "4 - TALUDES",
        "hidrologia_hidraulica": "5 - HIDROLOGÍA E HIDRÁULICA",
        "estructuras": "6 - ESTRUCTURAS",
        "tuneles": "7 - TÚNELES",
        "pavimento": "8 - PAVIMENTO",
        "predial": "9 - PREDIAL",
        "ambiental_social": "10 - AMBIENTAL Y SOCIAL",
        "costos_presupuestos": "11 - COSTOS Y PRESUPUESTOS",
        "socioeconomica": "12 - SOCIOECONÓMICA",
        "direccion_coordinacion": "13 - DIRECCIÓN Y COORDINACIÓN"
    }


class ItemFaseIII(Item):
    """Model for Fase III - Diseños a detalle items (20 fields, parent headers skipped)"""
    TABLE_NAME = "item_fase_iii"
    ITEM_COLUMNS = [
        "transporte", "informacion_geografica", "trazado_diseno_geometrico",
        "seguridad_vial", "sistemas_inteligentes", "geologia", "hidrogeologia",
        "suelos", "taludes", "pavimento", "socavacion", "estructuras", "tuneles",
        "urbanismo_paisajismo", "predial", "impacto_ambiental", "cantidades",
        "evaluacion_socioeconomica", "otros_manejo_redes", "direccion_coordinacion"
    ]
    ITEM_LABELS = {
        "transporte": "1 - TRANSPORTE",
        "informacion_geografica": "2.1 - INFORMACIÓN GEOGRÁFICA",
        "trazado_diseno_geometrico": "2.2 - TRAZADO Y DISEÑO GEOMÉTRICO",
        "seguridad_vial": "2.3 - SEGURIDAD VIAL",
        "sistemas_inteligentes": "2.4 - SISTEMAS INTELIGENTES",
        "geologia": "3.1 - GEOLOGÍA",
        "hidrogeologia": "3.2 - HIDROGEOLOGÍA",
        "suelos": "4 - SUELOS",
        "taludes": "5 - TALUDES",
        "pavimento": "6 - PAVIMENTO",
        "socavacion": "7 - SOCAVACIÓN",
        "estructuras": "8 - ESTRUCTURAS",
        "tuneles": "9 - TÚNELES",
        "urbanismo_paisajismo": "10 - URBANISMO Y PAISAJISMO",
        "predial": "11 - PREDIAL",
        "impacto_ambiental": "12 - IMPACTO AMBIENTAL",
        "cantidades": "13 - CANTIDADES",
        "evaluacion_socioeconomica": "14 - EVALUACIÓN SOCIOECONÓMICA",
        "otros_manejo_redes": "15 - OTROS - MANEJO DE REDES",
        "direccion_coordinacion": "16 - DIRECCIÓN Y COORDINACIÓN"
    }

ITEM_MODELS = {
    'fase_i': ItemFaseI,
    'fase_ii': ItemFaseII,
    'fase_iii': ItemFaseIII
}