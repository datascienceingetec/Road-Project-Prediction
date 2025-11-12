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