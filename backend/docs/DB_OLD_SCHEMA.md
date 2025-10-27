``` mermaid
erDiagram
    PROYECTOS {
        INTEGER id PK
        TEXT nombre
        TEXT codigo
        INTEGER num_ufs
        REAL longitud
        INTEGER anio_inicio
        INTEGER duracion
        TEXT fase
        TEXT ubicacion
        REAL costo
        REAL lat_inicio
        REAL lng_inicio
        REAL lat_fin
        REAL lng_fin
        TIMESTAMP created_at
    }

    UNIDAD_FUNCIONAL {
        INTEGER id PK
        TEXT codigo FK
        INTEGER unidad_funcional
        REAL longitud_km
        INTEGER puentes_vehiculares_und
        INTEGER puentes_vehiculares_mt2
        INTEGER puentes_peatonales_und
        INTEGER puentes_peatonales_mt2
        INTEGER tuneles_und
        REAL tuneles_km
        TEXT alcance
        TEXT zona
        TEXT tipo_terreno
    }

    ITEM_FASE_I {
        INTEGER id PK
        TEXT codigo FK
        REAL transporte
        REAL diseno_geometrico
        REAL prefactibilidad_tuneles
        REAL geologia
        REAL geotecnia
        REAL hidrologia_hidraulica
        REAL ambiental_social
        REAL predial
        REAL riesgos_sostenibilidad
        REAL evaluacion_economica
        REAL gestion_predial
        REAL socioeconomica_financiera
        REAL estructuras
        REAL direccion_coordinacion
    }

    ITEM_FASE_II {
        INTEGER id PK
        TEXT codigo FK
        REAL transporte
        REAL topografia
        REAL geologia
        REAL taludes
        REAL hidrologia_hidraulica
        REAL estructuras
        REAL tuneles
        REAL pavimento
        REAL predial
        REAL ambiental_social
        REAL costos_presupuestos
        REAL socioeconomica
        REAL direccion_coordinacion
    }

    ITEM_FASE_III {
        INTEGER id PK
        TEXT codigo FK
        REAL transporte
        REAL informacion_geografica
        REAL trazado_diseno_geometrico
        REAL seguridad_vial
        REAL sistemas_inteligentes
        REAL geologia
        REAL hidrogeologia
        REAL suelos
        REAL taludes
        REAL pavimento
        REAL socavacion
        REAL estructuras
        REAL tuneles
        REAL urbanismo_paisajismo
        REAL predial
        REAL impacto_ambiental
        REAL cantidades
        REAL evaluacion_socioeconomica
        REAL otros_manejo_redes
        REAL direccion_coordinacion
    }

    ANUAL_INCREMENT {
        INTEGER ano
        REAL valor
    }

    PROYECTOS ||--o{ UNIDAD_FUNCIONAL : "tiene"
    PROYECTOS ||--o{ ITEM_FASE_I : "fase I"
    PROYECTOS ||--o{ ITEM_FASE_II : "fase II"
    PROYECTOS ||--o{ ITEM_FASE_III : "fase III"
```