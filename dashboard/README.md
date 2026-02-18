# Alfred Dashboard

Dashboard de estado de Alfred en estilo liquid glass Apple.

## Requisitos

- Node.js 18+
- npm o yarn

## Instalación

```bash
cd alfred-dashboard
npm install
```

## Desarrollo

```bash
npm run dev
```

Luego accede a:
```
http://localhost:3000
```

## Compilar para producción

```bash
npm run build
npm start
```

## Actualizar estado

Edita el archivo `../alfred-status.json` en el workspace raíz:

```json
{
  "status": "working|idle",
  "currentActivity": "Tu actividad actual",
  "nextCheck": "2026-02-07T14:30:00Z",
  "capacity": {
    "cpu": "35",
    "memory": "512 MB"
  },
  "lastActivity": "2026-02-07T14:14:00Z",
  "available": true
}
```
