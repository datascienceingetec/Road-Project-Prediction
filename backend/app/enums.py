"""
Enums for the application
Defines valid options for UnidadFuncional and other entities
"""
import enum


class AlcanceEnum(str, enum.Enum):
    """Alcance de la unidad funcional"""
    NUEVO = "Nuevo"
    SEGUNDA_CALZADA = "Segunda calzada"
    MEJORAMIENTO = "Mejoramiento"
    REHABILITACION = "Rehabilitación"
    PUESTA_A_PUNTO = "Puesta a punto"
    CONSTRUCCION = "Construcción"
    OPERACION_Y_MANTENIMIENTO = "operacion y mantenimiento"


class ZonaEnum(str, enum.Enum):
    """Zona de la unidad funcional"""
    URBANO = "Urbano"
    RURAL = "Rural"


class TipoTerrenoEnum(str, enum.Enum):
    """Tipo de terreno de la unidad funcional"""
    PLANO = "Plano"
    ONDULADO = "Ondulado"
    MONTANOSO = "Montañoso"
    ESCARPADO = "Escarpado"


# Helper function to get enum values as list of dicts
def get_enum_values(enum_class):
    """Returns enum values as a list of dicts with value and label"""
    return [{"value": item.value, "label": item.value} for item in enum_class]


# Export all enum values for API
ENUMS_CATALOG = {
    "alcance": get_enum_values(AlcanceEnum),
    "zona": get_enum_values(ZonaEnum),
    "tipo_terreno": get_enum_values(TipoTerrenoEnum),
}
