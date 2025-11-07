"""
Helper functions for FaseItemRequerido operations.
Centralizes logic for sorting and parent-child calculations.
"""
import re
from typing import List, Dict, Any


def parse_item_order(descripcion: str) -> float:
    """
    Extract the numeric order from item description.
    
    Examples:
        "1 - TRANSPORTE" -> 1.0
        "2.3 - SEGURIDAD VIAL" -> 2.3
        "16 - DIRECCIÓN" -> 16.0
        "Sin número" -> 9999.0 (sent to end)
    
    Args:
        descripcion: Item description string
        
    Returns:
        Float representing the order number
    """
    if not descripcion:
        return 9999.0
    
    match = re.match(r"(\d+(?:\.\d+)?)", descripcion.strip())
    return float(match.group(1)) if match else 9999.0


def sort_items_by_description(items: List[Any]) -> List[Any]:
    """
    Sort items by their description field using parse_item_order.
    
    Args:
        items: List of objects with 'descripcion' attribute
        
    Returns:
        Sorted list of items
    """
    return sorted(items, key=lambda item: parse_item_order(
        item.descripcion if hasattr(item, 'descripcion') else item.get('descripcion', '')
    ))


def calculate_parent_values(items_with_costs: List[Dict[str, Any]], 
                           parent_child_map: Dict[int, List[int]]) -> Dict[int, float]:
    """
    Calculate parent item values as sum of their children.
    
    Args:
        items_with_costs: List of dicts with 'item_tipo_id' and 'valor' or 'causacion_estimada' keys
        parent_child_map: Dict mapping parent_id -> [child_ids]
        
    Returns:
        Dict mapping parent_id -> calculated_sum
    """
    parent_values = {}
    
    # Create a lookup for quick access to item values
    # Support both 'valor' (from CostoItem) and 'causacion_estimada' (from predictions)
    item_values = {}
    for item in items_with_costs:
        item_tipo_id = item['item_tipo_id']
        value = item.get('valor') or item.get('causacion_estimada', 0)
        item_values[item_tipo_id] = value
    
    for parent_id, child_ids in parent_child_map.items():
        total = sum(item_values.get(child_id, 0) for child_id in child_ids)
        parent_values[parent_id] = total
    
    return parent_values


def build_parent_child_map(fase_items: List[Any]) -> Dict[int, List[int]]:
    """
    Build a mapping of parent items to their children.

    Args:
        fase_items: List of FaseItemRequerido objects or dicts with 'parent_id' and 'item_tipo_id'

    Returns:
        Dict mapping parent_item_tipo_id -> [child_item_tipo_ids]
    """
    parent_map = {}

    for item in fase_items:
        # Handle both dict and object access
        parent_id = None
        if hasattr(item, 'parent_id'):  # SQLAlchemy model
            parent_id = item.parent_id
            item_tipo_id = item.item_tipo_id
        elif isinstance(item, dict):  # Dictionary
            parent_id = item.get('parent_id')
            item_tipo_id = item.get('item_tipo_id')
        else:
            continue  # Skip invalid items

        if parent_id:
            # Find the parent's item_tipo_id
            parent_item = next(
                (i for i in fase_items 
                 if ((hasattr(i, 'id') and i.id == parent_id) or 
                     (isinstance(i, dict) and i.get('id') == parent_id))),
                None
            )
            if parent_item:
                # Get parent's item_tipo_id
                if hasattr(parent_item, 'item_tipo_id'):  # SQLAlchemy model
                    parent_item_tipo_id = parent_item.item_tipo_id
                else:  # Dictionary
                    parent_item_tipo_id = parent_item.get('item_tipo_id')

                # Get child's item_tipo_id
                if hasattr(item, 'item_tipo_id'):  # SQLAlchemy model
                    child_item_tipo_id = item.item_tipo_id
                else:  # Dictionary
                    child_item_tipo_id = item.get('item_tipo_id')

                if parent_item_tipo_id is not None and child_item_tipo_id is not None:
                    if parent_item_tipo_id not in parent_map:
                        parent_map[parent_item_tipo_id] = []
                    parent_map[parent_item_tipo_id].append(child_item_tipo_id)

    return parent_map


def get_parent_items(fase_items: List[Any]) -> set:
    """
    Get set of item_tipo_ids that are parents (have children).
    
    Args:
        fase_items: List of FaseItemRequerido objects or dicts
        
    Returns:
        Set of parent item_tipo_ids
    """
    parent_map = build_parent_child_map(fase_items)
    return set(parent_map.keys())
