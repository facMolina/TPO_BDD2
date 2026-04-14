# TP1 Tema 8 — Plataforma de Streaming Musical (Neo4j)

**Ingeniería de Datos II — UADE**
Trabajo Práctico Integrador · 1.ª Entrega · Tema 8

Este repositorio contiene la implementación de la **Sección 3.2 — Requerimientos de grafos (Neo4j)** del TP. La parte MongoDB la maneja otro equipo; los datos son coherentes entre ambos motores (Req 9).

---

## Pre-requisitos

- [Node.js](https://nodejs.org/) v18 o superior
- Acceso a internet (la instancia corre en Neo4j AuraDB Free — cloud)

---

## Instancia AuraDB del grupo

| Campo | Valor |
|---|---|
| URI | `neo4j+s://ab97369a.databases.neo4j.io` |
| Usuario | `ab97369a` |
| Password | `KCQfc0T1LcR-cgPPu3ZTRnIpBqn8QBLvTcc30sSJRU8` |
| Database | `ab97369a` |

> La instancia debe estar en estado **RUNNING** antes de ejecutar el script.
> Verificar en [console.neo4j.io](https://console.neo4j.io).

---

## Instalación

```bash
npm install
```

Instala `neo4j-driver` (única dependencia).

---

## Carga del grafo

```bash
node init_neo4j.js
```

El script es **idempotente**: antes de cargar cada sección verifica si los datos ya existen. Si el grafo ya está cargado, omite esa sección sin duplicar nada. Útil si la conexión se cae a mitad de camino o si se ejecuta dos veces por error.

### Qué carga

| Entidad / Relación | Cantidad |
|---|---|
| `Artist` | 80 |
| `Album` | 80 |
| `Song` | 564 |
| `User` | 200 |
| `Genre` | 18 |
| `Playlist` | 5 |
| `PLAYED` | 50 000 |
| `COLLABORATED_WITH` | 95 pares |
| `FOLLOWS` | ~580 |

### Salida esperada (primera ejecución)

```
✅ Conectado a AuraDB
📊 Estado actual del grafo: ...
🎸 PASO 2: Creando nodos Genre...         ✅ 18 géneros creados.
🎵 PASO 3: Creando Artist, Album, Song... ✅ 80 artistas, 80 álbumes, 564 canciones.
...
🚀 Carga completa.
```

### Salida esperada (segunda ejecución — idempotencia)

```
✅ Conectado a AuraDB
📊 Estado actual del grafo: ...
⏭  PASO 2: Genre ya cargado (18) — omitiendo.
⏭  PASO 3: Artists ya cargados (80) — omitiendo.
...
🚀 Sin cambios — grafo ya estaba completo.
```

---

## Verificación de carga

Pegar en [Neo4j Browser](https://browser.neo4j.io) o en la consola de AuraDB:

```cypher
MATCH (n:Artist)  RETURN count(n);   // 80
MATCH (n:Song)    RETURN count(n);   // 564
MATCH (n:User)    RETURN count(n);   // 200
MATCH ()-[r:PLAYED]->()            RETURN count(r);  // 50000
MATCH ()-[r:COLLABORATED_WITH]-()  RETURN count(r);  // 190
```

---

## Ejecutar las consultas del TP

Las 5 consultas del **Req 7** están en [`queries_neo4j.md`](./queries_neo4j.md).

1. Abrir el archivo
2. Copiar la query deseada
3. Pegarla en [Neo4j Browser](https://browser.neo4j.io) conectado a la instancia del grupo

---

## Modelo del grafo

### Nodos

| Label | Propiedades clave |
|---|---|
| `Artist` | `stage_name` *(unique)*, `main_genre`, `country`, `followers` |
| `Album` | `uid` *(unique)*, `title`, `release_year`, `genre` |
| `Song` | `uid` *(unique)*, `title`, `duration_ms`, `bpm`, `popularity` |
| `User` | `name` *(unique)*, `country`, `plan` |
| `Genre` | `name` *(unique)* |
| `Playlist` | `name` *(unique)*, `type`, `followers_current`, `description` |

### Relaciones

| Relación | Dirección | Semántica |
|---|---|---|
| `RELEASED` | `(Artist)→(Album)` | Artista publicó el álbum |
| `PERFORMED` | `(Artist)→(Song)` | Artista interpretó la canción |
| `IN_ALBUM` | `(Song)→(Album)` | Canción pertenece al álbum |
| `HAS_GENRE` | `(Artist)→(Genre)` | Género principal del artista |
| `PLAYED` | `(User)→(Song)` | Reproducción (timestamp, device, context, completed) |
| `FOLLOWS` | `(User)→(Artist)` | Usuario sigue al artista |
| `CONTAINS` | `(Playlist)→(Song)` | Playlist incluye canción (position) |
| `COLLABORATED_WITH` | `(Artist)↔(Artist)` | Colaboración musical (song_title, collab_type) |

---

## Estructura del repositorio

```
TPO_BDD2/
├── init_neo4j.js          # Script de carga del grafo (Node.js)
├── queries_neo4j.md        # 5 consultas Cypher del Req 7 + diagnóstico
├── queries_neo4j.cypher    # Mismo contenido, formato .cypher
├── init_spotify_db.js      # Script de carga MongoDB (referencia del otro equipo)
├── plan.md                 # Diseño técnico, decisiones y estado del proyecto
├── TP1_Tema08_Streaming.pdf # Enunciado del TP
├── package.json
└── CLAUDE.md               # Contexto para Claude Code
```

---

## Requerimientos cubiertos

| Req | Descripción | Estado |
|---|---|---|
| 6 | Diseño del grafo (nodos, etiquetas, relaciones, propiedades) | ✅ |
| 7a | Artistas a ≤2 saltos de colaboración | ✅ |
| 7b | Camino entre artistas sin collab directa | ✅ |
| 7c | Artistas puente entre ≥3 géneros | ✅ |
| 7d | Recomendación por usuarios similares | ✅ |
| 7e | Clusters de artistas por género dominante | ✅ |
| 8 | Justificación grafo vs. relacional | ⏳ En el informe |
| 9 | Datos coherentes con MongoDB | ✅ |
