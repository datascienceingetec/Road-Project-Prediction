import unicodedata
from app.models import AnualIncrement

def normalize_key(value: str) -> str:
    if not value:
        return ''
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    return ''.join(ch for ch in normalized.casefold() if ch.isalnum())


def calculate_present_value(past_value, past_year, present_year):
    """Calculate present value using annual increments from database"""
    if past_year is None or present_year <= past_year:
        return float(past_value)
    
    # Get annual increments
    increments = AnualIncrement.query.filter(
        AnualIncrement.ano > past_year,
        AnualIncrement.ano <= present_year
    ).order_by(AnualIncrement.ano).all()
    
    # Apply compound increments
    factor = 1.0
    for inc in increments:
        inc_value = inc.valor
        if inc_value > 1.0:
            inc_value = inc_value / 100.0
        factor *= (1.0 + inc_value)
    
    return float(past_value) * factor


def get_predictor_config(item_nombre: str) -> dict:
    """
    Obtiene la configuración de predictores específicos para cada tipo de ítem.
    
    Args:
        item_nombre: Nombre del ítem
        
    Returns:
        Dictionary con 'predictors' (lista de columnas) y 'name' (nombre del predictor)
    """
    # Normalizar nombre del ítem para comparación
    item_lower = item_nombre.lower()
    
    # Configuraciones específicas por ítem
    if 'suelos' in item_lower or '4 - suelos' in item_lower:
        return {
            'predictors': ['puentes_vehiculares_mt2'],
            'name': 'Puentes Vehiculares M²'
        }
    elif 'estructuras' in item_lower or '8 - estructuras' in item_lower:
        return {
            'predictors': ['puentes_vehiculares_und'],
            'name': 'Puentes Vehiculares (Unidades)'
        }
    elif 'túneles' in item_lower or 'tuneles' in item_lower or '9 - túneles' in item_lower:
        return {
            'predictors': ['tuneles_und', 'tuneles_km'],
            'name': 'Túneles (Unidades + Km)'
        }
    elif 'urbanismo' in item_lower or 'paisajismo' in item_lower or '10 - urbanismo' in item_lower:
        return {
            'predictors': ['puentes_peatonales_und'],
            'name': 'Puentes Peatonales (Unidades)'
        }
    elif 'cantidades' in item_lower or '13 - cantidades' in item_lower:
        return {
            'predictors': ['puentes_vehiculares_und', 'puentes_vehiculares_mt2', 'puentes_peatonales_und'],
            'name': 'Puentes Combinados'
        }
    else:
        # Por defecto usar longitud
        return {
            'predictors': ['longitud_km'],
            'name': 'Longitud (Km)'
        }


def calculate_predictor_value(row, predictor_columns: list) -> float:
    """
    Calcula el valor del predictor basado en las columnas especificadas.
    
    Args:
        row: Fila de datos del query
        predictor_columns: Lista de columnas a usar como predictores
        
    Returns:
        Valor calculado del predictor
    """
    total_value = 0.0
    
    for column in predictor_columns:
        value = getattr(row, column, 0) or 0
        total_value += float(value)
    
    return total_value