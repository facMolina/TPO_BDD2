# 04 — Cassandra — Defensa Oral

⭐⭐⭐ **El motor con más probabilidad de práctica**. El ejemplo concreto que le pidieron a un compañero fue **en Cassandra**: "Insertá un registro en `eventos` con partition key `municipio_001` y consultá la partición". Memorizá la sintaxis CQL.

---

## PARTE 1 — Resumen conceptual

### ¿Qué es Cassandra?

> "Cassandra es una **base de datos NoSQL tabular distribuida** (wide column store). Creada por Facebook (2008), open source bajo Apache. Su arquitectura es **peer-to-peer**: **no hay master**, todos los nodos son iguales. Está diseñada para **escritura masiva distribuida** y **alta disponibilidad**. Es **AP** según CAP. Para nosotros es el motor que absorbe los 400M eventos de reproducción diarios sin saturar al resto del sistema."

### Conceptos centrales

| Concepto | Definición |
|---|---|
| **Keyspace** | ≈ Base de datos (contenedor lógico). Define replicación. |
| **Table / Column Family** | Tabla con columnas. Una tabla = una pregunta. |
| **Partition Key** | Determina en qué **nodo físico** vive la fila. Hash → token → ring. |
| **Clustering Key** | Ordena las filas **dentro de la partición**. Permite rangos. |
| **Primary Key** | `(partition key, clustering key)` |
| **Token Ring** | Espacio de hashes 0-2³². Cada nodo posee un rango. |
| **Replication Factor (RF)** | Cuántas copias de cada dato (típico: 3). |
| **Consistency Level (CL)** | Cuántos nodos confirman por operación. ONE, QUORUM, ALL. |
| **VNodes** | 256 tokens virtuales por nodo (default). Mejor balanceo automático. |
| **Tombstone** | Marca de borrado. No se elimina inmediatamente. |

### Arquitectura (lo que tenés que saber decir)

```
                         CLUSTER CASSANDRA
                         (peer-to-peer ring)

                   N1 (token range 0-1F)
                  ╱                       ╲
                 ╱                         ╲
            N6                              N2
           ╱                                  ╲
          ╱      ◯ Sin nodo master              ╲
         ╱       ◯ Gossip Protocol (estado)       ╲
        ╱        ◯ Token Ring (hash de PK)         ╲
        ╲        ◯ RF=3: copia en 3 nodos          ╱
         ╲       ◯ Cualquier nodo es coordinador   ╱
          ╲                                       ╱
           ╲                                     ╱
            N5                                  N3
             ╲                                ╱
              ╲                              ╱
                   N4 (token range 60-7F)
```

### Características técnicas

- **Almacenamiento**: LSM-Tree (Log-Structured Merge Tree). Write path: CommitLog (WAL) + MemTable (RAM) → flush a SSTable inmutable.
- **Compaction**: fusión periódica de SSTables. Estrategias: STCS, LCS, TWCS.
- **Bloom Filters**: probabilísticos, evitan lecturas innecesarias de disco.
- **Read Path**: MemTable → Row Cache → Bloom Filter → SSTable.
- **Sin JOINs**, sin queries ad-hoc → **query-first design**.
- **CAP**: **AP** — prioriza Availability y Partition Tolerance, consistencia eventual (configurable).
  - 💡 **AP** = **A**vailability + **P**artition tolerance. Lo opuesto a CP de Mongo/Neo4j. Bajo partición de red, Cassandra **sigue aceptando lecturas y escrituras** en cada lado de la partición — los datos pueden divergir temporalmente y **convergen después** cuando la red se restaura (eventual consistency). Se puede "subir" la consistencia por operación con `CL=QUORUM` (fórmula `W+R>N`).

### Tablas del TP

| Tabla | Partition Key | Clustering | Uso |
|---|---|---|---|
| `reproducciones_usuario` | `usuario_id` | `timestamp DESC` | Historial por usuario |
| `reproducciones_cancion` | `cancion_id` | `timestamp DESC` | Métricas por canción |
| `metricas_horarias` | `(cancion_id, fecha)` | `hora ASC` | Curva horaria — COUNTER |
| `charts_diarios` | `(pais, fecha)` | `reproducciones DESC, cancion_id ASC` | Snapshot histórico pre-calculado |
| `chart_counters` | `(pais, fecha)` | `cancion_id` | Ranking live — COUNTER |
| `historial_artista` | `(artista_id, anio_mes)` | `timestamp DESC` | Métricas mensuales |

### ¿Por qué `chart_counters` además de `charts_diarios`?

> "Cassandra tiene una restricción: una tabla con columnas **COUNTER** no puede mezclarlas con columnas regulares. `charts_diarios` es un snapshot pre-calculado con `reproducciones` como **clustering key DESC** (permite top-N por orden nativo). `chart_counters` recibe los `UPDATE +1` en tiempo real desde OP-2. La separación está forzada por la limitación de COUNTER."

---

## PARTE 2 — Q&A para la defensa

### ⭐ Q1: ¿Por qué Cassandra para los eventos de reproducción?

**Respuesta corta**:
> "Por el volumen: 400 millones de reproducciones diarias = 4.600 escrituras/segundo sostenidas. MongoDB es CP y prioriza consistencia → introduce latencia en escrituras concurrentes. Neo4j no está pensado para ingestión de alta frecuencia. Cassandra está diseñada específicamente para esto: arquitectura distribuida **sin coordinador central**, cada escritura se resuelve localmente en el nodo responsable de la partición."

### ⭐ Q2: ¿Cassandra es AP o CP?

**Respuesta corta**:
> "**AP** — prioriza Availability y Partition Tolerance. Acepta **consistencia eventual** entre réplicas. Pero la consistencia es **tunable**: con `CL = QUORUM` + `RF = 3` (W+R > N), se puede lograr consistencia fuerte por operación."

💡 **Si repregunta**: "La fórmula es `W + R > N`. Si RF=3 y leo/escribo con QUORUM (2), entonces 2+2=4 > 3 → fuerte. Si escribo con ONE (1) y leo con ONE (1), 1+1=2 ≤ 3 → eventual."

### ⭐ Q3: ¿Qué es la partition key? ¿Por qué es la decisión más importante?

**Respuesta corta**:
> "La partition key determina en **qué nodo físico** vive la fila. Se hashea (Murmur3) y el resultado se busca en el token ring. Si elegís mal la partition key, generás un **hot partition**: un nodo recibe todo el tráfico y se satura mientras los demás están ociosos."

💡 **Criterios para una buena partition key**:
- **Alta cardinalidad**: muchos valores distintos → distribución uniforme.
- **Baja frecuencia por valor**: que ningún valor se repita demasiado.
- **Acceso por igualdad**: las queries siempre filtran por la partition key con `=`.

⚠️ **Anti-pattern**: usar un boolean o un campo con pocos valores (`active = true/false`) como partition key → solo 2 particiones → desbalance brutal.

### ⭐ Q4: ¿Qué es la clustering key?

**Respuesta corta**:
> "La clustering key **ordena las filas dentro de la partición**. Permite hacer queries de rango eficientes. Ejemplo: `PRIMARY KEY ((usuario_id), timestamp DESC)` → todas las repros de un usuario en una partición, ordenadas por timestamp descendente. Puedo pedir 'las últimas 10 reproducciones' sin ordenar en memoria."

### ⭐ Q5: ¿Qué es query-first design?

**Respuesta corta**:
> "En SQL normalizás primero y consultás después. En Cassandra es **al revés**: definís las queries primero y modelás las tablas para servirlas. **Una tabla por query**. Es por eso que el TP tiene 6 tablas para reproducciones — cada una responde a una pregunta distinta."

💡 **Frase clave**: "Cassandra modela alrededor de tus queries, no de tus datos."

### Q6: ¿Por qué Cassandra no soporta JOINs?

**Respuesta corta**:
> "Porque los datos están distribuidos en múltiples nodos. Un JOIN requeriría coordinación entre nodos → latencia impredecible y carga sobre el coordinador. La solución es **desnormalización consciente**: duplicar el dato en múltiples tablas. El storage es barato; la latencia de lectura no."

### ⭐ Q7: ¿Qué es el riesgo de hot partition?

**Respuesta corta**:
> "Cuando una partición concentra demasiados datos o tráfico. Ejemplo: si modelás métricas horarias con `PK = cancion_id`, una canción viral con 50M de reproducciones diarias generaría una partición enorme que satura el nodo. **Solución**: agregar un cubo de tiempo a la partition key, ej: `PK = (cancion_id, fecha)` → la partición está acotada a 24 filas/día."

💡 En nuestro TP usamos esta estrategia en `metricas_horarias`, `historial_artista` (`anio_mes`) y `charts_diarios` (`fecha`).

### Q8: ¿Qué es ALLOW FILTERING y por qué evitarlo?

**Respuesta corta**:
> "Es una directiva que fuerza un **escaneo de tabla completa** (full scan) en todos los nodos del cluster. Útil en desarrollo, **catastrófico en producción** con datasets grandes. La alternativa correcta es modelar una **tabla dedicada** para esa query."

### Q9: ¿Qué es un tombstone?

**Respuesta corta**:
> "Es la marca que Cassandra deja cuando se hace DELETE. **El dato no se elimina inmediatamente** — se marca como borrado y se elimina realmente durante la compaction. Si se acumulan muchos tombstones, las lecturas se degradan (warnings tipo `Read N live rows and M tombstone cells`)."

💡 **Anti-pattern**: muchos DELETE → mejor usar **TTL** (time-to-live) cuando es posible.

### ⭐ Q10: ¿Qué son los COUNTER columns?

**Respuesta corta**:
> "Son columnas especiales que solo aceptan incrementos atómicos distribuidos (`UPDATE table SET col = col + 1`). No se usan con INSERT. **Restricción**: una tabla con COUNTER solo puede tener PK + columnas COUNTER, no se pueden mezclar con columnas regulares. Por eso en el TP tenemos 2 tablas separadas: `charts_diarios` (snapshot) y `chart_counters` (COUNTER, live)."

### Q11: ¿Qué es el Gossip Protocol?

**Respuesta corta**:
> "Es el protocolo de comunicación entre nodos. Cada segundo, cada nodo elige 1-3 vecinos al azar y comparte su estado (load, schema version, status). En O(log N) rounds, todos los nodos conocen el estado del cluster. **No hay SPOF** en el plano de control."

### Q12: ¿Qué son los Virtual Nodes (vnodes)?

**Respuesta corta**:
> "Cada nodo ocupa 256 posiciones aleatorias en el token ring (vs 1 sola en el legacy). Beneficios: mejor balanceo automático, migración paralela al agregar nodos, sin asignación manual de tokens."

### ⭐ Q13: ¿Qué es Tunable Consistency?

**Respuesta corta**:
> "Cassandra te deja elegir el nivel de consistencia **por operación**, no a nivel de motor. Niveles: ANY, ONE, QUORUM, LOCAL_QUORUM, ALL. La fórmula `W + R > N` garantiza consistencia fuerte."

| RF | Write CL | Read CL | W+R>N? | Resultado |
|---|---|---|---|---|
| 3 | ONE | ONE | 2>3 ❌ | Eventual |
| 3 | QUORUM | QUORUM | 4>3 ✅ | **Fuerte (balance recomendado)** |
| 3 | ALL | ONE | 4>3 ✅ | Fuerte (writes lentos) |
| 3 | ONE | ALL | 4>3 ✅ | Fuerte (reads lentos) |

### Q14: ¿Qué es la LWT (Lightweight Transaction)?

**Respuesta corta**:
> "Es la forma de hacer Compare-And-Swap distribuido en Cassandra. Usa el protocolo **Paxos**. Sintaxis: `INSERT ... IF NOT EXISTS` o `UPDATE ... IF condition`. **Costo**: ~4× la latencia de una write normal. Usar solo cuando la unicidad sea crítica."

---

## PARTE 3 — Queries prácticas (CQL)

### 🔍 Cómo acceder a la consola web de DataStax Astra (Cassandra)

Para practicar CQL en la base real del TP **sin instalar nada**:

1. Andá a **[astra.datastax.com](https://astra.datastax.com)** e iniciá sesión con la cuenta del grupo.
2. En el panel izquierdo → **Databases** → seleccioná la database `streaming`.
3. Tab **`CQL Console`** (segunda solapa, arriba) → se abre una terminal `cqlsh` en el navegador.
4. Cuando carga, ejecutá primero:
   ```cql
   USE streaming;
   ```
   Para trabajar dentro del keyspace correcto.
5. Ya podés ejecutar cualquier query (CREATE, INSERT, SELECT, etc.).

> 💡 **Atajo**: `DESC TABLES;` te lista todas las tablas del keyspace activo.
>
> 💡 **Si tarda en cargar**: la primera vez, Astra "calienta" la database — esperá 30-60 segundos.

> 🌐 **Si te pide elegir un keyspace al abrir la consola**: elegí `streaming`.

> 🖥️ **Alternativa local con cqlsh**: si querés practicar offline necesitás el secure-connect-bundle y el script:
> ```bash
> pip install cqlsh-astra
> cqlsh -b ./secure-connect-streaming.zip -u token -p $CASSANDRA_TOKEN
> ```

---

### 📝 Anatomía de una query en CQL

CQL (Cassandra Query Language) es **muy parecido a SQL en la sintaxis**, pero con restricciones derivadas del modelo distribuido. Si sabés SQL, ya entendés el 70%.

#### A) Las palabras clave que vas a usar

| Cláusula | Para qué |
|---|---|
| `CREATE KEYSPACE` | Crear "base de datos" |
| `CREATE TABLE` | Crear tabla con `PRIMARY KEY` obligatoria |
| `INSERT INTO ... VALUES (...)` | Insertar fila |
| `SELECT ... FROM ... WHERE ...` | Consultar (con restricciones) |
| `UPDATE ... SET ... WHERE ...` | Actualizar |
| `DELETE ... FROM ... WHERE ...` | Borrar (crea tombstone) |
| `USING TTL n` | Expiración automática en `n` segundos |
| `USE <keyspace>;` | Cambiar de keyspace activo |
| `DESCRIBE TABLES;` | Listar tablas |
| `BATCH ... APPLY BATCH` | Atomicidad entre operaciones de una partición |

#### B) Lo que **NO** se puede hacer en CQL

- ❌ **JOINs** — no existen. Si necesitás datos de 2 tablas, leés cada una por separado.
- ❌ **Subqueries** — no soportadas.
- ❌ **WHERE libre** — solo se puede filtrar por columnas que estén en el `PRIMARY KEY` (o que tengan índice). Para filtrar libre se necesita `ALLOW FILTERING` (anti-pattern en producción).
- ❌ **GROUP BY libre** — solo dentro de una partición.

#### C) Anatomía de un CREATE TABLE

```cql
CREATE TABLE reproducciones_usuario (
    usuario_id  TEXT,              ← columna
    timestamp   TIMESTAMP,         ← columna
    cancion_id  TEXT,              ← columna
    completada  BOOLEAN,           ← columna
    PRIMARY KEY ((usuario_id), timestamp)
              ──┬──── ──┬─────
                │       └── clustering key (ordena dentro de la partición)
                └── partition key (decide en qué nodo va la fila)
) WITH CLUSTERING ORDER BY (timestamp DESC);
                          ──┬──── ─┬──
                            │      └── DESC = más reciente primero
                            └── ordena por timestamp
```

⭐ **Si el profe te pide explicar una PRIMARY KEY**:

```cql
PRIMARY KEY ((partition_key_1, partition_key_2), clustering_key_1, clustering_key_2)
            └─── Partition Key compuesta ────┘  └──── Clustering ────┘
```

- **Partition Key** = decide en qué nodo del cluster va la fila (hash → token ring).
- **Clustering Key** = ordena las filas **dentro de la partición**.
- **Primary Key** = (partition key, clustering key) — identifica la fila unívocamente.

#### D) Cómo se arma un INSERT

```cql
INSERT INTO <tabla> (col1, col2, col3)
VALUES (val1, val2, val3)
[USING TTL <segundos>];
```

- Los valores van en el **mismo orden** que las columnas.
- No hay `AUTO_INCREMENT` → si querés un ID único, usá `uuid()` o `now()` (timeuuid).
- `USING TTL` es opcional, define expiración automática.

#### E) Cómo se arma un SELECT — la regla de oro

```cql
SELECT col1, col2 FROM tabla
WHERE <partition_key> = ?                    ← OBLIGATORIO casi siempre
  AND <clustering_key> >= ? AND <clustering_key> <= ?   ← rango opcional
[LIMIT N];
```

**Regla**: el `WHERE` **siempre** debe incluir la partition key con `=`. Sin partition key → tendrías que hacer un scan global (que Cassandra rechaza salvo con `ALLOW FILTERING`).

#### F) UPDATE COUNTER — sintaxis especial

```cql
UPDATE tabla_counter
SET contador = contador + 1
WHERE partition_key = ? AND clustering_key = ?;
```

⚠️ No se usa `INSERT` para columnas COUNTER. Solo `UPDATE col = col + N`.

#### G) Reglas para escribir CQL

1. **`WHERE` solo por partition key + clustering key**. Si necesitás filtrar por otra columna, modelá una tabla nueva con esa PK.
2. **Sin JOINs**: leés cada tabla por separado y combinás en la app.
3. **Sin ORDER BY libre**: el orden está predeterminado por la clustering key. Solo podés invertirlo (ASC/DESC).
4. **Cada DELETE crea un tombstone**: si tenés que borrar mucho, mejor usar `TTL`.
5. **Counter columns** son un tipo especial: tabla dedicada, solo `UPDATE`, nunca `INSERT`.

---

### 3.1 El ejemplo que le dieron a tu compañero (memorizalo)

> 🖥️ **Dónde ejecutarlas**: las queries de esta sección están escritas para **Astra CQL Console**.
>
> Abrir desde [astra.datastax.com](https://astra.datastax.com) → database `streaming` → tab **CQL Console** → cuando carga, ejecutá `USE streaming;` primero.
>
> Cada sentencia termina en `;` y se ejecuta con `Enter`. La consola guarda historial — flecha arriba para repetir comandos.

📝 **Crear tabla y CRUD básico**:

```cql
-- Crear keyspace
CREATE KEYSPACE IF NOT EXISTS demo
  WITH replication = {'class':'SimpleStrategy','replication_factor':1};

USE demo;

-- Crear tabla con partition key + clustering key
CREATE TABLE IF NOT EXISTS eventos (
  organismo_id  TEXT,
  evento_ts     TIMESTAMP,
  estado        TEXT,
  payload       TEXT,
  PRIMARY KEY ((organismo_id), evento_ts)
) WITH CLUSTERING ORDER BY (evento_ts DESC);

-- INSERT
INSERT INTO eventos (organismo_id, evento_ts, estado, payload)
VALUES ('municipio_001', toTimestamp(now()), 'activo', '{"detalle":"alta"}');

-- SELECT: todos los registros de la partición
SELECT * FROM eventos WHERE organismo_id = 'municipio_001';

-- SELECT con rango de clustering
SELECT * FROM eventos
WHERE organismo_id = 'municipio_001'
  AND evento_ts >= '2026-06-01 00:00:00'
  AND evento_ts <  '2026-07-01 00:00:00';

-- UPDATE: requiere PK completa
UPDATE eventos SET estado = 'inactivo'
WHERE organismo_id = 'municipio_001' AND evento_ts = '2026-06-15 10:30:00';

-- DELETE
DELETE FROM eventos
WHERE organismo_id = 'municipio_001' AND evento_ts = '2026-06-15 10:30:00';
```

⭐ **Si te piden exactamente lo que le dieron al compañero**: copiá y pegá el patrón anterior.

### 3.2 Queries del dominio del TP

📝 **Req 3.1a — Historial usuario última semana**:

```cql
SELECT * FROM reproducciones_usuario
WHERE usuario_id = 'User_1'
  AND timestamp >= '2026-06-08 00:00:00';
```

📝 **Req 3.1b — Total repros canción últimas 24h**:

```cql
SELECT COUNT(*) FROM reproducciones_cancion
WHERE cancion_id = 'The Weeknd::Blinding Lights'
  AND timestamp >= '2026-06-14 00:00:00';
```

📝 **Req 3.2a — Actualizar métricas horarias (COUNTER)**:

```cql
UPDATE metricas_horarias
SET reproducciones = reproducciones + 1
WHERE cancion_id = 'The Weeknd::Blinding Lights'
  AND fecha = '2026-06-15'
  AND hora = 14;
```

📝 **Req 3.2b — Top 50 chart por país**:

```cql
SELECT * FROM charts_diarios
WHERE pais = 'AR' AND fecha = '2026-06-15'
LIMIT 50;
```

📝 **Req 3.2c — Curva horaria**:

```cql
SELECT hora, reproducciones
FROM metricas_horarias
WHERE cancion_id = 'The Weeknd::Blinding Lights'
  AND fecha = '2026-06-15';
```

📝 **Req 3.1d — Reproducciones de artista en mes**:

```cql
SELECT * FROM historial_artista
WHERE artista_id = 'The Weeknd'
  AND anio_mes = '2026-06';
```

### 3.3 Queries genéricas — más casos tipo profe

📝 **Time-series IoT con bucket pattern**:

```cql
CREATE TABLE sensor_metrics (
  sensor_id   TEXT,
  bucket      TEXT,        -- 'YYYYMM' para evitar partition gigante
  ts          TIMESTAMP,
  temperatura FLOAT,
  humedad     FLOAT,
  PRIMARY KEY ((sensor_id, bucket), ts)
) WITH CLUSTERING ORDER BY (ts DESC);

-- INSERT
INSERT INTO sensor_metrics (sensor_id, bucket, ts, temperatura, humedad)
VALUES ('S-001', '202606', toTimestamp(now()), 22.5, 65.3);

-- Últimos 100 registros del sensor en junio
SELECT * FROM sensor_metrics
WHERE sensor_id = 'S-001' AND bucket = '202606'
LIMIT 100;
```

📝 **TTL — expiración automática**:

```cql
-- TTL a nivel de tabla (default para todas las filas)
CREATE TABLE web_sessions (
  session_id TEXT PRIMARY KEY,
  user_id    UUID,
  data       TEXT
) WITH default_time_to_live = 1800;  -- 30 minutos

-- TTL en una inserción específica
INSERT INTO sesiones (id, datos)
VALUES (uuid(), 'token_abc')
USING TTL 3600;  -- 1 hora

-- Ver TTL restante
SELECT TTL(data) FROM web_sessions WHERE session_id = 'sess_123';
```

📝 **Colecciones (LIST, SET, MAP)**:

```cql
CREATE TABLE productos (
  id        UUID PRIMARY KEY,
  nombre    TEXT,
  tags      SET<TEXT>,
  imagenes  LIST<TEXT>,
  metadata  MAP<TEXT, TEXT>
);

INSERT INTO productos (id, nombre, tags, imagenes, metadata)
VALUES (
  uuid(), 'Laptop Pro',
  {'tech','laptop','nuevo'},
  ['img1.jpg', 'img2.jpg'],
  {'color':'negro', 'marca':'Dell'}
);

UPDATE productos
SET tags = tags + {'oferta'},
    metadata['stock'] = '45'
WHERE id = ?;
```

📝 **Counter table**:

```cql
CREATE TABLE page_views (
  page_id    TEXT,
  date       DATE,
  views      COUNTER,
  PRIMARY KEY ((page_id), date)
);

UPDATE page_views SET views = views + 1
WHERE page_id = '/home' AND date = '2026-06-15';

SELECT views FROM page_views
WHERE page_id = '/home' AND date = '2026-06-15';
```

📝 **BATCH y LWT**:

```cql
-- BATCH atómico
BEGIN BATCH
  INSERT INTO users (user_id, email) VALUES (uuid(), 'a@x.com');
  INSERT INTO users_by_email (email, user_id) VALUES ('a@x.com', ?);
APPLY BATCH;

-- LWT (CAS)
UPDATE inventario
SET stock = stock - 1
WHERE product_id = ?
IF stock > 0;

-- INSERT condicional
INSERT INTO users (user_id, email)
VALUES (uuid(), 'unico@mail.com')
IF NOT EXISTS;
```

📝 **Índice secundario y ALLOW FILTERING**:

```cql
CREATE INDEX idx_email ON users (email);
SELECT * FROM users WHERE email = 'ana@x.com';

-- ⚠️ ALLOW FILTERING solo en dev / datasets pequeños
SELECT * FROM users WHERE active = true ALLOW FILTERING;

-- ✅ Mejor: tabla dedicada
CREATE TABLE users_by_status (
  status   TEXT,
  user_id  UUID,
  email    TEXT,
  PRIMARY KEY ((status), user_id)
);
```

📝 **DDL — administración**:

```cql
DESCRIBE KEYSPACES;
DESCRIBE TABLES;
DESCRIBE TABLE eventos;

ALTER TABLE eventos ADD prioridad INT;

TRUNCATE TABLE eventos;     -- borra datos, mantiene esquema
DROP TABLE eventos;
DROP KEYSPACE demo;
```

---

## PARTE 4 — Errores conceptuales a NO cometer

⚠️ **NO decir**: "Cassandra es como una base relacional con replicación."
✅ **Correcto**: "Cassandra es **wide column store** con modelado **query-first**. Sin JOINs, sin queries ad-hoc, sin ACID transaccional global."

⚠️ **NO decir**: "Usar ALLOW FILTERING resuelve el problema."
✅ **Correcto**: "ALLOW FILTERING en producción es un anti-pattern. La solución correcta es **otra tabla** con la PK adecuada para esa query."

⚠️ **NO confundir**: partition key vs primary key vs clustering key.
- **Primary key** = `(partition key, clustering key)`.
- **Partition key** = decide el nodo.
- **Clustering key** = ordena dentro de la partición.

⚠️ **NO usar DELETE masivo**: crea tombstones que degradan las lecturas. Usar TTL si es posible.

⚠️ **NO mezclar COUNTER con columnas regulares** en la misma tabla.

⚠️ **NO usar partition key monótona** (ej: timestamp) → todo va a la misma partición.

---

## PARTE 5 — Read Path / Write Path (por si pregunta internals)

### Write Path

```
1. Client → Coordinator (cualquier nodo)
2. Coordinator → hash(PK) → nodos responsables (según RF)
3. Cada réplica:
   • Append al CommitLog (WAL → durabilidad)
   • Escribe en MemTable (RAM)
   • ACK al coordinador
4. Coordinator confirma según CL (ONE/QUORUM/ALL)
5. MemTable → flush a SSTable inmutable (cuando llena)
6. Compaction: fusión periódica de SSTables
```

**Clave**: las escrituras son **append-only** → latencia muy baja y predecible.

### Read Path

```
1. Client → Coordinator
2. Coordinator → réplicas (según CL)
3. En cada réplica:
   • Buscar en MemTable (RAM)
   • Si no, Bloom Filter → ¿podría estar en esta SSTable?
   • Si sí, leer del SSTable
   • Fusionar resultados con tombstones aplicados
4. Coordinador unifica resultados de las réplicas (read repair si hay divergencia)
5. Retorna al cliente
```

---

## PARTE 6 — Comparativa rápida

| | MongoDB | Neo4j | **Cassandra** |
|---|---|---|---|
| Modelo | Documento | Grafo | **Wide Column** |
| Queries ad-hoc | ✅ | ✅ | ❌ |
| Escritura masiva | Media | Baja | ✅ **Excelente** |
| JOINs | `$lookup` | Traversal nativo | **No** |
| CAP | CP (default) | CP | **AP** |
| Consistencia | Configurable | Strong | **Tunable per-op** |
| Caso ideal | Catálogos | Redes | **Time-series, eventos** |
