#!/bin/bash

# Inicia el servidor del dashboard de Alfred

PORT=8888
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Iniciando servidor de Alfred..."
echo ""
echo "📊 Dashboard disponible en:"
echo "   http://localhost:$PORT/alfred-dashboard.html"
echo ""
echo "📱 Accede desde tu teléfono (en la misma red):"
echo "   http://$(hostname -I | awk '{print $1}'):$PORT/alfred-dashboard.html"
echo ""
echo "Presiona Ctrl+C para detener el servidor"
echo ""

cd "$DIR"
python3 -m http.server $PORT --bind 127.0.0.1
