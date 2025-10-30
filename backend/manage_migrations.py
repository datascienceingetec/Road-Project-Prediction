#!/usr/bin/env python
"""
Script auxiliar para gestionar migraciones de Alembic

Uso:
    python manage_migrations.py init           # Crear migración inicial
    python manage_migrations.py create "msg"   # Crear nueva migración
    python manage_migrations.py upgrade        # Aplicar migraciones
    python manage_migrations.py downgrade      # Revertir última migración
    python manage_migrations.py status         # Ver estado actual
    python manage_migrations.py history        # Ver historial
"""

import sys
import os
import subprocess
from pathlib import Path

# Colores para terminal
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


def print_header(msg):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{msg:^60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}\n")


def print_success(msg):
    print(f"{Colors.OKGREEN}✓ {msg}{Colors.ENDC}")


def print_error(msg):
    print(f"{Colors.FAIL}✗ {msg}{Colors.ENDC}")


def print_warning(msg):
    print(f"{Colors.WARNING}⚠ {msg}{Colors.ENDC}")


def print_info(msg):
    print(f"{Colors.OKCYAN}ℹ {msg}{Colors.ENDC}")


def run_command(cmd, description=None):
    """Ejecutar comando de Alembic"""
    if description:
        print_info(description)
    
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print_error(f"Error ejecutando comando: {cmd}")
        if e.stderr:
            print(e.stderr)
        return False


def init_migration():
    """Crear migración inicial"""
    print_header("Crear Migración Inicial")
    
    # Verificar si ya existen migraciones
    versions_dir = Path("migrations/versions")
    if versions_dir.exists() and list(versions_dir.glob("*.py")):
        print_warning("Ya existen migraciones en migrations/versions/")
        response = input("¿Deseas continuar de todos modos? (s/N): ")
        if response.lower() != 's':
            print_info("Operación cancelada")
            return
    
    print_info("Generando migración inicial basada en modelos actuales...")
    if run_command(
        'alembic revision --autogenerate -m "Initial schema"',
        "Ejecutando: alembic revision --autogenerate -m 'Initial schema'"
    ):
        print_success("Migración inicial creada exitosamente")
        print_info("Revisa el archivo generado en migrations/versions/")
        print_info("Para aplicar la migración, ejecuta: python manage_migrations.py upgrade")
    else:
        print_error("Error al crear migración inicial")


def create_migration(message):
    """Crear nueva migración"""
    print_header("Crear Nueva Migración")
    
    if not message:
        print_error("Debes proporcionar un mensaje para la migración")
        print_info("Uso: python manage_migrations.py create 'Descripción del cambio'")
        return
    
    print_info(f"Generando migración: {message}")
    if run_command(
        f'alembic revision --autogenerate -m "{message}"',
        "Detectando cambios en modelos..."
    ):
        print_success("Migración creada exitosamente")
        print_warning("IMPORTANTE: Revisa el archivo generado antes de aplicarlo")
        print_info("Para aplicar la migración, ejecuta: python manage_migrations.py upgrade")
    else:
        print_error("Error al crear migración")


def upgrade_migrations():
    """Aplicar todas las migraciones pendientes"""
    print_header("Aplicar Migraciones")
    
    # Verificar estado actual
    print_info("Verificando estado actual...")
    run_command("alembic current", "Estado actual:")
    
    print("\n")
    response = input("¿Deseas aplicar todas las migraciones pendientes? (s/N): ")
    if response.lower() != 's':
        print_info("Operación cancelada")
        return
    
    print_info("Aplicando migraciones...")
    if run_command("alembic upgrade head", "Ejecutando: alembic upgrade head"):
        print_success("Migraciones aplicadas exitosamente")
        run_command("alembic current", "Estado final:")
    else:
        print_error("Error al aplicar migraciones")


def downgrade_migration():
    """Revertir última migración"""
    print_header("Revertir Migración")
    
    # Mostrar estado actual
    print_info("Estado actual:")
    run_command("alembic current")
    
    print("\n")
    print_warning("ADVERTENCIA: Esta operación revertirá la última migración")
    response = input("¿Estás seguro? (s/N): ")
    if response.lower() != 's':
        print_info("Operación cancelada")
        return
    
    print_info("Revirtiendo última migración...")
    if run_command("alembic downgrade -1", "Ejecutando: alembic downgrade -1"):
        print_success("Migración revertida exitosamente")
        run_command("alembic current", "Estado final:")
    else:
        print_error("Error al revertir migración")


def show_status():
    """Mostrar estado actual de migraciones"""
    print_header("Estado de Migraciones")
    
    print_info("Versión actual de la base de datos:")
    run_command("alembic current")
    
    print("\n")
    print_info("Últimas migraciones:")
    run_command("alembic history --verbose | head -n 20")


def show_history():
    """Mostrar historial completo de migraciones"""
    print_header("Historial de Migraciones")
    run_command("alembic history --verbose")


def show_help():
    """Mostrar ayuda"""
    print_header("Gestión de Migraciones con Alembic")
    
    print(f"{Colors.BOLD}Comandos disponibles:{Colors.ENDC}\n")
    
    commands = [
        ("init", "Crear migración inicial del esquema"),
        ("create 'mensaje'", "Crear nueva migración con autogeneración"),
        ("upgrade", "Aplicar todas las migraciones pendientes"),
        ("downgrade", "Revertir la última migración"),
        ("status", "Ver estado actual de migraciones"),
        ("history", "Ver historial completo de migraciones"),
        ("help", "Mostrar esta ayuda"),
    ]
    
    for cmd, desc in commands:
        print(f"  {Colors.OKBLUE}{cmd:20}{Colors.ENDC} - {desc}")
    
    print(f"\n{Colors.BOLD}Ejemplos:{Colors.ENDC}\n")
    print(f"  {Colors.OKCYAN}python manage_migrations.py init{Colors.ENDC}")
    print(f"  {Colors.OKCYAN}python manage_migrations.py create 'Add email field to Proyecto'{Colors.ENDC}")
    print(f"  {Colors.OKCYAN}python manage_migrations.py upgrade{Colors.ENDC}")
    print(f"  {Colors.OKCYAN}python manage_migrations.py status{Colors.ENDC}")
    
    print(f"\n{Colors.BOLD}Documentación completa:{Colors.ENDC}")
    print(f"  {Colors.OKGREEN}docs/ALEMBIC_MIGRATION_GUIDE.md{Colors.ENDC}\n")


def main():
    """Función principal"""
    if len(sys.argv) < 2:
        show_help()
        return
    
    command = sys.argv[1].lower()
    
    if command == "init":
        init_migration()
    elif command == "create":
        message = sys.argv[2] if len(sys.argv) > 2 else None
        create_migration(message)
    elif command == "upgrade":
        upgrade_migrations()
    elif command == "downgrade":
        downgrade_migration()
    elif command == "status":
        show_status()
    elif command == "history":
        show_history()
    elif command == "help":
        show_help()
    else:
        print_error(f"Comando desconocido: {command}")
        print_info("Usa 'python manage_migrations.py help' para ver comandos disponibles")


if __name__ == "__main__":
    main()
