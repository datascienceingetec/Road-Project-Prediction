"""
Prediction Service - Business logic for cost prediction
"""

from typing import Dict, Any, List
from app.services.model_service import ModelService
from app.models import FaseItemRequerido, ItemTipo, Fase
from app.utils.item_helpers import (
    sort_items_by_description,
    build_parent_child_map,
    get_parent_items,
    calculate_parent_values
)
from app.services.exceptions import BadRequest, MissingItemsError
from app.models import db


class PredictionService:
    """Service for cost prediction business logic"""
    
    def __init__(self):
        self.model_service = ModelService()
    
    def predict_cost(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main prediction method - orchestrates the entire prediction workflow
        
        Args:
            request_data: Dictionary with prediction request data:
                {
                    'proyecto_nombre': str,
                    'fase_id': int,
                    'ubicacion': str,
                    'unidades_funcionales': [...]
                }
        
        Returns:
            Dictionary with prediction results
            
        Raises:
            BadRequest: If validation fails
            MissingItemsError: If models not found
        """
        # 1. Validate request
        self._validate_request(request_data)
        
        # 2. Get phase and validate it exists
        fase_id = request_data['fase_id']
        fase = Fase.query.get(fase_id)
        if not fase:
            raise BadRequest(f"La fase con ID '{fase_id}' no fue encontrada.")
        
        # 3. Load models (adapter handles fase_id to code mapping)
        model_data = self.model_service.load_models(fase_id)
        if not model_data:
            raise MissingItemsError(
                f"No se encontraron modelos entrenados para la fase '{fase.nombre}'. "
                f"Por favor, entrene los modelos primero usando el endpoint /train."
            )
        
        models = model_data['models']
        
        # 4. Get required items for this phase
        items_requeridos = self._get_required_items(fase_id)
        
        # 5. Parse training summary for metrics
        training_summary = self.model_service.parse_training_summary(model_data)
        
        # 6. Process predictions for each functional unit
        results = self._predict_for_functional_units(
            fase_id=fase_id,
            models=models,
            unidades_funcionales=request_data['unidades_funcionales'],
            items_requeridos=items_requeridos,
            training_summary=training_summary
        )
        
        # 7. Build final response
        return self._build_response(
            proyecto_nombre=request_data.get('proyecto_nombre', ''),
            fase_id=fase_id,
            ubicacion=request_data.get('ubicacion', ''),
            results=results
        )
    
    def _validate_request(self, data: Dict[str, Any]) -> None:
        """Validate prediction request data"""
        if not data.get('fase_id'):
            raise BadRequest("El campo 'fase_id' es requerido.")
        
        if not data.get('unidades_funcionales'):
            raise BadRequest("Debe proporcionar al menos una unidad funcional.")
    
    def _get_required_items(self, phase_id: int) -> List[FaseItemRequerido]:
        """
        Get all required items for a phase, sorted by description
        
        Args:
            phase_id: Phase ID
            
        Returns:
            Sorted list of FaseItemRequerido objects
        """
        items_requeridos = (
            db.session.query(FaseItemRequerido)
            .filter_by(fase_id=phase_id)
            .join(ItemTipo)
            .all()
        )
        
        # Sort items by description (1, 2, 2.1, 2.2, 3, etc.)
        return sort_items_by_description(items_requeridos)
    
    def _predict_for_functional_units(
        self,
        fase_id: int,
        models: Dict[str, Any],
        unidades_funcionales: List[Dict[str, Any]],
        items_requeridos: List[FaseItemRequerido],
        training_summary: Dict[str, List[Dict[str, Any]]]
    ) -> Dict[str, Any]:
        """
        Process predictions for all functional units
        
        Returns:
            Dictionary with:
                - total_length: float
                - costo_total: float
                - resultados_por_uf: list
        """
        # Build parent-child relationships
        parent_child_map = build_parent_child_map(items_requeridos)
        parent_item_tipo_ids = get_parent_items(items_requeridos)
        
        results_por_uf = []
        total_length = 0.0
        costo_total_proyecto = 0.0
        
        for uf in unidades_funcionales:
            # Prepare prediction parameters
            pred_params = self._prepare_prediction_params(uf)
            uf_length = pred_params['longitud_km']
            total_length += uf_length
            
            # Make prediction for this UF (adapter handles fase_id to code mapping)
            predictions = self.model_service.adapter.predict(
                fase_id=fase_id,
                models=models,
                **pred_params
            )
            
            # Format items for this UF
            items_result, uf_total_cost = self._format_items_with_predictions(
                items_requeridos=items_requeridos,
                predictions=predictions,
                parent_item_tipo_ids=parent_item_tipo_ids,
                parent_child_map=parent_child_map,
                training_summary=training_summary,
                uf_alcance=pred_params['alcance']
            )
            
            # Calculate cost per km for this UF
            uf_cost_per_km = uf_total_cost / uf_length if uf_length > 0 else 0
            
            # Confidence based on model metadata (could be calculated per UF)
            confidence = 0.75
            
            results_por_uf.append({
                'unidad_funcional': uf.get('numero', len(results_por_uf) + 1),
                'longitud_km': uf_length,
                'alcance': pred_params['alcance'],
                'costo_estimado': round(uf_total_cost, 2),
                'costo_por_km': round(uf_cost_per_km, 2),
                'confianza': confidence,
                'items': items_result
            })
            
            costo_total_proyecto += uf_total_cost
        
        return {
            'total_length': total_length,
            'costo_total': costo_total_proyecto,
            'resultados_por_uf': results_por_uf
        }
    
    def _prepare_prediction_params(self, uf: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare parameters for prediction from functional unit data"""
        return {
            'codigo': '',
            'longitud_km': float(uf.get('longitud_km', 0)),
            'puentes_vehiculares_und': int(uf.get('puentes_vehiculares_und', 0)),
            'puentes_vehiculares_m2': float(uf.get('puentes_vehiculares_mt2', 0)),
            'puentes_peatonales_und': int(uf.get('puentes_peatonales_und', 0)),
            'puentes_peatonales_m2': float(uf.get('puentes_peatonales_mt2', 0)),
            'tuneles_und': int(uf.get('tuneles_und', 0)),
            'tuneles_km': float(uf.get('tuneles_km', 0)),
            'alcance': uf.get('alcance', '')
        }
    
    def _format_items_with_predictions(
        self,
        items_requeridos: List[FaseItemRequerido],
        predictions: Dict[str, float],
        parent_item_tipo_ids: set,
        parent_child_map: Dict[int, List[int]],
        training_summary: Dict[str, List[Dict[str, Any]]],
        uf_alcance: str
    ) -> tuple[List[Dict[str, Any]], float]:
        """
        Format items with predictions, calculate parent values, and attach metrics
        
        Returns:
            Tuple of (items_list, total_cost)
        """
        # Create a map of predictions by item name
        predictions_map = {name: value for name, value in predictions.items()}
        
        # First pass: Build items dict with predictions
        items_dict = {}
        uf_total_cost = 0.0
        
        for item_req in items_requeridos:
            item_tipo = item_req.item_tipo
            item_name = item_req.descripcion or item_tipo.nombre
            is_parent = item_tipo.id in parent_item_tipo_ids
            
            # Try to find prediction for this item
            predicted_value = None
            matched_pred_name = None
            
            if not is_parent:
                for pred_name, pred_value in predictions_map.items():
                    # Match by exact name or partial match
                    if (pred_name == item_name or 
                        pred_name in item_name or 
                        item_name in pred_name or
                        pred_name == item_tipo.nombre or
                        item_tipo.nombre in pred_name):
                        predicted_value = pred_value
                        matched_pred_name = pred_name
                        break
                
                # Add to total if there's a prediction
                if predicted_value is not None:
                    uf_total_cost += predicted_value
            
            # Get ALL metrics for this item (can have multiple alcances)
            metrics = None
            if matched_pred_name:
                # TODO: Remove this when the models are updated
                if matched_pred_name == "3.1 - GEOLOGÍA":
                    matched_pred_name = "3 - GEOLOGÍA"
                metrics_list = training_summary.get(matched_pred_name)
                if metrics_list:
                    print(f"✓ Found {len(metrics_list)} metric(s) for {matched_pred_name}")
                    metrics = metrics_list  # Return all metrics as array
                else:
                    print(f"✗ No metrics found for {matched_pred_name}")
            
            # Store in dict (will update parent values later)
            items_dict[item_tipo.id] = {
                'item': item_name,
                'item_tipo_id': item_tipo.id,
                'causacion_estimada': round(predicted_value, 2) if predicted_value is not None else 0,
                'metrics': metrics,
                'predicted': predicted_value is not None,
                'is_parent': is_parent
            }
        
        # Second pass: Calculate parent values
        for parent_id in parent_item_tipo_ids:
            if parent_id in items_dict:
                children_ids = parent_child_map.get(parent_id, [])
                parent_sum = sum(
                    items_dict[child_id]['causacion_estimada']
                    for child_id in children_ids
                    if child_id in items_dict
                )
                items_dict[parent_id]['causacion_estimada'] = round(parent_sum, 2)
                items_dict[parent_id]['predicted'] = False  # Parents are calculated, not predicted
        
        # Convert dict to list maintaining original order
        items_result = [
            items_dict[item_req.item_tipo.id]
            for item_req in items_requeridos
            if item_req.item_tipo.id in items_dict
        ]
        
        return items_result, uf_total_cost
    
    def _build_response(
        self,
        proyecto_nombre: str,
        fase_id: int,
        ubicacion: str,
        results: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Build final prediction response"""
        total_length = results['total_length']
        costo_total = results['costo_total']
        
        return {
            'proyecto_nombre': proyecto_nombre,
            'fase_id': fase_id,
            'ubicacion': ubicacion,
            'costo_total': round(costo_total, 2),
            'costo_total_por_km': round(costo_total / total_length, 2) if total_length > 0 else 0,
            'longitud_total_km': total_length,
            'num_unidades_funcionales': len(results['resultados_por_uf']),
            'resultados': results['resultados_por_uf']
        }
