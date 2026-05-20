# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**TP Integrador Tema 8: Streaming Musical** — Ingeniería de Datos II (UADE).
- **TP1**: MongoDB (catálogo) + Neo4j (grafo de colaboraciones, 5 queries Cypher)
- **TP2**: Cassandra (eventos, charts, métricas horarias) + Capa Poliglota (5 ops, 3 motores)

Requerimientos cubiertos: Req 3 (Cassandra), Req 4 (MongoDB), Req 6-9 (Neo4j), OP-1 a OP-5 (poliglota).

## Comandos

```bash
npm install              # instalar dependencias (primera vez)
node init_neo4j.js       # cargar grafo Neo4j (idempotente)
node init_mongodb.js     # cargar catálogo MongoDB (idempotente)
node init_cassandra.js   # cargar Cassandra — 6 tablas + 5000 eventos (idempotente)
node app/index.js        # menú interactivo poliglota
node queries_mongodb.js  # ejecutar 5 queries MongoDB del Req 4
```

## Infraestructura Neo4j

| Campo    | Valor                                   |
|----------|-----------------------------------------|
| Motor    | Neo4j AuraDB Free — **sin APOC, sin GDS** |
| URI      | `neo4j+s://ab97369a.databases.neo4j.io` |
| Usuario  | `ab97369a`                              |
| Database | `ab97369a`                              |
| Driver   | `neo4j-driver` v6 (Node.js, CommonJS)   |

La instancia debe estar en **RUNNING** en https://console.neo4j.io antes de conectar. **Se pausa automáticamente tras ~3 días de inactividad** — reactivar manualmente.
Credenciales en `.env` — **no subir a repo público** (está en .gitignore).

Verificación de carga (pegar en Neo4j Browser):
```cypher
MATCH (n:Artist)  RETURN count(n);   // 80
MATCH (n:Song)    RETURN count(n);   // 564
MATCH (n:User)    RETURN count(n);   // 200
MATCH ()-[r:PLAYED]->()            RETURN count(r);  // 50000
MATCH ()-[r:COLLABORATED_WITH]-() RETURN count(r);  // 190 (95 pares)
```

## Arquitectura del grafo

### Nodos

| Label      | Propiedades clave                                                              |
|------------|--------------------------------------------------------------------------------|
| `Artist`   | `stage_name` *(unique)*, `main_genre`, `country`, `followers`                  |
| `Album`    | `uid` *(unique = "artist::title")*, `title`, `release_year`, `genre`           |
| `Song`     | `uid` *(unique = "artist::title")*, `title`, `duration_ms`, `bpm`, `popularity` |
| `User`     | `name` *(unique)*, `country`, `plan` (`free`\|`premium`)                       |
| `Genre`    | `name` *(unique)*                                                              |
| `Playlist` | `name` *(unique)*, `type`, `followers_current`, `followers_last_month`         |

### Relaciones

| Relación            | Dirección              | Propiedades clave                                    |
|---------------------|------------------------|------------------------------------------------------|
| `RELEASED`          | `(Artist)→(Album)`     | —                                                    |
| `PERFORMED`         | `(Artist)→(Song)`      | —                                                    |
| `IN_ALBUM`          | `(Song)→(Album)`       | —                                                    |
| `HAS_GENRE`         | `(Artist)→(Genre)`     | —                                                    |
| `PLAYED`            | `(User)→(Song)`        | `timestamp`, `device`, `context`, `completed`        |
| `FOLLOWS`           | `(User)→(Artist)`      | —                                                    |
| `CONTAINS`          | `(Playlist)→(Song)`    | `position`                                           |
| `COLLABORATED_WITH` | `(Artist)↔(Artist)`    | `song_title`, `collab_type` (`same-genre`\|`cross-genre`) |

Las colaboraciones son **sintéticas**. Las `cross-genre` están definidas en el array `crossGenreCollabs` de `init_neo4j.js` para garantizar que Query 7c retorne los 6 artistas puente (Shakira, Gorillaz, Rihanna, Doja Cat, Justin Bieber, Ed Sheeran).

`init_neo4j.js` es idempotente: verifica conteos antes de cada paso, usa `MERGE` para todo excepto `PLAYED` (que usa `CREATE` en batches de 1000 filas).

Como AuraDB Free no tiene APOC ni GDS, todas las queries usan **Cypher puro**: `shortestPath()` en lugar de `apoc.algo.dijkstra()`, y agrupación manual por género en lugar de algoritmos de comunidades.

## Infraestructura MongoDB

| Campo   | Valor |
|---------|-------|
| Motor   | MongoDB Atlas Free — AWS São Paulo |
| Cluster | `cluster0.qam1hkd.mongodb.net` (nota: es el número `1`, no la letra `l`) |
| DB      | `ing-datos-II` |
| Driver  | `mongodb` v6 (Node.js, CommonJS) |

## Infraestructura Cassandra

| Campo       | Valor |
|-------------|-------|
| Motor       | DataStax Astra Serverless (vector) — AWS us-east-2 |
| Keyspace    | `streaming` |
| Bundle      | `secure-connect-streaming.zip` (raíz del proyecto, gitignoreado) |
| Driver      | `cassandra-driver` v4 (Node.js) |
| Auth        | `{ username: 'token', password: CASSANDRA_TOKEN }` |

Tablas: `reproducciones_usuario`, `reproducciones_cancion`, `metricas_horarias`, `charts_diarios`, `historial_artista`, `chart_counters` (COUNTER — actualizable en tiempo real).

## Archivos clave

| Archivo                              | Descripción                                                        |
|--------------------------------------|--------------------------------------------------------------------|
| `init_neo4j.js`                      | Carga del grafo completo (idempotente)                             |
| `init_mongodb.js`                    | Carga del catálogo MongoDB (idempotente)                           |
| `init_cassandra.js`                  | Carga Cassandra: 6 tablas + ~5000 eventos (idempotente)            |
| `queries_neo4j.md`                   | 5 queries Req 7 con notas, pares de prueba y resultados esperados  |
| `queries_neo4j.cypher`               | Mismo contenido en formato raw                                     |
| `queries_mongodb.js`                 | 5 queries Req 4 corregidas (4b agrupa por artista Y género)        |
| `queries_cassandra.cql`              | 11 queries CQL Req 3.1–3.3                                         |
| `app/index.js`                       | Menú interactivo — capa poliglota                                  |
| `app/config.js`                      | Conexiones a los 3 motores desde .env                              |
| `app/db/cassandra.js`                | Helpers Cassandra (registro, charts, métricas, comportamiento)     |
| `app/db/mongodb.js`                  | Helpers MongoDB (catálogo, búsqueda, popularidad)                  |
| `app/db/neo4j.js`                    | Helpers Neo4j (grafo, recomendaciones, colaboraciones)             |
| `app/ops/op1_homepage.js`            | OP-1: Homepage personalizada (3 motores)                           |
| `app/ops/op2_play_event.js`          | OP-2: Registro reproducción + métricas (Cassandra + MongoDB)       |
| `app/ops/op3_artist_page.js`         | OP-3: Perfil artista (MongoDB + Neo4j)                             |
| `app/ops/op4_chart.js`               | OP-4: Chart diario (Cassandra chart_counters → MongoDB)            |
| `app/ops/op5_report.js`              | OP-5: Reporte mensual artista (3 motores)                          |
| `PRPs/templates/prp_base.md`         | Template base para Product Requirements Prompts                    |

## Rol: DBA Senior NoSQL

Actúa como DBA Senior con experiencia en producción en: MongoDB/Atlas, Redis/Enterprise, Cassandra/ScyllaDB, Neo4j/Neptune/ArangoDB, InfluxDB/TimescaleDB, Cosmos DB/Firestore, y bases vectoriales (Pinecone, Weaviate, Milvus, Qdrant).

Rol en este proyecto: **asesor técnico principal** en arquitectura y administración NoSQL.

## Reglas de comportamiento obligatorias

1. Nunca deducir ni asumir información no proporcionada explícitamente.
2. Si la consulta es ambigua o incompleta, preguntar antes de responder.
3. No generar soluciones genéricas — adaptar siempre al contexto real del proyecto.
4. Si no es posible consultar, documentar todos los supuestos explícitamente.
5. Señalar riesgos, trade-offs y limitaciones de cada decisión técnica.
6. Indicar cuándo una decisión requiere benchmarking o pruebas de carga.
7. Comparar opciones entre motores cuando aplique y recomendar la más adecuada.
8. Considerar siempre el entorno: AuraDB Free (cloud managed, sin plugins).

## Reglas para ahorrar tokens

1. **No programar sin contexto** — leer archivos relevantes antes de escribir código.
2. **Respuestas cortas** — 1-3 oraciones, sin preámbulos ni resumen final.
3. **No reescribir archivos completos** — usar Edit. Write solo si el cambio es >80%.
4. **No releer archivos ya leídos** en la misma conversación.
5. **Validar antes de declarar hecho** — nunca decir "listo" sin evidencia.
6. **Cero adulación** — sin "Excelente pregunta", "Perfecto". Ir directo al trabajo.
7. **Soluciones simples** — mínimo que resuelve el problema, sin abstracciones no pedidas.
8. **No pelear con el usuario** — si dice "hazlo así", hacerlo; mencionar concern en 1 oración si aplica.
9. **Leer solo lo necesario** — usar offset/limit. Ruta conocida → Read directo.
10. **No narrar el plan** — ejecutar directamente.
11. **Paralelizar tool calls** — leer múltiples archivos independientes en un solo mensaje.
12. **No duplicar código en la respuesta** — si se editó un archivo, no copiar el resultado.
13. **No usar Agent cuando Grep/Read basta**.
