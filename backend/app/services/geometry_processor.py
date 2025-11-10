"""
Geometry processing service for handling KML, SHP, and GeoJSON files
"""
import json
import os
import tempfile
import zipfile
from typing import List, Dict, Any, Tuple
from werkzeug.utils import secure_filename
import geopandas as gpd
from shapely.geometry import shape, mapping
from shapely.ops import transform
import pyproj


class GeometryProcessor:
    """Service for processing geospatial files and converting to GeoJSON"""
    
    ALLOWED_EXTENSIONS = {'.kml', '.geojson', '.json', '.zip', '.shp'}
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
    TARGET_CRS = 'EPSG:4326'  # WGS84 for web mapping
    
    @staticmethod
    def validate_file(filename: str, file_size: int) -> Tuple[bool, str]:
        """
        Validate uploaded file
        
        Args:
            filename: Name of the uploaded file
            file_size: Size of the file in bytes
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if file_size > GeometryProcessor.MAX_FILE_SIZE:
            return False, f"File size exceeds maximum allowed size of {GeometryProcessor.MAX_FILE_SIZE / 1024 / 1024}MB"
        
        ext = os.path.splitext(filename.lower())[1]
        if ext not in GeometryProcessor.ALLOWED_EXTENSIONS:
            return False, f"File type {ext} not allowed. Allowed types: {', '.join(GeometryProcessor.ALLOWED_EXTENSIONS)}"
        
        return True, ""
    
    @staticmethod
    def extract_geometries(file_path: str, filename: str) -> List[Dict[str, Any]]:
        """
        Extract geometries from uploaded file and convert to GeoJSON features
        
        Args:
            file_path: Path to the uploaded file
            filename: Original filename
            
        Returns:
            List of GeoJSON features with properties
            
        Raises:
            ValueError: If file cannot be processed
        """
        try:
            # Handle ZIP files (for Shapefiles)
            if filename.lower().endswith('.zip'):
                return GeometryProcessor._process_shapefile_zip(file_path)
            
            # Read file with GeoPandas
            gdf = gpd.read_file(file_path)
            
            # Ensure CRS is WGS84
            if gdf.crs is None:
                raise ValueError("File does not have a coordinate reference system (CRS) defined")
            
            if gdf.crs.to_string() != GeometryProcessor.TARGET_CRS:
                gdf = gdf.to_crs(GeometryProcessor.TARGET_CRS)
            
            # Convert to features
            features = []
            for idx, row in gdf.iterrows():
                geometry = row.geometry
                
                if geometry is None or geometry.is_empty:
                    continue
                
                # Validate geometry
                if not geometry.is_valid:
                    # Try to fix invalid geometries
                    geometry = geometry.buffer(0)
                    if not geometry.is_valid:
                        continue
                
                # Convert to GeoJSON geometry
                geojson_geometry = mapping(geometry)
                
                # Extract properties (excluding geometry column)
                properties = {}
                for col in gdf.columns:
                    if col != 'geometry':
                        value = row[col]
                        # Convert numpy types to Python types
                        if hasattr(value, 'item'):
                            value = value.item()
                        # Handle NaN values
                        if value != value:  # NaN check
                            value = None
                        properties[col] = value
                
                features.append({
                    'geometry': geojson_geometry,
                    'properties': properties
                })
            
            if not features:
                raise ValueError("No valid geometries found in file")
            
            return features
            
        except Exception as e:
            raise ValueError(f"Error processing geometry file: {str(e)}")
    
    @staticmethod
    def _process_shapefile_zip(zip_path: str) -> List[Dict[str, Any]]:
        """
        Extract and process shapefile from ZIP archive
        
        Args:
            zip_path: Path to ZIP file containing shapefile
            
        Returns:
            List of GeoJSON features
        """
        with tempfile.TemporaryDirectory() as temp_dir:
            # Extract ZIP
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
            
            # Find .shp file
            shp_file = None
            for file in os.listdir(temp_dir):
                if file.lower().endswith('.shp'):
                    shp_file = os.path.join(temp_dir, file)
                    break
            
            if not shp_file:
                raise ValueError("No .shp file found in ZIP archive")
            
            # Process shapefile
            gdf = gpd.read_file(shp_file)
            
            # Ensure CRS is WGS84
            if gdf.crs is None:
                raise ValueError("Shapefile does not have a CRS defined")
            
            if gdf.crs.to_string() != GeometryProcessor.TARGET_CRS:
                gdf = gdf.to_crs(GeometryProcessor.TARGET_CRS)
            
            # Convert to features (same as extract_geometries)
            features = []
            for idx, row in gdf.iterrows():
                geometry = row.geometry
                
                if geometry is None or geometry.is_empty:
                    continue
                
                if not geometry.is_valid:
                    geometry = geometry.buffer(0)
                    if not geometry.is_valid:
                        continue
                
                geojson_geometry = mapping(geometry)
                
                properties = {}
                for col in gdf.columns:
                    if col != 'geometry':
                        value = row[col]
                        if hasattr(value, 'item'):
                            value = value.item()
                        if value != value:
                            value = None
                        properties[col] = value
                
                features.append({
                    'geometry': geojson_geometry,
                    'properties': properties
                })
            
            return features
    
    @staticmethod
    def calculate_length_km(geometry_json: str) -> float:
        """
        Calculate length of a LineString geometry in kilometers
        
        Args:
            geometry_json: GeoJSON geometry as string
            
        Returns:
            Length in kilometers
        """
        try:
            geom_dict = json.loads(geometry_json) if isinstance(geometry_json, str) else geometry_json
            geom = shape(geom_dict)
            
            # Create a projection to calculate length in meters
            # Using WGS84 to Web Mercator for approximate length
            wgs84 = pyproj.CRS('EPSG:4326')
            utm = pyproj.CRS('EPSG:3857')  # Web Mercator
            
            project = pyproj.Transformer.from_crs(wgs84, utm, always_xy=True).transform
            geom_projected = transform(project, geom)
            
            # Length in meters, convert to km
            length_m = geom_projected.length
            return round(length_m / 1000, 2)
            
        except Exception as e:
            print(f"Error calculating length: {e}")
            return 0.0
    
    @staticmethod
    def create_geojson_feature_collection(features: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Create a GeoJSON FeatureCollection from features
        
        Args:
            features: List of features with geometry and properties
            
        Returns:
            GeoJSON FeatureCollection
        """
        geojson_features = []
        for feature in features:
            geojson_features.append({
                'type': 'Feature',
                'geometry': feature['geometry'],
                'properties': feature.get('properties', {})
            })
        
        return {
            'type': 'FeatureCollection',
            'features': geojson_features
        }
    
    @staticmethod
    def export_to_kml(features: List[Dict[str, Any]], output_path: str) -> str:
        """
        Export features to KML format
        
        Args:
            features: List of features with geometry and properties
            output_path: Path where KML file should be saved
            
        Returns:
            Path to created KML file
        """
        try:
            # Create GeoDataFrame from features
            geometries = []
            properties_list = []
            
            for feature in features:
                geom = shape(feature['geometry'])
                geometries.append(geom)
                properties_list.append(feature.get('properties', {}))
            
            gdf = gpd.GeoDataFrame(properties_list, geometry=geometries, crs=GeometryProcessor.TARGET_CRS)
            
            # Export to KML
            gdf.to_file(output_path, driver='KML')
            
            return output_path
            
        except Exception as e:
            raise ValueError(f"Error exporting to KML: {str(e)}")
    
    @staticmethod
    def export_to_shapefile(features: List[Dict[str, Any]], output_dir: str) -> str:
        """
        Export features to Shapefile format (creates multiple files)
        
        Args:
            features: List of features with geometry and properties
            output_dir: Directory where shapefile should be saved
            
        Returns:
            Path to created .shp file
        """
        try:
            # Create GeoDataFrame from features
            geometries = []
            properties_list = []
            
            for feature in features:
                geom = shape(feature['geometry'])
                geometries.append(geom)
                properties_list.append(feature.get('properties', {}))
            
            gdf = gpd.GeoDataFrame(properties_list, geometry=geometries, crs=GeometryProcessor.TARGET_CRS)
            
            # Export to Shapefile
            output_path = os.path.join(output_dir, 'export.shp')
            gdf.to_file(output_path, driver='ESRI Shapefile')
            
            return output_path
            
        except Exception as e:
            raise ValueError(f"Error exporting to Shapefile: {str(e)}")
