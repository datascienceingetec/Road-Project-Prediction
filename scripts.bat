@echo off
REM Simple script para correr backend o frontend del monorepo Flask + React

IF "%1"=="" GOTO :help
IF "%1"=="backend" GOTO :backend
IF "%1"=="frontend" GOTO :frontend
IF "%1"=="both" GOTO :both
GOTO :help

:backend
    echo 🚀 Iniciando backend (Flask)...
    cd backend
    call .venv\Scripts\activate
    flask run
    GOTO :end

:frontend
    echo 💻 Iniciando frontend (React)...
    cd frontend
    npm run dev
    GOTO :end

:both
    echo ⚡ Iniciando backend y frontend...
    start cmd /k "cd backend && call .venv\Scripts\activate && flask run"
    start cmd /k "cd frontend && npm run dev"
    GOTO :end

:help
    echo Uso: scripts.bat [backend ^| frontend ^| both]

:end
