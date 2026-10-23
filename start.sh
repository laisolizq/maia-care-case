#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# Validar argumentos
if [[ $# -gt 1 || ( $# -eq 1 && "$1" != "--clean-db" ) ]]; then
    echo "Uso: ./start.sh [--clean-db]"
    exit 1
fi

echo "Iniciando Maia Care..."

# 1. Limpiar la base de datos (opcional)
if [[ "${1:-}" == "--clean-db" ]]; then
    echo ""
    echo "⚠️  ATENCIÓN: se eliminarán todos los usuarios, registros e insights."
    read -r -p "¿Quieres continuar? Escribe S para confirmar: " confirm

    if [[ "$confirm" != "S" ]]; then
        echo "❌ Operación cancelada."
        exit 0
    fi

    echo " Eliminando los datos de MongoDB..."
    docker compose down -v
fi

# 2. Iniciar MongoDB
echo "Comprobando Docker e iniciando MongoDB..."
docker compose up -d

# 3. Iniciar backend
echo "Iniciando backend (NestJS)..."
setsid bash -c 'cd "$1" && exec npm start' bash "$ROOT/backend" &
BACKEND_PID=$!

# 4. Iniciar frontend
echo "Iniciando frontend (Next.js)..."
setsid bash -c 'cd "$1" && exec npm run dev' bash "$ROOT/frontend" &
FRONTEND_PID=$!

# 5. Detener los procesos al salir
cleanup() {
    trap - EXIT INT TERM

    echo ""
    echo "Deteniendo backend y frontend..."

    kill -- "-$BACKEND_PID" 2>/dev/null || true
    kill -- "-$FRONTEND_PID" 2>/dev/null || true

    wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true

    echo "Maia Care detenida. MongoDB sigue en funcionamiento."
}

trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

echo ""
echo "✅ Maia Care se está iniciando."
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:3001/api"
echo ""
echo "Pulsa Ctrl+C para detener el backend y el frontend."
echo ""

# Mantener el script activo mientras se ejecutan los servidores
wait -n "$BACKEND_PID" "$FRONTEND_PID" || true