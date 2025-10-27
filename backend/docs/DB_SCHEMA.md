``` mermaid
---
config:
  layout: dagre
---
erDiagram
	direction TB
	PROYECTOS {
		INTEGER id PK ""  
		TEXT nombre  ""  
		TEXT codigo UK ""  
		INTEGER anio_inicio  ""  
		INTEGER duracion  ""  
		REAL longitud  ""  
		TEXT ubicacion  ""  
		REAL lat_inicio  ""  
		REAL lng_inicio  ""  
		REAL lat_fin  ""  
		REAL lng_fin  ""  
		TIMESTAMP created_at  ""  
	}
	FASES {
		INTEGER id PK ""  
		TEXT nombre  "Prefactibilidad, Factibilidad, Diseño detallado"  
		TEXT descripcion  ""  
	}
	UNIDAD_FUNCIONAL {
		INTEGER id PK ""  
		INTEGER proyecto_id FK ""  
		INTEGER numero  ""  
		REAL longitud_km  ""  
		INTEGER puentes_vehiculares_und  ""  
		INTEGER puentes_vehiculares_mt2  ""  
		INTEGER puentes_peatonales_und  ""  
		INTEGER puentes_peatonales_mt2  ""  
		INTEGER tuneles_und  ""  
		REAL tuneles_km  ""  
		TEXT alcance  ""  
		TEXT zona  ""  
		TEXT tipo_terreno  ""  
	}
	ITEM_TIPO {
		INTEGER id PK ""  
		TEXT nombre  "Geología, Taludes, Hidrología"  
		TEXT descripcion  ""  
	}
	FASE_ITEM_REQUERIDO {
		INTEGER id PK ""  
		INTEGER fase_id FK ""  
		INTEGER item_tipo_id FK ""  
		BOOLEAN obligatorio  ""  
		TEXT descripcion  ""  
	}
	COSTO_ITEM {
		INTEGER id PK ""  
		INTEGER proyecto_id FK ""  
		INTEGER fase_id FK ""  
		INTEGER item_tipo_id FK ""  
		REAL valor  ""  
	}
	ANUAL_INCREMENT {
		INTEGER id PK ""  
		INTEGER ano  ""  
		REAL valor  ""  
	}

	PROYECTOS||--o{UNIDAD_FUNCIONAL:"tiene"
	PROYECTOS||--o{COSTO_ITEM:"contiene costos"
	FASES||--o{COSTO_ITEM:"define estructura de costos"
	FASES||--o{FASE_ITEM_REQUERIDO:"define"
	ITEM_TIPO||--o{FASE_ITEM_REQUERIDO:"se requiere en"
	ITEM_TIPO||--o{COSTO_ITEM:"es tipo de ítem"
```