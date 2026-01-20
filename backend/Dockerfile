# Usamos una imagen base de Python oficial, versión slim para reducir tamaño
FROM python:3.10-slim

# Evita que Python genere archivos .pyc y fuerza salida estandard sin buffer
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Instalar dependencias del sistema necesarias para geospacial (si fiona/shapely necesitan gdal/geos)
# A veces las ruedas binarias (wheels) ya traen todo, pero esto ayuda si falla compilar
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Crear y establecer directorio de trabajo
WORKDIR /app

# Copiar requirements antes para aprovechar cache de docker layers
COPY requirements.txt .

# Instalar dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto del código
COPY . .

# Exponer el puerto (Cloud Run espera que escuchemos en $PORT o defaults a 8080)
ENV PORT=8080

# Usar Gunicorn como servidor de producción
# workers = CPUs * 2 + 1 (ajustar según recursos de Cloud Run)
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 wsgi:app
