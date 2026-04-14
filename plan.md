# Plan de Trabajo — Neo4j TP1 Tema 8: Streaming (BDD2)

## Contexto

- Motor: **Neo4j AuraDB Free** (cloud managed, sin APOC, sin GDS)
- Dataset base: `init_spotify_db.js` (referencia del equipo de MongoDB)
- Entrega: 20 de abril de 2025
- Alcance: Solo la parte Neo4j (Sección 3.2 del TP)

---

## Estado actual

| Tarea | Estado |
|---|---|
| Diseño del modelo de grafo (Req 6) | ✅ Completo |
| Script de carga `init_neo4j.js` | ✅ Ejecutado y verificado |
| 5 consultas Cypher (Req 7a–e) | ✅ En `queries_neo4j.cypher` / `.txt` |
| Justificación grafo vs. relacional (Req 8) | ⏳ Pendiente — va en el informe |
| Coherencia de datos con MongoDB (Req 9) | ✅ Mismas entidades y volumen |

### Conteos verificados en AuraDB (2026-04-14)

| Label / Relación | Cantidad |
|---|---|
| `Artist` | 80 |
| `Song` | 564 |
| `Album` | 80 |
| `User` | 200 |
| `Genre` | 18 |
| `Playlist` | 5 |
| `PLAYED` | 50 000 |
| `COLLABORATED_WITH` | 95 pares (190 en conteo undirected) |
| `FOLLOWS` | ~582 |

---

## Requerimientos Neo4j (Sección 3.2 del PDF)

- **Req 6**: Diseñar grafo (nodos, etiquetas, propiedades, relaciones con dirección y semántica)
- **Req 7**: Implementar 5 consultas Cypher:
  - a) Artistas conectados hasta 2 saltos de colaboración desde un artista dado
  - b) Camino de colaboraciones entre dos artistas que nunca trabajaron juntos directamente
  - c) Artistas "puente" entre géneros: colaboraron con artistas de ≥3 géneros distintos
  - d) Recomendar artistas a un usuario basado en historial de usuarios similares
  - e) Clusters de artistas altamente interconectados e identificar género dominante
- **Req 8**: Justificar por qué estas consultas son más adecuadas en grafo
- **Req 9**: Datos coherentes con MongoDB (mismas entidades principales)

---

## Modelo de Grafo

### Nodos

| Label | Propiedades |
|---|---|
| `Artist` | `stage_name` *(unique)*, `main_genre`, `country`, `followers` |
| `Album` | `uid` *(unique = "artist::title")*, `title`, `release_year`, `genre` |
| `Song` | `uid` *(unique = "artist::title")*, `title`, `duration_ms`, `bpm`, `popularity` |
| `User` | `name` *(unique)*, `country`, `plan` |
| `Genre` | `name` *(unique)* |
| `Playlist` | `name` *(unique)*, `type`, `followers_current`, `followers_last_month`, `description` |

### Relaciones

| Relación | Dirección | Propiedades | Semántica |
|---|---|---|---|
| `RELEASED` | `(Artist)→(Album)` | — | Artista publicó el álbum |
| `PERFORMED` | `(Artist)→(Song)` | — | Artista interpretó la canción |
| `IN_ALBUM` | `(Song)→(Album)` | — | Canción pertenece al álbum |
| `HAS_GENRE` | `(Artist)→(Genre)` | — | Género musical del artista |
| `PLAYED` | `(User)→(Song)` | `timestamp`, `device`, `context`, `completed` | Reproducción |
| `FOLLOWS` | `(User)→(Artist)` | — | Usuario sigue al artista |
| `CONTAINS` | `(Playlist)→(Song)` | `position` | Playlist incluye canción |
| `COLLABORATED_WITH` | `(Artist)↔(Artist)` | `song_title`, `collab_type` | Colaboración musical |

> `collab_type` puede ser `'same-genre'` o `'cross-genre'`. Las colaboraciones son **sintéticas** ya que el dataset original no las tiene explícitas.

---

## Archivos del proyecto

| Archivo | Descripción |
|---|---|
| `init_neo4j.js` | Script de carga completo (Node.js + neo4j-driver). Ejecutar con `node init_neo4j.js` |
| `queries_neo4j.cypher` | 5 consultas Cypher del Req 7 + consultas de diagnóstico (con comentarios) |
| `queries_neo4j.txt` | Mismo contenido, para copiar/pegar directo en Neo4j Browser |
| `Neo4j-ab97369a-Created-2026-04-10.txt` | Credenciales AuraDB — **no subir a repositorio público** |
| `package.json` / `node_modules/` | Dependencia: `neo4j-driver` |

---

## Colaboraciones cross-genre diseñadas (Query 7c)

Para que la Query 7c retorne resultados, estos artistas tienen ≥3 géneros ajenos en sus colaboraciones:

| Artista puente | Género propio | Géneros conectados |
|---|---|---|
| Shakira | Pop Latino | Urbano, Reggaeton, Pop, R&B |
| Doja Cat | Hip Hop | Pop, R&B, Urbano |
| Gorillaz | Alternative | Hip Hop, Electronic, Trap, Urbano |
| Justin Bieber | Pop | Hip Hop, Reggaeton, Urbano |
| Rihanna | R&B | Hip Hop, Pop Latino, Urbano, Pop |
| Ed Sheeran | Pop | Hip Hop, R&B, Urbano |

---

## Infraestructura

- **URI**: `neo4j+s://ab97369a.databases.neo4j.io`
- **Usuario**: `ab97369a`
- **Database**: `ab97369a`
- La instancia debe estar en estado **RUNNING** en https://console.neo4j.io antes de conectar
- **Driver**: `neo4j-driver` v5 (Node.js) — `npm install neo4j-driver`
- **Sin APOC, sin GDS** — todas las queries usan Cypher puro

## Cómo re-ejecutar la carga

```bash
npm install          # solo la primera vez
node init_neo4j.js   # limpia y recarga todo desde cero
```

> ⚠️ El script hace `MATCH (n) DETACH DELETE n` al inicio — borra todo el grafo antes de cargar.

---

## Consultas Cypher — resumen rápido

### 7a — Artistas a ≤2 saltos
```cypher
MATCH path = (a:Artist {stage_name: "Shakira"})-[:COLLABORATED_WITH*1..2]-(connected:Artist)
WHERE connected <> a
RETURN DISTINCT connected.stage_name AS artista, connected.main_genre AS genero,
       min(length(path)) AS saltos
ORDER BY saltos, artista;
```

### 7b — Camino entre artistas sin collab directa
```cypher
MATCH (a1:Artist {stage_name: "Queen"}), (a2:Artist {stage_name: "Bad Bunny"})
WHERE NOT (a1)-[:COLLABORATED_WITH]-(a2)
MATCH path = shortestPath((a1)-[:COLLABORATED_WITH*]-(a2))
RETURN [n IN nodes(path) | n.stage_name] AS cadena, length(path) AS saltos;
```

### 7c — Artistas puente entre géneros
```cypher
MATCH (a:Artist)-[:COLLABORATED_WITH]-(collab:Artist)
WHERE a.main_genre <> collab.main_genre
WITH a, collect(DISTINCT collab.main_genre) AS generos_ajenos
WHERE size(generos_ajenos) >= 3
RETURN a.stage_name AS artista_puente, a.main_genre AS genero_propio,
       generos_ajenos, size(generos_ajenos) AS diversidad_generos
ORDER BY diversidad_generos DESC;
```

### 7d — Recomendación por usuarios similares
```cypher
MATCH (u:User {name: "User_1"})-[:PLAYED]->(s:Song)<-[:PLAYED]-(similar:User)
WHERE similar <> u
WITH u, similar, count(s) AS reproducciones_comunes
ORDER BY reproducciones_comunes DESC LIMIT 20
MATCH (similar)-[:PLAYED]->(s2:Song)<-[:PERFORMED]-(rec:Artist)
WHERE NOT (u)-[:PLAYED]->(:Song)<-[:PERFORMED]-(rec)
  AND NOT (u)-[:FOLLOWS]->(rec)
RETURN rec.stage_name AS artista_recomendado, rec.main_genre AS genero,
       count(*) AS score
ORDER BY score DESC LIMIT 10;
```

### 7e — Clusters por género (sin GDS)
```cypher
MATCH (a:Artist)-[:COLLABORATED_WITH]-(b:Artist)
WITH a, collect(DISTINCT b.stage_name) AS colaboradores, count(*) AS grado
WHERE grado >= 1
WITH a.main_genre AS cluster_genero, collect(a.stage_name) AS artistas,
     count(*) AS tamanio, avg(grado) AS conexiones_promedio
RETURN cluster_genero, artistas[0..5] AS muestra, tamanio,
       round(conexiones_promedio, 2) AS conexiones_promedio
ORDER BY tamanio DESC;
```
