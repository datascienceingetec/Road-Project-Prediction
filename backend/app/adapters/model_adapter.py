"""
Model Adapter Pattern for Legacy Model Management

This module provides an adapter interface to facilitate future migration
from the old database schema to the new one. It encapsulates the legacy
ModelsManagement service and provides a clean interface for training and prediction.

Future improvements:
- Replace LegacyModelAdapter with NewSchemaModelAdapter
- Add support for dynamic model selection based on fase_id
- Implement model versioning and A/B testing
"""

import pickle
from pathlib import Path
from typing import Dict, Any, Optional
from abc import ABC, abstractmethod
import pandas as pd

from app.services import ModelsManagement
from app.models import Fase


class ModelAdapterInterface(ABC):
    """
    Abstract interface for model adapters.
    Works with fase_id from the current domain model.
    Implementations handle their own internal mappings if needed.
    """
    
    @abstractmethod
    def train_models(self, fase_id: int) -> Dict[str, Any]:
        """
        Train models for a specific phase.
        
        Args:
            fase_id: Phase ID from database
            
        Returns:
            Dictionary containing trained models and metadata
        """
        pass
    
    @abstractmethod
    def predict(self, fase_id: int, models: Dict[str, Any], **kwargs) -> Dict[str, float]:
        """
        Make predictions using trained models.
        
        Args:
            fase_id: Phase ID from database
            models: Trained models dictionary
            **kwargs: Prediction parameters (longitud_km, alcance, etc.)
            
        Returns:
            Dictionary with item predictions
        """
        pass
    
    @abstractmethod
    def save_models(self, fase_id: int, models: Dict[str, Any], metadata: Optional[Dict] = None, summary_df=None) -> str:
        """
        Save trained models to disk.
        
        Args:
            fase_id: Phase ID from database
            models: Trained models dictionary
            metadata: Optional metadata to save with models
            summary_df: Optional training summary DataFrame
            
        Returns:
            Path to saved model file
        """
        pass
    
    @abstractmethod
    def load_models(self, fase_id: int) -> Optional[Dict[str, Any]]:
        """
        Load trained models from disk.
        
        Args:
            fase_id: Phase ID from database
            
        Returns:
            Trained models dictionary or None if not found
        """
        pass
    
    @abstractmethod
    def get_historical_data(self, fase_id: int) -> pd.DataFrame:
        """
        Get historical project data for charts and analysis.
        
        Args:
            fase_id: Phase ID from database
            
        Returns:
            DataFrame with standardized column names:
            - codigo: str
            - nombre_proyecto: str
            - alcance: str
            - longitud_km: float
            - puentes_vehiculares_und: int
            - puentes_vehiculares_m2: float
            - puentes_peatonales_und: int
            - puentes_peatonales_m2: float
            - tuneles_und: int
            - tuneles_km: float
            - [item columns with normalized names]
        """
        pass
    
    @abstractmethod
    def get_comparison_data(self, fase_id: int, item_name: str) -> Dict[str, Any]:
        """
        Get real vs predicted comparison data for a specific item.
        
        Args:
            fase_id: Phase ID from database
            item_name: Name of the item to compare
            
        Returns:
            Dictionary with:
            - historical_data: DataFrame with project data
            - item_column: str (name of the column containing the item values)
            - models: Dict (trained models for predictions)
        """
        pass


class LegacyModelAdapter(ModelAdapterInterface):
    """
    Adapter for legacy ModelsManagement service.
    Uses the old database schema and hardcoded logic.
    Handles mapping from fase_id (database) to fase code (legacy system).
    """
    
    # Mapping from phase names to legacy codes
    PHASE_NAME_TO_CODE = {
        'Prefactibilidad': 'I',
        'Factibilidad': 'II',
        'Diseño Detallado': 'III'
    }
    
    def __init__(self, models_dir: str = "data/models"):
        """
        Initialize the legacy model adapter.
        
        Args:
            models_dir: Directory to store trained models
        """
        self.models_dir = Path(models_dir)
        self.models_dir.mkdir(parents=True, exist_ok=True)
    
    def _map_fase_id_to_code(self, fase_id: int) -> str:
        """
        Map database fase_id to legacy fase code.
        
        Args:
            fase_id: Phase ID from database
            
        Returns:
            Legacy fase code ('I', 'II', 'III')
            
        Raises:
            ValueError: If fase not found or not supported
        """
        fase = Fase.query.get(fase_id)
        if not fase:
            raise ValueError(f"Fase con ID '{fase_id}' no encontrada.")
        
        # Try to map fase name to code
        for name_key, code in self.PHASE_NAME_TO_CODE.items():
            if name_key.lower() in fase.nombre.lower():
                return code
        
        raise ValueError(f"Fase '{fase.nombre}' no está soportada para predicciones.")
    
    # Implementation of ModelAdapterInterface
    def train_models(self, fase_id: int) -> Dict[str, Any]:
        """
        Train models using fase_id from database.
        Implements ModelAdapterInterface.
        
        Args:
            fase_id: Phase ID from database
            
        Returns:
            Dictionary with 'models', 'summary_df', and 'metadata'
        """
        fase_code = self._map_fase_id_to_code(fase_id)
        return self._train_models_legacy(fase_code)
    
    def load_models(self, fase_id: int) -> Optional[Dict[str, Any]]:
        """
        Load models using fase_id from database.
        Implements ModelAdapterInterface.
        
        Args:
            fase_id: Phase ID from database
            
        Returns:
            Trained models dictionary or None if not found
        """
        fase_code = self._map_fase_id_to_code(fase_id)
        return self._load_models_legacy(fase_code)
    
    def predict(self, fase_id: int, models: Dict[str, Any], **kwargs) -> Dict[str, float]:
        """
        Make predictions using fase_id from database.
        Implements ModelAdapterInterface.
        
        Args:
            fase_id: Phase ID from database
            models: Trained models dictionary
            **kwargs: Prediction parameters
            
        Returns:
            Dictionary with item predictions
        """
        fase_code = self._map_fase_id_to_code(fase_id)
        return self._predict_legacy(fase_code, models, **kwargs)
    
    def save_models(self, fase_id: int, models: Dict[str, Any], metadata: Optional[Dict] = None, summary_df=None) -> str:
        """
        Save trained models to disk using fase_id.
        Implements ModelAdapterInterface.
        
        Args:
            fase_id: Phase ID from database
            models: Trained models dictionary
            metadata: Optional metadata
            summary_df: Optional training summary DataFrame
            
        Returns:
            Path to saved model file
        """
        fase_code = self._map_fase_id_to_code(fase_id)
        return self._save_models_legacy(fase_code, models, metadata, summary_df)
    
    def get_historical_data(self, fase_id: int) -> pd.DataFrame:
        """
        Get historical project data with standardized column names.
        Implements ModelAdapterInterface.
        
        Args:
            fase_id: Phase ID from database
            
        Returns:
            DataFrame with normalized column names
        """
        fase_code = self._map_fase_id_to_code(fase_id)
        mm = ModelsManagement(fase_code)
        df = mm.prepare_data()
        
        # Normalize column names to standard format
        column_mapping = {
            'CÓDIGO': 'codigo',
            'NOMBRE DEL PROYECTO': 'nombre_proyecto',
            'ALCANCE': 'alcance',
            'LONGITUD KM': 'longitud_km',
            'PUENTES VEHICULARES UND': 'puentes_vehiculares_und',
            'PUENTES VEHICULARES M2': 'puentes_vehiculares_m2',
            'PUENTES PEATONALES UND': 'puentes_peatonales_und',
            'PUENTES PEATONALES M2': 'puentes_peatonales_m2',
            'TUNELES UND': 'tuneles_und',
            'TUNELES KM': 'tuneles_km'
        }
        
        # Rename columns that exist
        df = df.rename(columns=column_mapping)
        
        # Ensure required columns exist
        required_columns = list(column_mapping.values())
        for col in required_columns:
            if col not in df.columns:
                df[col] = 0
        
        return df
    
    def get_comparison_data(self, fase_id: int, item_name: str) -> Dict[str, Any]:
        """
        Get real vs predicted comparison data for a specific item.
        Implements ModelAdapterInterface.
        
        Args:
            fase_id: Phase ID from database
            item_name: Name of the item to compare
            
        Returns:
            Dictionary with historical data, item column, and models
        """
        # Get historical data
        df = self.get_historical_data(fase_id)
        
        # Load models
        model_data = self.load_models(fase_id)
        if not model_data:
            raise ValueError(f"No trained models found for fase_id {fase_id}")
        
        models = model_data['models']
        
        # Find the item column in the DataFrame
        item_column = None
        for col in df.columns:
            if col == item_name or item_name in col or col in item_name:
                item_column = col
                break
        
        if not item_column:
            raise ValueError(f"Item '{item_name}' not found in historical data")
        
        return {
            'historical_data': df,
            'item_column': item_column,
            'models': models
        }
    
    # Legacy implementation methods (private)
    def _train_models_legacy(self, fase: str) -> Dict[str, Any]:
        """
        Train models using legacy ModelsManagement service.
        
        Args:
            fase: Phase identifier ('II' or 'III')
            
        Returns:
            Dictionary with 'models', 'summary_df', and 'metadata'
        """
        mm = ModelsManagement(fase)
        df_vp = mm.prepare_data()
        
        if fase == 'III':
            results, summary_df = mm.train_models()
        elif fase == 'II' or fase == 'I':
            raise NotImplementedError(f"Fase '{fase}' training not yet implemented")
        else:
            raise ValueError(f"Fase '{fase}' no soportada")
        
        return {
            'models': results,
            'summary_df': summary_df,
            'metadata': {
                'fase': fase,
                'n_samples': len(df_vp),
                'training_date': pd.Timestamp.now().isoformat()
            }
        }
    
    def _predict_legacy(self, fase: str, models: Dict[str, Any], **kwargs) -> Dict[str, float]:
        """
        Make predictions using trained models.
        
        Args:
            fase: Phase identifier
            models: Trained models dictionary
            **kwargs: Must include:
                - codigo: str
                - longitud_km: float
                - puentes_vehiculares_und: int
                - puentes_vehiculares_m2: float
                - puentes_peatonales_und: int
                - puentes_peatonales_m2: float
                - tuneles_und: int
                - tuneles_km: float
                - alcance: str
                
        Returns:
            Dictionary with item predictions
        """
        mm = ModelsManagement(fase)
        
        if fase == 'III':
            predictions = mm.predict_fase_III(
                codigo=kwargs.get('codigo', ''),
                longitud_km=kwargs['longitud_km'],
                puentes_vehiculares_und=kwargs['puentes_vehiculares_und'],
                puentes_vehiculares_m2=kwargs['puentes_vehiculares_m2'],
                puentes_peatonales_und=kwargs['puentes_peatonales_und'],
                puentes_peatonales_m2=kwargs['puentes_peatonales_m2'],
                tuneles_und=kwargs['tuneles_und'],
                tuneles_km=kwargs['tuneles_km'],
                alcance=kwargs['alcance'],
                models=models
            )
        elif fase == 'II':
            raise NotImplementedError("Fase II prediction not yet implemented")
        else:
            raise ValueError(f"Fase '{fase}' no soportada")
        
        return predictions
    
    def _save_models_legacy(self, fase: str, models: Dict[str, Any], metadata: Optional[Dict] = None, summary_df=None) -> str:
        """
        Save trained models to disk as pickle file.
        
        Args:
            fase: Phase identifier
            models: Trained models dictionary
            metadata: Optional metadata
            summary_df: Optional training summary DataFrame with metrics
            
        Returns:
            Path to saved model file
        """
        # Create filename based on fase
        filename = f"fase_{fase}_models.pkl"
        filepath = self.models_dir / filename
        
        # Prepare data to save
        save_data = {
            'models': models,
            'metadata': metadata or {},
            'summary': summary_df.to_dict('records') if summary_df is not None else None
        }
        
        # Save as pickle
        with open(filepath, 'wb') as f:
            pickle.dump(save_data, f)
        
        return str(filepath)
    
    def _load_models_legacy(self, fase: str) -> Optional[Dict[str, Any]]:
        """
        Load trained models from disk.
        
        Args:
            fase: Phase identifier
            
        Returns:
            Dictionary with 'models' and 'metadata' or None if not found
        """
        filename = f"fase_{fase}_models.pkl"
        filepath = self.models_dir / filename
        
        if not filepath.exists():
            return None
        
        try:
            with open(filepath, 'rb') as f:
                data = pickle.load(f)
            return data
        except Exception as e:
            print(f"Error loading models: {e}")
            return None


class PhaseModelManager:
    """
    High-level manager for phase-specific models.
    Provides a simple interface for training, prediction, and model management.
    """
    
    def __init__(self, adapter: ModelAdapterInterface = None):
        """
        Initialize the model manager.
        
        Args:
            adapter: Model adapter to use (defaults to LegacyModelAdapter)
        """
        self.adapter = adapter or LegacyModelAdapter()
    
    def train_and_save(self, fase: str) -> Dict[str, Any]:
        """
        Train models for a phase and save them to disk.
        
        Args:
            fase: Phase identifier
            
        Returns:
            Dictionary with training results and file path
        """
        # Train models
        result = self.adapter.train_models(fase)
        
        # Save to disk
        filepath = self.adapter.save_models(
            fase=fase,
            models=result['models'],
            metadata=result.get('metadata'),
            summary_df=result.get('summary_df')
        )
        
        return {
            'fase': fase,
            'models_path': filepath,
            'summary': result.get('summary_df'),
            'metadata': result.get('metadata')
        }
    
    def load_and_predict(self, fase: str, unidad_funcional: Dict[str, Any]) -> Dict[str, float]:
        """
        Load models and make predictions for a functional unit.
        
        Args:
            fase: Phase identifier
            unidad_funcional: Dictionary with UF parameters
            
        Returns:
            Dictionary with item predictions
        """
        # Load models
        data = self.adapter.load_models(fase)
        if not data:
            raise FileNotFoundError(f"No trained models found for fase '{fase}'")
        
        models = data['models']
        
        # Make prediction
        predictions = self.adapter.predict(
            fase=fase,
            models=models,
            **unidad_funcional
        )
        
        return predictions
    
    def get_model_info(self, fase: str) -> Optional[Dict[str, Any]]:
        """
        Get information about trained models.
        
        Args:
            fase: Phase identifier
            
        Returns:
            Model metadata or None if not found
        """
        data = self.adapter.load_models(fase)
        if not data:
            return None
        
        return data.get('metadata')
