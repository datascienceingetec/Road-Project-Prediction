
# Sistema de Predicción de Costos en Proyectos Viales

Aplicación web para gestión y predicción de costos en proyectos de infraestructura vial utilizando Machine Learning.

## 🏗️ Arquitectura

### Backend (Python/Flask)
- **Framework**: Flask - Ligero y Pythonic
- **Base de datos**: SQLite - Sin servidor, perfecto para prototipos
- **API**: RESTful JSON API
- **ML**: Scikit-learn para modelos predictivos (SVR)

### Frontend (Vue 3 + Vue Router)
- **Framework**: Vue 3 via CDN (sin build tools)
- **Router**: Vue Router para navegación SPA
- **Reactividad**: Sistema reactivo de Vue para UI dinámica
- **Mapas**: Google Maps JavaScript API
- **Estilo**: CSS puro con variables CSS modernas

### Estructura del Proyecto
```
Road-Project-Prediction/
├── backend/
│   ├── app/
│   │   ├── __init__.py               # Inicialización del paquete Flask
│   │   ├── config.py                 # Configuración general (rutas, claves, DB)
│   │   ├── models.py                 # Modelos de acceso a datos (SQLite)
│   │   ├── routes.py                 # Definición de endpoints / API
│   │   │
│   │   ├── services/                 # Lógica de negocio y utilidades
│   │   │   ├── __init__.py
│   │   │   ├── present_value.py      # Cálculo de valor presente
│   │   │   ├── eda.py                # Procesos de análisis exploratorio (EDA)
│   │   │   └── ...                   # Otros servicios o cálculos
│   │   │
│   │   ├── templates/                # Plantillas HTML (solo si Flask renderiza vistas)
│   │   │   ├── base.html
│   │   │   └── index.html
│   │   │
│   │   └── static/                   # Archivos estáticos para vistas Flask
│   │       ├── css/
│   │       ├── js/
│   │       └── img/
│   │
│   ├── data/                         # Archivos de datos de entrada (.csv, .xlsx)
│   ├── instance/                     # Base de datos SQLite y configuraciones locales
│   │   └── database.db
│   ├── notebooks/                    # Jupyter notebooks (EDA, entrenamiento, test)
│   │   ├── eda.ipynb
│   │   ├── machine_learning.ipynb
│   │   └── test.ipynb
│   ├── tests/                        # Tests automáticos (pytest / unittests)
│   ├── run.py                        # Script para ejecutar Flask en desarrollo
│   ├── wsgi.py                       # Punto de entrada WSGI para producción
│   ├── requirements.txt              # Dependencias del backend (Flask, Pandas, etc.)
│   └── .env                          # Variables de entorno locales
│
├── frontend/                         # Aplicación React (interfaz principal)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── build/                        # Carpeta generada por `npm run build`
│
├── .venv/                             # Entorno virtual (no versionado)
├── .gitignore                        # Archivos y carpetas ignoradas por git
├── Makefile                          # Tareas automáticas (lint, run, etc.)
├── scripts.bat                       # Scripts auxiliares (Windows)
├── scripts.sh                        # Scripts auxiliares (Linux/Mac)
├── ARCHITECTURE.md                   # Descripción técnica de la arquitectura
└── README.md                         # Documentación del proyecto
```

### Base de Datos

#### Tabla `proyectos`
Proyecto vial principal con información básica y coordenadas geográficas.

#### Tabla `unidad_funcional` (1:N con proyectos)
Unidades funcionales de cada proyecto con características técnicas:
- Longitud, puentes vehiculares/peatonales, túneles
- Alcance, zona, tipo de terreno

#### Tabla `item` (1:N con proyectos)
Items de costo detallados por proyecto (diseño, geología, pavimento, etc.)

## 🚀 Instalación

1. **Instalar dependencias**:
```bash
pip install -r requirements.txt
```

2. **Configurar Google Maps API**:
- Obtén una API key en [Google Cloud Console](https://console.cloud.google.com/)
- Edita `config.py` y reemplaza `YOUR_API_KEY_HERE` con tu key

3. **Ejecutar la aplicación**:
```bash
python app.py
```

4. **Abrir en navegador**:
```
http://localhost:5000
```

## 📋 Funcionalidades

### ✅ Gestión de Proyectos
- Crear, leer, actualizar y eliminar proyectos viales
- Visualización en tabla interactiva
- Detalles completos de cada proyecto con datos relacionados

### 🗺️ Visualización Geográfica
- Mapa interactivo con Google Maps
- Rutas entre puntos de inicio y fin de proyectos
- Marcadores clickeables
- **Reactividad**: Al hacer clic en una fila de la tabla, la ruta se dibuja automáticamente en el mapa

### 📊 Análisis Histórico
- Total de proyectos
- Inversión total acumulada
- Longitud total de vías
- Costo promedio por kilómetro

### 🔍 Vista Detallada
- Información completa del proyecto
- **Unidades Funcionales**: Tabla con características técnicas de cada UF
- **Items de Costo**: Desglose detallado de costos causados por item
- Mapa de la ruta del proyecto
- Total acumulado por items

### 🤖 Modelo Predictivo
- Predicción de costos basada en parámetros del proyecto
- Interfaz simple para ingreso de datos
- Preparado para integrar modelos SVR de scikit-learn

## 🎯 Separación de Responsabilidades

### Backend (`app.py`)
- Endpoints REST API para 3 modelos (Proyecto, UnidadFuncional, Item)
- Lógica de negocio
- Integración con base de datos
- Predicciones ML

### Modelos (`models.py`)
- Esquema de base de datos (3 tablas relacionadas)
- Operaciones CRUD por modelo
- Inicialización de datos con samples

### Frontend (Vue 3 + Router)
- **Router (`app.js`)**: Navegación SPA con 5 rutas
- **Estado global**: Proyectos, selección, formularios (inject/provide)
- **Componentes (`templates/components/`)**: Vistas modulares separadas
- **Template base (`base.html`)**: Layout común con Jinja2
- Integración con Google Maps

### Estilos (`static/css/style.css`)
- Diseño visual
- Variables CSS para temas
- Responsive design
- Estilos para tablas de UFs e Items

## 🛠️ Próximos Pasos

### 1. Integración de Modelos SVR
```python
# En app.py, reemplaza la predicción simple por tu modelo SVR
import joblib

model = joblib.load('modelo_svr.pkl')

@app.route('/api/predict', methods=['POST'])
def predict_cost():
    data = request.json
    features = [[data['longitud'], data['num_ufs']]]
    prediccion = model.predict(features)
    return jsonify({'costo_predicho': float(prediccion[0])})
```

### 2. Más Features del Modelo
- Agregar campos al formulario: tipo de terreno, región, complejidad
- Extender el modelo para usar más variables predictoras
- Crear endpoint para re-entrenar el modelo

### 3. Visualizaciones Avanzadas
- Gráficos con Chart.js o similar
- Dashboard con métricas en tiempo real
- Comparación de proyectos

### 4. Autenticación
```python
# Agregar Flask-Login para usuarios
from flask_login import LoginManager, login_required
```

### 5. Exportación de Datos
- CSV, Excel para reportes
- PDF para documentos oficiales

### 6. Validaciones
- Backend: Validar datos en endpoints
- Frontend: Mensajes de error amigables

## 🎨 Filosofía de Diseño

- **Simplicidad**: Sin bundlers, sin TypeScript, sin complejidad innecesaria
- **Reactividad**: Vue 3 proporciona reactividad elegante sin overhead
- **Belleza**: UI moderna con CSS limpio
- **Funcionalidad**: Todo funciona desde el primer momento
- **Escalabilidad**: Estructura preparada para crecer

## 🔑 API Endpoints

### Proyectos
- `GET /api/proyectos` - Listar todos los proyectos
- `GET /api/proyectos/<id>` - Obtener un proyecto por ID
- `GET /api/proyectos/codigo/<codigo>` - Obtener un proyecto por código
- `POST /api/proyectos` - Crear proyecto
- `PUT /api/proyectos/<id>` - Actualizar proyecto
- `DELETE /api/proyectos/<id>` - Eliminar proyecto

### Unidades Funcionales
- `GET /api/unidades-funcionales/<codigo>` - Obtener UFs de un proyecto
- `POST /api/unidades-funcionales` - Crear unidad funcional
- `DELETE /api/unidades-funcionales/<id>` - Eliminar unidad funcional

### Items de Costo
- `GET /api/items/<codigo>` - Obtener items de un proyecto
- `POST /api/items` - Crear item
- `PUT /api/items/<id>` - Actualizar item
- `DELETE /api/items/<id>` - Eliminar item

### Predicción
- `POST /api/predict` - Predecir costo

## 💡 Consejos

1. **Google Maps API**: Asegúrate de habilitar "Directions API" y "Maps JavaScript API"
2. **Desarrollo**: Usa el modo debug de Flask para hot-reload
3. **Producción**: Cambia `SECRET_KEY` y usa Gunicorn/uWSGI
4. **Base de datos**: Para producción, migra a PostgreSQL

## 📚 Tecnologías

- Python 3.8+
- Flask 3.0
- Vue.js 3.3
- Google Maps API
- SQLite
- Scikit-learn

---

**Desarrollado como prototipo funcional para predicción de costos en proyectos viales**

