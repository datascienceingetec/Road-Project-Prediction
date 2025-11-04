``` mermaid
---
config:
  layout: dagre
---
erDiagram
    direction TB

    PROYECTOS {
        INTEGER id PK "Identificador único del proyecto-fase"
        TEXT codigo UK "Código único, independiente por fase (ej. PRJ001-F2)"
        TEXT nombre "Nombre del proyecto"
        INTEGER anio_inicio "Año de inicio"
        INTEGER duracion "Duración estimada en años"
        REAL longitud "Longitud total en km"
        TEXT ubicacion "Descripción o zona geográfica"
        REAL lat_inicio "Latitud del inicio"
        REAL lng_inicio "Longitud del inicio"
        REAL lat_fin "Latitud del fin"
        REAL lng_fin "Longitud del fin"
        INTEGER fase_id FK "Referencia a la fase del proyecto"
        TEXT status "Estado del proyecto (activo, inactivo)"
        TIMESTAMP created_at "Fecha de creación del registro"
    }

    FASES {
        INTEGER id PK "Identificador de la fase"
        TEXT nombre "Prefactibilidad, Factibilidad, Diseño Detallado, etc."
        TEXT descripcion "Descripción general de la fase"
    }

    UNIDAD_FUNCIONAL {
        INTEGER id PK "Identificador de la unidad funcional"
        INTEGER proyecto_id FK "Proyecto al que pertenece"
        INTEGER numero "Número o identificador interno de la UF"
        REAL longitud_km "Longitud de la UF en km"
        INTEGER puentes_vehiculares_und "Cantidad de puentes vehiculares"
        INTEGER puentes_vehiculares_mt2 "Área total de puentes vehiculares"
        INTEGER puentes_peatonales_und "Cantidad de puentes peatonales"
        INTEGER puentes_peatonales_mt2 "Área total de puentes peatonales"
        INTEGER tuneles_und "Cantidad de túneles"
        REAL tuneles_km "Longitud total de túneles"
        TEXT alcance "Descripción del alcance"
        TEXT zona "Zona o sector"
        TEXT tipo_terreno "Tipo de terreno predominante"
    }

    ITEM_TIPO {
        INTEGER id PK "Identificador del tipo de ítem"
        TEXT nombre "Ejemplo: Geología, Taludes, Pavimento"
        TEXT descripcion "Descripción detallada del tipo de ítem"
    }

    FASE_ITEM_REQUERIDO {
        INTEGER id PK "Identificador de la relación fase–ítem"
        INTEGER fase_id FK "Fase que requiere el ítem"
        INTEGER item_tipo_id FK "Tipo de ítem requerido"
        BOOLEAN obligatorio "Indica si es obligatorio"
        TEXT descripcion "Notas adicionales o aclaraciones"
    }

    COSTO_ITEM {
        INTEGER id PK "Identificador del costo del ítem"
        INTEGER proyecto_id FK "Proyecto-fase al que pertenece"
        INTEGER item_tipo_id FK "Tipo de ítem"
        REAL valor "Valor económico del ítem"
    }

    ANUAL_INCREMENT {
        INTEGER id PK "Identificador"
        INTEGER ano "Año"
        REAL valor "Porcentaje o valor de incremento anual"
    }

    %% Relaciones
    FASES ||--o{ PROYECTOS : "clasifica"
    PROYECTOS ||--o{ UNIDAD_FUNCIONAL : "tiene"
    PROYECTOS ||--o{ COSTO_ITEM : "contiene costos"
    ITEM_TIPO ||--o{ COSTO_ITEM : "define tipo de costo"
    FASES ||--o{ FASE_ITEM_REQUERIDO : "requiere"
    ITEM_TIPO ||--o{ FASE_ITEM_REQUERIDO : "es requerido en"
```