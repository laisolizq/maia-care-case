#!/usr/bin/env bash

set -euo pipefail

# Ir a la raíz del proyecto
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo "Instalando Dependencias..."
echo ""

# 1. Comprobar requisitos
echo "Comprobando requisitos..."

for command in node npm docker; do
    if ! command -v "$command" &> /dev/null; then
        echo "❌ Error: '$command' no está instalado."
        exit 1
    fi
done

if ! docker compose version &> /dev/null; then
    echo "❌ Error: Docker Compose no está disponible."
    exit 1
fi

# 2. Instalar dependencias del backend
echo "Instalando dependencias del backend..."
(
    cd "$ROOT/backend"
    npm ci
)

echo "Backend instalado."
echo ""

# 3. Instalar dependencias del frontend
echo "Instalando dependencias del frontend..."
(
    cd "$ROOT/frontend"
    npm ci
)

echo "Frontend instalado."
echo ""

# 4. Configurar variables de entorno del backend
echo "Configurando variables de entorno..."

if [[ ! -f "$ROOT/backend/.env" ]]; then
    if [[ -f "$ROOT/backend/.env.example" ]]; then
        cp "$ROOT/backend/.env.example" "$ROOT/backend/.env"
        echo "Archivo backend/.env creado."
    else
        echo "⚠️ No se encuentra backend/.env.example."
        echo "   Debes crear backend/.env manualmente."
    fi
else
    echo "backend/.env ya existe. No se ha modificado."
fi

# 5. Configurar variables de entorno del frontend
if [[ ! -f "$ROOT/frontend/.env.local" ]]; then
    echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > "$ROOT/frontend/.env.local"
    echo "Archivo frontend/.env.local creado."
else
    echo "frontend/.env.local ya existe. No se ha modificado."
fi

echo "Instalación completada. Siguientes pasos:"
echo "   1. Configura tu GEMINI_API_KEY en backend/.env"
echo "   2. Comprueba GEMINI_MODEL en backend/.env"
echo "   3. Ejecuta ./start.sh"
echo ""