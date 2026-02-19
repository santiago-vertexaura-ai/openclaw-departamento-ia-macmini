# TOOLS.md — CM

## Scripts Disponibles

### Datos Instagram (via Roberto)
Los datos de Instagram los recopila Roberto diariamente. Accedo a ellos via Supabase.

```bash
# Leer docs recientes de Roberto sobre Instagram
source ~/clawd/.env.local
source ~/clawd/alfred-dashboard/.env.local
curl -s "$SUPABASE_URL/rest/v1/agent_docs?author=eq.Roberto&tags=cs.{instagram}&order=created_at.desc&limit=7&select=id,title,content,created_at,word_count" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY"
```

### Tasks (Supabase)
```bash
# Mi script de tareas
~/clawd/workspace-arturo/scripts/tasks.sh <comando>
```

### Vault
```bash
# Consultar vault para contexto
~/clawd/scripts/vault.sh search "instagram"
~/clawd/scripts/vault.sh list formulas
~/clawd/scripts/vault.sh list trends
```

## Datos Locales

- **Historico metricas**: `data/metrics/weekly-history.json`
- **Benchmarks nicho**: `knowledge/benchmarks.json`
