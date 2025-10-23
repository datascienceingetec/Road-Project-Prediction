#!/bin/bash

# Simple script para correr backend o frontend del monorepo Flask + React

case "$1" in
  backend)
    echo "🚀 Iniciando backend (Flask)..."
    cd backend || exit
    source venv/bin/activate  # activa el entorno virtual
    flask run
    ;;
  frontend)
    echo "💻 Iniciando frontend (React)..."
    cd frontend || exit
    npm run dev
    ;;
  both)
    echo "⚡ Iniciando backend y frontend..."
    # Levanta ambos en paralelo
    (cd backend && source .venv/bin/activate && flask run) &
    (cd frontend && npm run dev) &
    wait
    ;;
  *)
    echo "Uso: ./scripts.sh [backend|frontend|both]"
    ;;
esac
