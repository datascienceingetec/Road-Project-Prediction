from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, ForeignKey, DateTime, Enum as SQLEnum, select, func, text
from sqlalchemy.orm import relationship, column_property
from sqlalchemy.ext.hybrid import hybrid_property
from app.enums import AlcanceEnum, ZonaEnum, TipoTerrenoEnum, StatusEnum

db = SQLAlchemy()


class Fase(db.Model):
    """Tabla de fases del proyecto (Prefactibilidad, Factibilidad, Diseño Detallado)"""
    __tablename__ = 'fases'
    
    id = Column(Integer, primary_key=True)
    nombre = Column(String(100), nullable=False, unique=True)
    descripcion = Column(Text)
    
    # Relationships
    proyectos = relationship('Proyecto', back_populates='fase', lazy='dynamic')
    items_requeridos = relationship('FaseItemRequerido', back_populates='fase', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'descripcion': self.descripcion
        }


class Proyecto(db.Model):
    """Tabla principal de proyectos viales"""
    __tablename__ = 'proyectos'
    
    id = Column(Integer, primary_key=True)
    status = Column(SQLEnum(StatusEnum), default=StatusEnum.ACTIVE)
    codigo = Column(String(50), unique=True, nullable=False, index=True)
    nombre = Column(String(200), nullable=False)
    anio_inicio = Column(Integer)
    duracion = Column(Integer)
    # longitud is now computed from unidades_funcionales
    ubicacion = Column(String(200))
    lat_inicio = Column(Float)
    lng_inicio = Column(Float)
    lat_fin = Column(Float)
    lng_fin = Column(Float)
    fase_id = Column(Integer, ForeignKey('fases.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    fase = relationship('Fase', back_populates='proyectos')
    unidades_funcionales = relationship('UnidadFuncional', back_populates='proyecto', lazy='dynamic', cascade='all, delete-orphan')
    costos = relationship('CostoItem', back_populates='proyecto', lazy='dynamic', cascade='all, delete-orphan')
    
    # Computed properties
    @hybrid_property
    def longitud(self):
        """Computed: sum of longitud_km from all unidades_funcionales"""
        return db.session.query(func.coalesce(func.sum(UnidadFuncional.longitud_km), 0)).filter(
            UnidadFuncional.proyecto_id == self.id
        ).scalar() or 0
    
    @hybrid_property
    def num_unidades_funcionales(self):
        """Computed: count of unidades_funcionales"""
        return db.session.query(func.count(UnidadFuncional.id)).filter(
            UnidadFuncional.proyecto_id == self.id
        ).scalar() or 0
    
    def _calculate_costo_total(self):
        """Calculate total cost excluding parent items to avoid double counting"""
        # Use raw SQL to avoid circular import issues
        parent_item_tipo_ids_query = """
            SELECT DISTINCT fir_parent.item_tipo_id 
            FROM fase_item_requerido fir_parent
            WHERE fir_parent.fase_id = :fase_id 
            AND EXISTS (
                SELECT 1 FROM fase_item_requerido fir_child 
                WHERE fir_child.parent_id = fir_parent.id
            )
        """
        
        result = db.session.execute(
            text(parent_item_tipo_ids_query), 
            {'fase_id': self.fase_id}
        )
        parent_item_tipo_ids = {row[0] for row in result}
        
        # Sum only costs from non-parent items
        total = 0
        for costo in self.costos:
            if costo.item_tipo_id not in parent_item_tipo_ids:
                total += costo.valor
        
        return total
    
    def to_dict(self, include_relations=False):
        data = {
            'id': self.id,
            'codigo': self.codigo,
            'nombre': self.nombre,
            'anio_inicio': self.anio_inicio,
            'duracion': self.duracion,
            'longitud': self.longitud,
            'num_unidades_funcionales': self.num_unidades_funcionales,
            'ubicacion': self.ubicacion,
            'lat_inicio': self.lat_inicio,
            'lng_inicio': self.lng_inicio,
            'lat_fin': self.lat_fin,
            'lng_fin': self.lng_fin,
            'fase_id': self.fase_id,
            'fase': self.fase.to_dict() if self.fase else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'costo_total': self._calculate_costo_total()
        }
        
        if include_relations:
            data['unidades_funcionales'] = [uf.to_dict() for uf in self.unidades_funcionales]
            data['costos'] = [c.to_dict() for c in self.costos]
        
        return data


class UnidadFuncional(db.Model):
    """Unidades funcionales de un proyecto"""
    __tablename__ = 'unidad_funcional'
    
    id = Column(Integer, primary_key=True)
    proyecto_id = Column(Integer, ForeignKey('proyectos.id'), nullable=False)
    numero = Column(Integer, nullable=False)
    longitud_km = Column(Float)
    puentes_vehiculares_und = Column(Integer, default=0)
    puentes_vehiculares_mt2 = Column(Integer, default=0)
    puentes_peatonales_und = Column(Integer, default=0)
    puentes_peatonales_mt2 = Column(Integer, default=0)
    tuneles_und = Column(Integer, default=0)
    tuneles_km = Column(Float, default=0)
    alcance = Column(SQLEnum(AlcanceEnum), nullable=True)
    zona = Column(SQLEnum(ZonaEnum), nullable=True)
    tipo_terreno = Column(SQLEnum(TipoTerrenoEnum), nullable=True)
    geometry_json = Column(Text, nullable=True)  # GeoJSON geometry as text
    
    # Relationships
    proyecto = relationship('Proyecto', back_populates='unidades_funcionales')
    
    def to_dict(self, include_geometry=False):
        data = {
            'id': self.id,
            'proyecto_id': self.proyecto_id,
            'numero': self.numero,
            'longitud_km': self.longitud_km,
            'puentes_vehiculares_und': self.puentes_vehiculares_und,
            'puentes_vehiculares_mt2': self.puentes_vehiculares_mt2,
            'puentes_peatonales_und': self.puentes_peatonales_und,
            'puentes_peatonales_mt2': self.puentes_peatonales_mt2,
            'tuneles_und': self.tuneles_und,
            'tuneles_km': self.tuneles_km,
            'alcance': self.alcance.value if self.alcance else None,
            'zona': self.zona.value if self.zona else None,
            'tipo_terreno': self.tipo_terreno.value if self.tipo_terreno else None
        }
        if include_geometry and self.geometry_json:
            import json
            try:
                data['geometry'] = json.loads(self.geometry_json)
            except:
                data['geometry'] = None
        return data


class ItemTipo(db.Model):
    """Catálogo de tipos de ítems (Geología, Taludes, Pavimento, etc.)"""
    __tablename__ = 'item_tipo'
    
    id = Column(Integer, primary_key=True)
    nombre = Column(String(100), nullable=False, unique=True)
    descripcion = Column(Text)
    
    # Relationships
    costos = relationship('CostoItem', back_populates='item_tipo', lazy='dynamic')
    fases_requeridas = relationship('FaseItemRequerido', back_populates='item_tipo', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'descripcion': self.descripcion
        }


class FaseItemRequerido(db.Model):
    """Tabla de relación: qué ítems son requeridos en cada fase"""
    __tablename__ = 'fase_item_requerido'
    
    id = Column(Integer, primary_key=True)
    fase_id = Column(Integer, ForeignKey('fases.id'), nullable=False)
    item_tipo_id = Column(Integer, ForeignKey('item_tipo.id'), nullable=False)
    parent_id = Column(Integer, ForeignKey('fase_item_requerido.id'), nullable=True)
    obligatorio = Column(Boolean, default=True)
    descripcion = Column(Text)
    
    # Relationships
    fase = relationship('Fase', back_populates='items_requeridos')
    item_tipo = relationship('ItemTipo', back_populates='fases_requeridas')
    parent = relationship('FaseItemRequerido', remote_side=[id], backref='children')
    
    def to_dict(self, include_children=False):
        data = {
            'id': self.id,
            'fase_id': self.fase_id,
            'item_tipo_id': self.item_tipo_id,
            'parent_id': self.parent_id,
            'obligatorio': self.obligatorio,
            'descripcion': self.descripcion,
            'fase': self.fase.to_dict() if self.fase else None,
            'item_tipo': self.item_tipo.to_dict() if self.item_tipo else None,
            'has_children': bool(self.children)
        }
        if include_children:
            data['children'] = [child.to_dict() for child in self.children]
        return data


class CostoItem(db.Model):
    """Costos de cada ítem para un proyecto específico"""
    __tablename__ = 'costo_item'
    
    id = Column(Integer, primary_key=True)
    proyecto_id = Column(Integer, ForeignKey('proyectos.id'), nullable=False)
    item_tipo_id = Column(Integer, ForeignKey('item_tipo.id'), nullable=False)
    valor = Column(Float, nullable=False, default=0)
    
    # Relationships
    proyecto = relationship('Proyecto', back_populates='costos')
    item_tipo = relationship('ItemTipo', back_populates='costos')
    
    def to_dict(self):
        return {
            'id': self.id,
            'proyecto_id': self.proyecto_id,
            'item_tipo_id': self.item_tipo_id,
            'valor': self.valor,
            'item_tipo': self.item_tipo.to_dict() if self.item_tipo else None
        }


class AnualIncrement(db.Model):
    """Incrementos anuales para ajustes de costos"""
    __tablename__ = 'anual_increment'
    
    id = Column(Integer, primary_key=True)
    ano = Column(Integer, nullable=False, unique=True)
    valor = Column(Float, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'ano': self.ano,
            'valor': self.valor
        }
