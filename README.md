# Plataforma de Streaming Musical — TP Integrador

**Ingeniería de Datos II · UADE · Tema 8**  
1.ª Entrega: MongoDB + Neo4j · 2.ª Entrega: + Cassandra + Capa Poliglota

---

## Stack tecnológico

| Motor | Instancia | Rol |
|---|---|---|
| **MongoDB** | Atlas Free (AWS São Paulo) | Fuente de verdad — catálogo maestro (artistas, álbumes, canciones, playlists) |
| **Neo4j** | AuraDB Free | Red de grafos — colaboraciones entre artistas, recomendaciones por proximidad |
| **Cassandra** | DataStax Astra Free (AWS us-east-2) | Series temporales — eventos de reproducción, métricas horarias, charts diarios |

---

## Requisitos previos

- **Node.js** v18 o superior
- Archivo `.env` con las credenciales (ver `.env.example`)
- `secure-connect-streaming.zip` en la raíz del proyecto (Cassandra bundle)

---

## Setup inicial (primera vez)

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar template de credenciales y completar
cp .env.example .env
# Editar .env con: NEO4J_PASSWORD, MONGO_URI, CASSANDRA_TOKEN, CASSANDRA_BUNDLE_PATH

# 3. Cargar datos en Neo4j (grafo completo — idempotente)
node init_neo4j.js

# 4. Cargar datos en MongoDB (catálogo musical — idempotente)
node init_mongodb.js

# 5. Cargar datos en Cassandra (eventos + métricas + charts — idempotente)
node init_cassandra.js
```

> **Neo4j AuraDB Free** se pausa automáticamente tras 3 días de inactividad.  
> Reactivar en [console.neo4j.io](https://console.neo4j.io) antes de ejecutar la app.

---

## Capa poliglota — menú interactivo

```bash
node app/index.js
```

Presenta un menú numerado. Cada operación integra múltiples motores:

| Op | Motores | Descripción |
|---|---|---|
| **OP-1** | Cassandra → Neo4j → MongoDB | Página de inicio personalizada |
| **OP-2** | Cassandra + MongoDB | Registro de reproducción y actualización de métricas |
| **OP-3** | MongoDB + Neo4j | Perfil de artista con red de colaboraciones |
| **OP-4** | Cassandra → MongoDB | Chart diario por país (top 50) |
| **OP-5** | Cassandra + MongoDB + Neo4j | Reporte mensual de artista |

---

## Dataset cargado

| Entidad / Tabla | Cantidad |
|---|---|
| Artistas (MongoDB + Neo4j) | 80 |
| Álbumes (MongoDB + Neo4j) | 80 |
| Canciones (MongoDB + Neo4j) | 564 |
| Usuarios (MongoDB + Neo4j) | 200 |
| Géneros (Neo4j) | 18 |
| Playlists (MongoDB + Neo4j) | 5 |
| Reproducciones — `PLAYED` (Neo4j) | 50 000 |
| Colaboraciones — `COLLABORATED_WITH` (Neo4j) | 95 pares (190 relaciones) |
| Eventos Cassandra (`reproducciones_usuario`) | 5 000 |
| Charts diarios (`charts_diarios` + `chart_counters`) | ~4 870 filas |
| Métricas horarias (`metricas_horarias`) | ~4 974 filas |

---

## Consultas de referencia

### Cassandra — `queries_cassandra.cql`

| Req | Consulta |
|---|---|
| 3.1a | Historial reproducciones usuario — última semana |
| 3.1b | Total reproducciones canción — últimas 24h |
| 3.1c | Tasa de skip (no completadas / total) — último mes |
| 3.1d | Reproducciones de artista — mes actual |
| 3.2a | UPDATE métricas horarias (COUNTER) |
| 3.2b | Top 50 chart de un país en una fecha |
| 3.2c | Curva horaria de reproducciones de una canción |
| 3.2d | Detección de crecimiento explosivo (>300% vs. semana anterior) |
| 3.3a | Género dominante de un usuario — último mes |
| 3.3b | Horario de mayor actividad de un usuario |
| 3.3c | Tiempo total de escucha — última semana |

### MongoDB — `queries_mongodb.js`

```bash
node queries_mongodb.js
```

| Req | Consulta |
|---|---|
| 4a | Top 10 canciones más reproducidas en las últimas 24h |
| 4b | Historial semanal agrupado por **artista y género** simultáneamente |
| 4c | Canciones con alta reproducción y baja tasa de completitud |
| 4d | Playlists con mayor crecimiento de seguidores |
| 4e | Recomendación de álbumes para usuario premium |

### Neo4j — `queries_neo4j.md` / `queries_neo4j.cypher`

Pegar en [Neo4j Browser](https://browser.neo4j.io) conectado a la instancia del grupo:

| Req | Consulta |
|---|---|
| 7a | Artistas con más colaboraciones directas |
| 7b | Camino más corto entre dos artistas |
| 7c | Artistas puente (cross-genre) |
| 7d | Recomendación de artistas por vecindad en el grafo |
| 7e | Clusters de artistas altamente interconectados (vecindarios densos) |

---

## Verificación de carga

### Neo4j (Neo4j Browser)

```cypher
MATCH (n:Artist)  RETURN count(n);            // 80
MATCH (n:Song)    RETURN count(n);            // 564
MATCH (n:User)    RETURN count(n);            // 200
MATCH ()-[r:PLAYED]->()       RETURN count(r); // 50000
MATCH ()-[r:COLLABORATED_WITH]-() RETURN count(r); // 190
```

### MongoDB (Atlas o consola)

```javascript
db.artists.countDocuments()   // 80
db.songs.countDocuments()     // 564
db.plays.countDocuments()     // 50000
```

### Cassandra (Astra CQL Console)

```cql
SELECT COUNT(*) FROM streaming.reproducciones_usuario; -- 5000
SELECT COUNT(*) FROM streaming.chart_counters;         -- ~4870
SELECT COUNT(*) FROM streaming.metricas_horarias;      -- ~4974
```

---

## Modelo de datos

### Neo4j — nodos y relaciones

| Label / Relación | Propiedades clave |
|---|---|
| `Artist` | `stage_name` *(unique)*, `main_genre`, `country`, `followers` |
| `Album` | `uid` *(unique)*, `title`, `release_year` |
| `Song` | `uid` *(unique)*, `title`, `duration_ms`, `bpm`, `popularity` |
| `User` | `name` *(unique)*, `country`, `plan` |
| `Genre` | `name` *(unique)* |
| `(Artist)→[RELEASED]→(Album)` | — |
| `(Artist)→[PERFORMED]→(Song)` | — |
| `(User)→[PLAYED]→(Song)` | `timestamp`, `device`, `context`, `completed` |
| `(Artist)↔[COLLABORATED_WITH]↔(Artist)` | `song_title`, `collab_type` |

### Cassandra — tablas

| Tabla | Partition Key | Clustering | Uso |
|---|---|---|---|
| `reproducciones_usuario` | `usuario_id` | `timestamp DESC` | Historial por usuario |
| `reproducciones_cancion` | `cancion_id` | `timestamp DESC` | Popularidad por canción |
| `metricas_horarias` | `(cancion_id, fecha)` | `hora ASC` | Curva horaria (COUNTER) |
| `charts_diarios` | `(pais, fecha)` | `reproducciones DESC` | Snapshot histórico pre-calculado |
| `chart_counters` | `(pais, fecha)` | `cancion_id` | Ranking live actualizable (COUNTER) |
| `historial_artista` | `(artista_id, anio_mes)` | `timestamp DESC` | Métricas mensuales de artista |

> **`chart_counters` vs `charts_diarios`**: `chart_counters` es una tabla COUNTER que se incrementa en cada evento (OP-2). Permite leer el ranking live en cualquier momento. `charts_diarios` es un snapshot pre-calculado con `reproducciones` como clustering key (ordenamiento nativo DESC), útil para consultas históricas sobre datos de días anteriores.

---

## Estructura del repositorio

```
TPO_BDD2/
├── init_neo4j.js           # Carga del grafo Neo4j (idempotente)
├── init_mongodb.js         # Carga del catálogo MongoDB (idempotente)
├── init_cassandra.js       # Carga de Cassandra: 6 tablas + ~5000 eventos (idempotente)
├── queries_neo4j.md        # 5 queries Cypher (Req 7) con notas y resultados esperados
├── queries_neo4j.cypher    # Mismo contenido, formato raw
├── queries_mongodb.js      # 5 queries MongoDB (Req 4) corregidas
├── queries_cassandra.cql   # 11 queries CQL (Req 3.1–3.3)
├── app/
│   ├── index.js            # Menú interactivo — capa poliglota
│   ├── config.js           # Conexiones a los 3 motores (desde .env)
│   ├── db/
│   │   ├── cassandra.js    # Helpers Cassandra (registro, charts, métricas, comportamiento)
│   │   ├── mongodb.js      # Helpers MongoDB (catálogo, búsqueda, popularidad)
│   │   └── neo4j.js        # Helpers Neo4j (grafo, recomendaciones, colaboraciones)
│   └── ops/
│       ├── op1_homepage.js
│       ├── op2_play_event.js
│       ├── op3_artist_page.js
│       ├── op4_chart.js
│       └── op5_report.js
├── .env.example            # Template de credenciales (sin valores reales)
├── secure-connect-streaming.zip  # Bundle Cassandra — NO commitear (ver .gitignore)
└── package.json
```

---

## Variables de entorno

```env
# Neo4j AuraDB
NEO4J_URI=neo4j+s://<instance>.databases.neo4j.io
NEO4J_USER=<user>
NEO4J_PASSWORD=<password>
NEO4J_DATABASE=<database>

# MongoDB Atlas
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ing-datos-II?retryWrites=true&w=majority
MONGO_DB=ing-datos-II

# DataStax Astra (Cassandra)
CASSANDRA_BUNDLE_PATH=./secure-connect-streaming.zip
CASSANDRA_TOKEN=AstraCS:<token>
CASSANDRA_KEYSPACE=streaming
```

---

## Correcciones TP1 incorporadas

| Error | Corrección |
|---|---|
| **MongoDB Req 4b** — agrupaba solo por artista | Ahora agrupa por `{ artista, genero }` simultáneamente en el mismo `$group` |
| **Neo4j Req 7e** — agrupaba por género en lugar de detectar comunidades | Ahora detecta vecindarios densos: artistas con ≥2 colaboradores comunes |
