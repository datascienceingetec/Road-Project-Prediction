#!/usr/bin/env python
"""
Script de migración para transformar el esquema antiguo al nuevo esquema normalizado.
"""

import os
import sys
import sqlite3
import shutil
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.models import db, Fase, Proyecto, UnidadFuncional, ItemTipo, CostoItem, FaseItemRequerido, AnualIncrement
from app.config import Config

ITEM_FASE_MAPPING = {
    'fase_i': [
        'Transporte', 'Diseño Geométrico', 'Prefactibilidad Túneles',
        'Geología', 'Geotecnia', 'Hidrología e Hidráulica', 'Ambiental y Social',
        'Predial', 'Riesgos y Sostenibilidad', 'Evaluación Económica',
        'Socioeconómica y Financiera', 'Estructuras', 'Dirección y Coordinación'
    ],
    'fase_ii': [
        'Transporte', 'Topografía', 'Geología', 'Taludes',
        'Hidrología e Hidráulica', 'Estructuras', 'Túneles', 'Pavimento',
        'Predial', 'Ambiental y Social', 'Costos y Presupuestos',
        'Socioeconómica', 'Dirección y Coordinación'
    ],
    'fase_iii': [
        'Transporte', 'Información Geográfica', 'Trazado y Diseño Geométrico',
        'Seguridad Vial', 'Sistemas Inteligentes', 'Geología', 'Hidrogeología',
        'Suelos', 'Taludes', 'Pavimento', 'Socavación', 'Estructuras', 'Túneles',
        'Urbanismo y Paisajismo', 'Predial', 'Impacto Ambiental', 'Cantidades',
        'Evaluación Socioeconómica', 'Otros - Manejo de Redes', 'Dirección y Coordinación'
    ]
}

def backup_database():
    """Crear backup de la base de datos existente"""
    db_path = Config.DATABASE
    if os.path.exists(db_path):
        backup_path = db_path.replace('.db', f'_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.db')
        shutil.copy2(db_path, backup_path)
        print(f"✓ Base de datos respaldada en: {backup_path}")
        return True
    return False


def initialize_catalog_data(app):
    """Inicializar datos de catálogo (Fases, ItemTipo, FaseItemRequerido)"""
    with app.app_context():
        print("\n📋 Inicializando datos de catálogo...")
        
        # Crear Fases en orden específico
        fases_data = [
            {'nombre': 'Fase I - Prefactibilidad', 'descripcion': 'Estudios de prefactibilidad del proyecto vial'},
            {'nombre': 'Fase II - Factibilidad', 'descripcion': 'Estudios de factibilidad y diseño conceptual'},
            {'nombre': 'Fase III - Diseño Detallado', 'descripcion': 'Diseños de detalle y especificaciones técnicas'}
        ]
        
        fases = {}
        for fase_data in fases_data:
            fase = Fase.query.filter_by(nombre=fase_data['nombre']).first()
            if not fase:
                fase = Fase(**fase_data)
                db.session.add(fase)
                db.session.flush()  # Flush para obtener el ID
                print(f"  Fase creada: {fase.nombre} (ID: {fase.id})")
            else:
                print(f"  Fase existente: {fase.nombre} (ID: {fase.id})")
            fases[fase.nombre] = fase
        
        db.session.commit()
        print(f"✓ Creadas {len(fases)} fases")
        
        # Crear ItemTipo
        all_items = set()
        for items in ITEM_FASE_MAPPING.values():
            all_items.update(items)
        
        item_tipos = {}
        for item_name in sorted(all_items):
            item_tipo = ItemTipo.query.filter_by(nombre=item_name).first()
            if not item_tipo:
                item_tipo = ItemTipo(nombre=item_name, descripcion=f'Ítem de costo: {item_name}')
                db.session.add(item_tipo)
                db.session.flush()
            item_tipos[item_name] = item_tipo
        
        db.session.commit()
        print(f"✓ Creados {len(item_tipos)} item tipos")
        
        # Labels para cada item por fase
        ITEM_LABELS = {
            'fase_i': {
                "Transporte": "1 - TRANSPORTE",
                "Diseño Geométrico": "2 - DISEÑO GEOMÉTRICO",
                "Prefactibilidad Túneles": "3 - PREFACTIBILIDAD TÚNELES",
                "Geología": "4 - GEOLOGÍA",
                "Geotecnia": "5 - GEOTECNIA",
                "Hidrología e Hidráulica": "6 - HIDROLOGÍA E HIDRÁULICA",
                "Ambiental y Social": "7 - AMBIENTAL Y SOCIAL",
                "Predial": "8 - PREDIAL",
                "Riesgos y Sostenibilidad": "9 - RIESGOS Y SOSTENIBILIDAD",
                "Evaluación Económica": "10 - EVALUACIÓN ECONÓMICA",
                "Socioeconómica y Financiera": "11 - SOCIOECONÓMICA Y FINANCIERA",
                "Estructuras": "12 - ESTRUCTURAS",
                "Dirección y Coordinación": "13 - DIRECCIÓN Y COORDINACIÓN"
            },
            'fase_ii': {
                "Transporte": "1 - TRANSPORTE",
                "Topografía": "2 - TOPOGRAFÍA",
                "Geología": "3 - GEOLOGÍA",
                "Taludes": "4 - TALUDES",
                "Hidrología e Hidráulica": "5 - HIDROLOGÍA E HIDRÁULICA",
                "Estructuras": "6 - ESTRUCTURAS",
                "Túneles": "7 - TÚNELES",
                "Pavimento": "8 - PAVIMENTO",
                "Predial": "9 - PREDIAL",
                "Ambiental y Social": "10 - AMBIENTAL Y SOCIAL",
                "Costos y Presupuestos": "11 - COSTOS Y PRESUPUESTOS",
                "Socioeconómica": "12 - SOCIOECONÓMICA",
                "Dirección y Coordinación": "13 - DIRECCIÓN Y COORDINACIÓN"
            },
            'fase_iii': {
                "Transporte": "1 - TRANSPORTE",
                "Información Geográfica": "2.1 - INFORMACIÓN GEOGRÁFICA",
                "Trazado y Diseño Geométrico": "2.2 - TRAZADO Y DISEÑO GEOMÉTRICO",
                "Seguridad Vial": "2.3 - SEGURIDAD VIAL",
                "Sistemas Inteligentes": "2.4 - SISTEMAS INTELIGENTES",
                "Geología": "3.1 - GEOLOGÍA",
                "Hidrogeología": "3.2 - HIDROGEOLOGÍA",
                "Suelos": "4 - SUELOS",
                "Taludes": "5 - TALUDES",
                "Pavimento": "6 - PAVIMENTO",
                "Socavación": "7 - SOCAVACIÓN",
                "Estructuras": "8 - ESTRUCTURAS",
                "Túneles": "9 - TÚNELES",
                "Urbanismo y Paisajismo": "10 - URBANISMO Y PAISAJISMO",
                "Predial": "11 - PREDIAL",
                "Impacto Ambiental": "12 - IMPACTO AMBIENTAL",
                "Cantidades": "13 - CANTIDADES",
                "Evaluación Socioeconómica": "14 - EVALUACIÓN SOCIOECONÓMICA",
                "Otros - Manejo de Redes": "15 - OTROS - MANEJO DE REDES",
                "Dirección y Coordinación": "16 - DIRECCIÓN Y COORDINACIÓN"
            }
        }
        
        # Crear relaciones FaseItemRequerido
        fase_item_map = {
            'Fase I - Prefactibilidad': ('fase_i', ITEM_FASE_MAPPING['fase_i']),
            'Fase II - Factibilidad': ('fase_ii', ITEM_FASE_MAPPING['fase_ii']),
            'Fase III - Diseño Detallado': ('fase_iii', ITEM_FASE_MAPPING['fase_iii'])
        }
        
        count = 0
        for fase_nombre, (fase_key, items) in fase_item_map.items():
            fase = fases[fase_nombre]
            labels = ITEM_LABELS[fase_key]
            
            for item_name in items:
                item_tipo = item_tipos[item_name]
                existing = FaseItemRequerido.query.filter_by(
                    fase_id=fase.id,
                    item_tipo_id=item_tipo.id
                ).first()
                if not existing:
                    label = labels.get(item_name, item_name)
                    fase_item_req = FaseItemRequerido(
                        fase_id=fase.id,
                        item_tipo_id=item_tipo.id,
                        obligatorio=True,
                        descripcion=label
                    )
                    db.session.add(fase_item_req)
                    count += 1
        
        db.session.commit()
        print(f"✓ Creadas {count} relaciones fase-item")
        
        # Retornar IDs en lugar de objetos para evitar DetachedInstanceError
        fase_ids = {fase.nombre: fase.id for fase in fases.values()}
        item_tipo_ids = {item: item_tipo.id for item, item_tipo in item_tipos.items()}
        
        return fase_ids, item_tipo_ids


def read_old_data(backup_path):
    """Leer datos del backup de la base de datos antigua"""
    if not os.path.exists(backup_path):
        print("⚠ No hay datos antiguos para migrar")
        return None
    
    print("\n📖 Leyendo datos de la base de datos antigua...")
    conn = sqlite3.connect(backup_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    data = {
        'proyectos': [],
        'unidades_funcionales': [],
        'items_fase_i': [],
        'items_fase_ii': [],
        'items_fase_iii': [],
        'anual_increment': []
    }
    
    # Verificar qué tablas existen
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    
    if 'proyectos' in tables:
        cursor.execute('SELECT * FROM proyectos')
        data['proyectos'] = [dict(row) for row in cursor.fetchall()]
        print(f"  ✓ {len(data['proyectos'])} proyectos")
    
    if 'unidad_funcional' in tables:
        cursor.execute('SELECT * FROM unidad_funcional')
        data['unidades_funcionales'] = [dict(row) for row in cursor.fetchall()]
        print(f"  ✓ {len(data['unidades_funcionales'])} unidades funcionales")
    
    if 'item_fase_i' in tables:
        cursor.execute('SELECT * FROM item_fase_i')
        data['items_fase_i'] = [dict(row) for row in cursor.fetchall()]
        print(f"  ✓ {len(data['items_fase_i'])} items fase I")
    
    if 'item_fase_ii' in tables:
        cursor.execute('SELECT * FROM item_fase_ii')
        data['items_fase_ii'] = [dict(row) for row in cursor.fetchall()]
        print(f"  ✓ {len(data['items_fase_ii'])} items fase II")
    
    if 'item_fase_iii' in tables:
        cursor.execute('SELECT * FROM item_fase_iii')
        data['items_fase_iii'] = [dict(row) for row in cursor.fetchall()]
        print(f"  ✓ {len(data['items_fase_iii'])} items fase III")
    
    if 'anual_increment' in tables:
        cursor.execute('SELECT * FROM anual_increment')
        data['anual_increment'] = [dict(row) for row in cursor.fetchall()]
        print(f"  ✓ {len(data['anual_increment'])} incrementos anuales")
    
    conn.close()
    return data


def map_fase_string_to_id(fase_str, fase_ids):
    """Mapear string de fase antigua a fase_id nuevo"""
    if not fase_str:
        return fase_ids['Fase I - Prefactibilidad']
    
    fase_str_lower = fase_str.lower().strip()
    
    # Mapeo más específico - IMPORTANTE: evaluar Prefactibilidad ANTES que Factibilidad
    # porque "Prefactibilidad" contiene "factibilidad"
    if 'prefactibilidad' in fase_str_lower or 'fase_i' in fase_str_lower or fase_str_lower == 'i':
        return fase_ids['Fase I - Prefactibilidad']
    elif ('fase_iii' in fase_str_lower or fase_str_lower == 'iii' or 
          'diseño detallado' in fase_str_lower or 'diseno detallado' in fase_str_lower or
          'diseños a detalle' in fase_str_lower or 'disenos a detalle' in fase_str_lower):
        return fase_ids['Fase III - Diseño Detallado']
    elif 'fase_ii' in fase_str_lower or fase_str_lower == 'ii' or 'factibilidad' in fase_str_lower:
        return fase_ids['Fase II - Factibilidad']
    else:
        print(f"  ⚠ Fase desconocida '{fase_str}', asignando Fase I por defecto")
        return fase_ids['Fase I - Prefactibilidad']


def migrate_proyectos(old_data, fase_ids, app):
    """Migrar proyectos al nuevo esquema"""
    with app.app_context():
        print("\n🚀 Migrando proyectos...")
        proyecto_map = {}  # Map codigo -> proyecto object
        
        for old_proyecto in old_data['proyectos']:
            fase_str = old_proyecto.get('fase')
            fase_id = map_fase_string_to_id(fase_str, fase_ids)
            print(f"  Proyecto {old_proyecto['codigo']}: fase='{fase_str}' → fase_id={fase_id}")
            
            proyecto = Proyecto(
                codigo=old_proyecto['codigo'],
                nombre=old_proyecto['nombre'],
                anio_inicio=old_proyecto.get('anio_inicio'),
                duracion=old_proyecto.get('duracion'),
                longitud=old_proyecto.get('longitud'),
                ubicacion=old_proyecto.get('ubicacion'),
                lat_inicio=old_proyecto.get('lat_inicio'),
                lng_inicio=old_proyecto.get('lng_inicio'),
                lat_fin=old_proyecto.get('lat_fin'),
                lng_fin=old_proyecto.get('lng_fin'),
                fase_id=fase_id,
                created_at=datetime.fromisoformat(old_proyecto['created_at']) if old_proyecto.get('created_at') else datetime.utcnow()
            )
            db.session.add(proyecto)
            db.session.flush()
            proyecto_map[old_proyecto['codigo']] = proyecto.id
        
        db.session.commit()
        print(f"  ✓ Migrados {len(proyecto_map)} proyectos")
        return proyecto_map


def migrate_unidades_funcionales(old_data, proyecto_map, app):
    """Migrar unidades funcionales al nuevo esquema"""
    with app.app_context():
        print("\n🔧 Migrando unidades funcionales...")
        count = 0
        
        for old_uf in old_data['unidades_funcionales']:
            codigo = old_uf.get('codigo')
            if codigo not in proyecto_map:
                print(f"  ⚠ Proyecto '{codigo}' no encontrado para UF. Saltando.")
                continue
            
            proyecto_id = proyecto_map[codigo]
            
            uf = UnidadFuncional(
                proyecto_id=proyecto_id,
                numero=old_uf.get('unidad_funcional', 1),
                longitud_km=old_uf.get('longitud_km'),
                puentes_vehiculares_und=old_uf.get('puentes_vehiculares_und', 0),
                puentes_vehiculares_mt2=old_uf.get('puentes_vehiculares_mt2', 0),
                puentes_peatonales_und=old_uf.get('puentes_peatonales_und', 0),
                puentes_peatonales_mt2=old_uf.get('puentes_peatonales_mt2', 0),
                tuneles_und=old_uf.get('tuneles_und', 0),
                tuneles_km=old_uf.get('tuneles_km', 0),
                alcance=old_uf.get('alcance'),
                zona=old_uf.get('zona'),
                tipo_terreno=old_uf.get('tipo_terreno')
            )
            db.session.add(uf)
            count += 1
        
        db.session.commit()
        print(f"  ✓ Migradas {count} unidades funcionales")


def migrate_items_to_costos(old_data, proyecto_map, item_tipos, app):
    """Migrar items de costos de tablas antiguas a CostoItem"""
    with app.app_context():
        print("\n💰 Migrando costos de items...")
        
        # Mapeo de columnas antiguas a nombres de ItemTipo
        column_to_item_map = {
            'fase_i': {
                'transporte': 'Transporte',
                'diseno_geometrico': 'Diseño Geométrico',
                'prefactibilidad_tuneles': 'Prefactibilidad Túneles',
                'geologia': 'Geología',
                'geotecnia': 'Geotecnia',
                'hidrologia_hidraulica': 'Hidrología e Hidráulica',
                'ambiental_social': 'Ambiental y Social',
                'predial': 'Predial',
                'riesgos_sostenibilidad': 'Riesgos y Sostenibilidad',
                'evaluacion_economica': 'Evaluación Económica',
                'socioeconomica_financiera': 'Socioeconómica y Financiera',
                'estructuras': 'Estructuras',
                'direccion_coordinacion': 'Dirección y Coordinación'
            },
            'fase_ii': {
                'transporte': 'Transporte',
                'topografia': 'Topografía',
                'geologia': 'Geología',
                'taludes': 'Taludes',
                'hidrologia_hidraulica': 'Hidrología e Hidráulica',
                'estructuras': 'Estructuras',
                'tuneles': 'Túneles',
                'pavimento': 'Pavimento',
                'predial': 'Predial',
                'ambiental_social': 'Ambiental y Social',
                'costos_presupuestos': 'Costos y Presupuestos',
                'socioeconomica': 'Socioeconómica',
                'direccion_coordinacion': 'Dirección y Coordinación'
            },
            'fase_iii': {
                'transporte': 'Transporte',
                'informacion_geografica': 'Información Geográfica',
                'trazado_diseno_geometrico': 'Trazado y Diseño Geométrico',
                'seguridad_vial': 'Seguridad Vial',
                'sistemas_inteligentes': 'Sistemas Inteligentes',
                'geologia': 'Geología',
                'hidrogeologia': 'Hidrogeología',
                'suelos': 'Suelos',
                'taludes': 'Taludes',
                'pavimento': 'Pavimento',
                'socavacion': 'Socavación',
                'estructuras': 'Estructuras',
                'tuneles': 'Túneles',
                'urbanismo_paisajismo': 'Urbanismo y Paisajismo',
                'predial': 'Predial',
                'impacto_ambiental': 'Impacto Ambiental',
                'cantidades': 'Cantidades',
                'evaluacion_socioeconomica': 'Evaluación Socioeconómica',
                'otros_manejo_redes': 'Otros - Manejo de Redes',
                'direccion_coordinacion': 'Dirección y Coordinación'
            }
        }
        
        total_count = 0
        
        for fase_key in ['fase_i', 'fase_ii', 'fase_iii']:
            items_key = f'items_{fase_key}'
            if items_key not in old_data or not old_data[items_key]:
                continue
            
            column_map = column_to_item_map[fase_key]
            count = 0
            
            for old_item in old_data[items_key]:
                codigo = old_item.get('codigo')
                if codigo not in proyecto_map:
                    print(f"  ⚠ Proyecto '{codigo}' no encontrado para {fase_key}. Saltando.")
                    continue
                
                proyecto_id = proyecto_map[codigo]
                
                # Migrar cada columna de costo
                for column_name, item_name in column_map.items():
                    valor = old_item.get(column_name, 0)
                    if valor is None or valor <= 0:
                        continue
                    
                    if item_name not in item_tipos:
                        print(f"  ⚠ ItemTipo '{item_name}' no encontrado. Saltando.")
                        continue
                    
                    item_tipo_id = item_tipos[item_name]
                    
                    costo = CostoItem(
                        proyecto_id=proyecto_id,
                        item_tipo_id=item_tipo_id,
                        valor=float(valor)
                    )
                    db.session.add(costo)
                    count += 1
            
            db.session.commit()
            print(f"  ✓ Migrados {count} costos de {fase_key}")
            total_count += count
        
        print(f"  ✓ Total: {total_count} costos migrados")


def migrate_anual_increment(old_data, app):
    """Migrar incrementos anuales"""
    with app.app_context():
        print("\n📅 Migrando incrementos anuales...")
        
        if not old_data['anual_increment']:
            print("  ⚠ No hay datos de incrementos anuales")
            return
        
        count = 0
        
        for old_inc in old_data['anual_increment']:
            ano = old_inc.get('ano')
            valor = old_inc.get('valor', old_inc.get('0', 0))
            
            if ano is None:
                print(f"  ⚠ Registro sin año, saltando")
                continue
            
            increment = AnualIncrement(
                ano=ano,
                valor=float(valor) if valor else 0
            )
            db.session.add(increment)
            count += 1
        
        db.session.commit()
        print(f"  ✓ Migrados {count} incrementos anuales")


def main():
    print("="*60)
    print("SCRIPT DE MIGRACIÓN DE BASE DE DATOS")
    print("Esquema Antiguo → Esquema Normalizado")
    print("="*60)
    
    # Paso 1: Backup
    print("\n📦 Paso 1: Respaldando base de datos...")
    has_old_db = backup_database()
    
    # Obtener ruta del backup para leer datos antiguos
    backup_path = None
    if has_old_db:
        db_files = [f for f in os.listdir(Config.INSTANCE_DIR) if f.startswith('database_backup_') and f.endswith('.db')]
        if db_files:
            # Usar el backup más reciente
            db_files.sort(reverse=True)
            backup_path = os.path.join(Config.INSTANCE_DIR, db_files[0])
    
    # Paso 2: Leer datos antiguos ANTES de eliminar las tablas
    old_data = read_old_data(backup_path) if backup_path else None
    
    # Paso 3: Crear app y nuevo esquema
    print("\n🏗️  Paso 3: Creando nuevo esquema...")
    app = create_app()
    
    with app.app_context():
        print("  Eliminando tablas antiguas...")
        db.drop_all()
        print("  Creando nuevas tablas...")
        db.create_all()
        print("  ✓ Nuevo esquema creado")
    
    # Paso 4: Inicializar datos de catálogo
    print("\n📋 Paso 4: Inicializando datos de catálogo...")
    fase_ids, item_tipos = initialize_catalog_data(app)
    
    # Paso 5: Migrar datos si existen
    if old_data and any(old_data.values()):
        print("\n🔄 Paso 5: Migrando datos existentes...")
        proyecto_map = migrate_proyectos(old_data, fase_ids, app)
        migrate_unidades_funcionales(old_data, proyecto_map, app)
        migrate_items_to_costos(old_data, proyecto_map, item_tipos, app)
        migrate_anual_increment(old_data, app)
    else:
        print("\n⚠ Paso 5: No hay datos antiguos para migrar")
    
    # Paso 6: Eliminar tablas legacy
    print("\n🗑️  Paso 6: Eliminando tablas legacy...")
    with app.app_context():
        try:
            db.session.execute(db.text("DROP TABLE IF EXISTS item_fase_i"))
            db.session.execute(db.text("DROP TABLE IF EXISTS item_fase_ii"))
            db.session.execute(db.text("DROP TABLE IF EXISTS item_fase_iii"))
            db.session.commit()
            print("  ✓ Tablas legacy eliminadas")
        except Exception as e:
            print(f"  ⚠ Error eliminando tablas legacy: {e}")
    
    print("\n" + "="*60)
    print("✅ MIGRACIÓN COMPLETADA!")
    print("="*60)
    
    if old_data and any(old_data.values()):
        print("\n📊 Resumen de migración:")
        print(f"  • Proyectos: {len(old_data['proyectos'])}")
        print(f"  • Unidades Funcionales: {len(old_data['unidades_funcionales'])}")
        print(f"  • Items Fase I: {len(old_data['items_fase_i'])}")
        print(f"  • Items Fase II: {len(old_data['items_fase_ii'])}")
        print(f"  • Items Fase III: {len(old_data['items_fase_iii'])}")
        print(f"  • Incrementos Anuales: {len(old_data['anual_increment'])}")
    
    print("\nPróximos pasos:")
    print("1. Ejecutar: python run.py")
    print("2. Probar los endpoints de la API")
    print("3. Verificar que los datos se migraron correctamente")
    print("\n💾 Nota: Tu base de datos antigua ha sido respaldada.")
    print("="*60)


if __name__ == '__main__':
    main()