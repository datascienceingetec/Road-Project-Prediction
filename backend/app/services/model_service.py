"""
Model Service - Business logic for ML model management
"""

from typing import Any, Optional

import pandas as pd
from app.adapters.model_adapter import LegacyModelAdapter
from app.config import get_storage
from app.models import Fase


class ModelService:
    """Service for ML model management and operations"""

    def __init__(self):
        storage = get_storage()
        self.adapter = LegacyModelAdapter(storage=storage)

    def load_models(self, fase_id: int) -> Optional[dict[str, Any]]:
        """
        Load trained models for a phase

        Args:
            fase_id: Phase ID from database

        Returns:
            Dictionary with 'models', 'metadata', and 'summary' or None if not found
        """
        return self.adapter.load_models(fase_id)

    def train_models(self, fase_id: int) -> dict[str, Any]:
        """
        Train models for a phase

        Args:
            fase_id: Phase ID from database

        Returns:
            Dictionary with training results and metadata
        """
        # Train using fase_id (adapter handles mapping)
        result = self.adapter.train_models(fase_id)

        # Get fase code for response
        fase_code = self.adapter._map_fase_id_to_code(fase_id)

        # Save to disk (adapter handles mapping)
        filepath = self.adapter.save_models(
            fase_id=fase_id,
            models=result['models'],
            metadata=result.get('metadata'),
            summary_df=result.get('summary_df')
        )

        return {
            'fase': fase_code,
            'fase_id': fase_id,
            'models_path': filepath,
            'summary': result.get('summary_df'),
            'metadata': result.get('metadata')
        }

    def get_available_models(self) -> list[dict[str, Any]]:
        """
        Get list of available trained models for all phases

        Returns:
            List of dictionaries with model availability info:
            [
                {
                    'fase': 'II',
                    'fase_id': 2,
                    'fase_nombre': 'Fase II - Factibilidad',
                    'available': True,
                    'metadata': {...}
                },
                ...
            ]
        """
        fases = Fase.query.all()
        models_info = []

        for fase in fases:
            try:
                # Try to map and load model (adapter handles mapping)
                fase_code = self.adapter._map_fase_id_to_code(fase.id)
                model_data = self.adapter.load_models(fase.id)
                is_available = model_data is not None

                print(f"Checking model for Fase {fase.nombre} (ID: {fase.id}, Code: {fase_code}): "
                      f"{'Available' if is_available else 'Not found'}")

                if model_data:
                    print(f"  Metadata: {model_data.get('metadata')}")

                models_info.append({
                    'fase': fase_code,
                    'fase_id': fase.id,
                    'fase_nombre': fase.nombre,
                    'available': is_available,
                    'metadata': model_data.get('metadata') if model_data else None
                })
            except ValueError:
                # Phase not supported for predictions, skip it
                continue

        print(f"Returning models info: {models_info}")
        return models_info

    def parse_training_summary(self, model_data: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
        """
        Parse training summary from model data into a structured format

        Args:
            model_data: Dictionary containing 'summary' key with training metrics

        Returns:
            Dictionary mapping item names to list of metrics:
            {
                'item_name': [
                    {
                        'alcance': 'Segunda calzada',
                        'model': 'ElasticNet',
                        'r2': 0.95,
                        'mae': 1000,
                        'rmse': 1500,
                        'mape': 5.2,
                        'n_samples': 10
                    },
                    ...
                ]
            }
        """
        training_summary = {}

        if model_data.get('summary'):
            print(
                f"Loading {len(model_data['summary'])} metric rows from summary")

            # Group metrics by item name (can have multiple alcances)
            for row in model_data['summary']:
                item_name = row.get('Target', '')

                if item_name not in training_summary:
                    training_summary[item_name] = []

                training_summary[item_name].append({
                    'alcance': row.get('Alcance', 'General'),
                    'model': row.get('Model', ''),
                    'r2': row.get('R²', 0),
                    'mae': row.get('MAE', 0),
                    'rmse': row.get('RMSE', 0),
                    'mape': row.get('MAPE (%)', 0),
                    'n_samples': row.get('n_samples', 0)
                })

            print(
                f"Training summary has metrics for {len(training_summary)} items")

        return training_summary

    def get_historical_data(self, fase_id: int) -> pd.DataFrame:
        """
        Get historical project data for charts and analysis

        Args:
            fase_id: Phase ID from database

        Returns:
            DataFrame with standardized column names
        """
        return self.adapter.get_historical_data(fase_id)

    def get_comparison_data(self, fase_id: int, item_name: str) -> dict[str, Any]:
        """
        Get real vs predicted comparison data for a specific item

        Args:
            fase_id: Phase ID from database
            item_name: Name of the item to compare

        Returns:
            Dictionary with historical data, item column, and models
        """
        return self.adapter.get_comparison_data(fase_id, item_name)
