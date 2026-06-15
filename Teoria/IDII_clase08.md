<!-- Slide number: 1 -->

CLASE 8
Cassandra
en Profundidad & CQL Avanzado

Unidad II  ·  Modelos NoSQL  ·  Arquitectura Interna & Modelado Avanzado
Continuación de Clase 7  ·  Prerrequisito: Fundamentos de CQL
Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE  ·  2025

### Notes:

<!-- Slide number: 2 -->

AGENDA
Agenda de la clase

BLOQUE 1
Repaso Clase 7 · Arquitectura peer-to-peer · Token Ring · Gossip Protocol

BLOQUE 2
Snitch · Virtual Nodes · Replicación · Estrategias de compaction

BLOQUE 3
Read/Write path · Coordinación · Tunable Consistency en profundidad

BLOQUE 4
CQL Avanzado: Aggregations · Secondary Index · SASI · SAI

BLOQUE 5
Materialized Views · UDF/UDA · Integración con Spark · Drivers

BLOQUE 6
Ejercicio integrador avanzado · Monitoreo con nodetool · Cierre

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 3 -->

BLOQUE 1
Arquitectura Peer-to-Peer · Token Ring · Gossip

### Notes:

<!-- Slide number: 4 -->

CONTEXTO
¿Dónde estamos? Recapitulación Clase 7

En la Clase 7 cubrimos el modelo tabular y CQL básico. Hoy entramos al motor.

✔ Clase 7 — cubierto
★ Clase 8 — hoy
→  Modelo tabular: Partition Key + Clustering Key
→  Cómo Cassandra distribuye y replica datos internamente
→  Query-First Design y desnormalización
→  Read path y write path paso a paso
→  DDL / DML / Tipos / TTL / Colecciones / UDT
→  CQL avanzado: SAI, MV, UDF/UDA, funciones de agregación
→  Consistencia tunable: ONE, QUORUM, ALL
→  Integración con Spark · nodetool · drivers de aplicación

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 5 -->

ARQUITECTURA
Token Ring: Cómo se Distribuyen los Datos

Cassandra divide el espacio de tokens en rangos. Cada nodo posee uno o más rangos. La partition key se hashea a un token (Murmur3).

N1
0–1F

Consistent Hashing

El hash de la PK determina el rango → el nodo responsable. Sin tabla de routing centralizada.
20–3F
A0–BF

N6

N2

Replication Factor
RF=3: el dato se almacena en N1 + 2 nodos consecutivos en el ring en sentido horario.
Token
Ring

Coordinador
Cualquier nodo puede recibir la request del cliente y coordinar la escritura/lectura.

N3

N5

VNODES
80–9F
40–5F
Cada nodo puede tener 256 tokens virtuales → mejor distribución automática al agregar nodos.

N4
60–7F

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 6 -->

ARQUITECTURA
Virtual Nodes (VNodes): Distribución Real

Sin VNodes: cada nodo tiene 1 token. Agregar un nodo requiere rebalanceo manual. Con VNodes: 256 tokens por nodo, balanceo automático.

❌ Sin VNodes (legacy)
✔ Con VNodes (recomendado)

N1
33%

N1  N2  N3

N3
33%

N2
33%

Al agregar N4: debe moverse 25% de datos
de cada nodo → operación costosa y manual.
Al agregar N4: toma automáticamente
~256 tokens → datos migran en paralelo.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 7 -->

ARQUITECTURA
Gossip Protocol: Detección de Estado

Cassandra no tiene nodo maestro. Los nodos se comunican entre sí mediante gossip para conocer el estado del cluster.

N2

Cada segundo

Cada nodo elige 1-3 nodos al azar y comparte su estado (generación, versión, endpoint state).

N1

N3

UP

Endpoint State

UP

UP
Incluye: load, schema version, tokens, DC, rack, status (NORMAL/LEAVING/JOINING).

N4
Failure Detection

N5
Accrual Failure Detector: marca un nodo como DOWN si supera el threshold de latencia de gossip.

DOWN

Propagación

UP
En O(log N) rounds, todos los nodos conocen el estado de todos. Sin SPOF en el plano de control.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 8 -->

ARQUITECTURA
Snitch: Topología de Red y Routing

El Snitch le dice a Cassandra dónde está cada nodo (datacenter, rack). Determina cómo se eligen las réplicas y el nodo coordinador.

SimpleSnitch
GossipingPropertyFile
Snitch
Ec2Snitch
Dev/test. Un solo DC. No considera topología de red.
Producción recomendado. Lee cassandra-rackdc.properties. Auto-propaga via gossip.
AWS single-region. AZ = rack, region = DC. Configuración cero.

Ec2MultiRegion
Snitch
RackInferring
Snitch
DynamoSeed
Snitch
AWS multi-region. Usa IP privada para comunicación intra-región.
Infiere DC/rack desde la IP (octeto 2 = DC, octeto 3 = rack). Simple pero frágil.
Para setups on-premise con múltiples DCs definidos manualmente.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 9 -->

BLOQUE 2
Replicación · Estrategias de Compaction

### Notes:

<!-- Slide number: 10 -->

REPLICACIÓN
Estrategias de Replicación

La estrategia de replicación determina en qué nodos se colocan las copias de cada partición.

SimpleStrategy  (dev/single-DC)
NetworkTopologyStrategy (producción)

DC East
RF=3

DC West
RF=2

N1

R1

N1

N4

N5

N2

N2

N5
R2

N3

N4

N3
RF=3: primario (N1) + 2 consecutivos
en el ring (N2, N3). Sin awareness de DC/rack.
Réplicas por DC + rack-aware placement.
Survive fallas de datacenter completo.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 11 -->

INTERNALS
Write Path: De la App al Disco

Una escritura en Cassandra es siempre O(1) — append-only. Sin locks, sin B-Tree updates.

1
Client

2
Coordinator

3
CommitLog

4
MemTable

5
SSTable
(flush)

6
Compaction

Envía la write al nodo coordinador.
Calcula el token de la PK. Identifica los N nodos según RF.
Escribe en el CommitLog (WAL) de cada réplica. Durabilidad garantizada.
Escribe en MemTable (RAM). La operación retorna ACK al cliente.
Cuando la MemTable alcanza threshold → flush inmutable a SSTable en disco.
SSTables se fusionan periódicamente. Tombstones eliminados. Bloom Filters actualizados.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 12 -->

INTERNALS
Read Path: Cómo se lee en Cassandra

La lectura es más compleja que la escritura: debe fusionar datos de MemTable + múltiples SSTables.

MemTable
(RAM)

Siempre se busca primero. O(1) si el dato está en memoria.

Row Cache
(opcional)

Si está habilitado y hay hit: retorna inmediatamente sin tocar disco.

Bloom Filter
(por SSTable)

Probabilístico: si dice NO → esa SSTable se saltea. FPP configurable.

Partition Key
Index

Localiza el offset del bloque comprimido en el SSTable data file.

SSTable
(disco)

Lee el bloque. Descomprime si aplica. Fusiona con otros resultados.

★  Read Repair: si las réplicas divergen durante una lectura, Cassandra las reconcilia en background (o síncronamente según el CL).

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 13 -->

INTERNALS
Estrategias de Compaction

Compaction fusiona SSTables, elimina tombstones y actualiza Bloom Filters. La estrategia impacta directamente en latencia y espacio en disco.

STCS — Size-Tiered
Compaction Strategy
✔ Write-heavy · Time-series con TTL
Agrupa SSTables por tamaño similar. Cuando hay N del mismo tier → las fusiona.
✘ Alta amplificación de lectura · espacio temporario 2x

LCS — Leveled
Compaction Strategy
✔ Read-heavy · baja latencia de lectura
SSTables en niveles L0→L1→L2. Garantiza que una row esté en ≤1 SSTable por nivel.
✘ Write amplification alta · no ideal para heavy writes

TWCS — Time-Window
Compaction Strategy
✔ Time-series con TTL · logs con ventana temporal
Ventanas de tiempo configurables. SSTables de la misma ventana se compactan juntos. Al vencer el TTL, elimina SSTables enteros.
✘ Datos sin patrón temporal claro
Configurar en CQL: ALTER TABLE t WITH compaction = {'class':'LeveledCompactionStrategy','sstable_size_in_mb':160};

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 14 -->

INTERNALS
Hinted Handoff & Read Repair

Hinted Handoff
Read Repair
Cuando una réplica está caída al momento
de la escritura, el coordinador almacena
un 'hint' localmente.

Cuando la réplica vuelve:
→ El coordinador le envía las writes
   pendientes (replay).

Config: max_hint_window (default 3h).
Si el nodo estuvo caído más tiempo
→ se necesita nodetool repair.
Durante una lectura con CL>ONE,
Cassandra consulta varias réplicas
y compara los resultados.

Si detecta divergencia (timestamps
distintos) → replica la versión más
reciente a las réplicas desactualizadas.

read_repair_chance: frecuencia de
reparación aleatoria en background.
(0.0–1.0, default 0.0 en Cassandra 4+)

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 15 -->

BLOQUE 3
Tunable Consistency · Casos y Fórmulas

### Notes:

<!-- Slide number: 16 -->

CONSISTENCY
Consistencia Fuerte: La Fórmula

Cassandra garantiza consistencia fuerte cuando la suma de nodos contactados en writes y reads supera el RF.

W  +  R  >  RF
| RF | Write CL | Read CL | W+R>RF? | Resultado |
| --- | --- | --- | --- | --- |
| 3 | ONE (1) | ONE (1) | 2 > 3 ✘ | Eventual — posible stale read |
| 3 | QUORUM (2) | QUORUM (2) | 4 > 3 ✔ | Fuerte — overlap garantizado |
| 3 | ALL (3) | ONE (1) | 4 > 3 ✔ | Fuerte — el último write ya llegó a todos |
| 3 | ONE (1) | ALL (3) | 4 > 3 ✔ | Fuerte — pero write es rápido |
| 3 | QUORUM (2) | ONE (1) | 3 > 3 ✘ | No garantizado — borde peligroso |

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 17 -->

CONSISTENCY
Lightweight Transactions (LWT): Paxos en Cassandra

LWT usa el protocolo Paxos para implementar CAS (Compare-and-Swap) distribuido. Cuatro rounds de mensajes por operación.

1
PREPARE
El coordinador envía Prepare(ballot) a todas las réplicas. Ballot > cualquier anterior.

2
PROMISE
Las réplicas responden con Promise si el ballot es el más alto visto. Retornan el valor comprometido anterior si existe.

3
PROPOSE
El coordinador envía Propose(ballot, value) al quorum. Value puede ser el del step 2 o el nuevo.

4
COMMIT
Si el quorum acepta, el coordinador envía Commit. Las réplicas aplican el valor y notifican al cliente.

⚠  LWT = 4× latencia de una write normal. Usar solo para unicidad estricta o CAS crítico. Evitar en hot paths de escritura.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 18 -->

BLOQUE 4
CQL Avanzado · SAI · Aggregations · UDF/UDA

### Notes:

<!-- Slide number: 19 -->

CQL AVANZADO
Aggregations: Funciones Nativas en CQL

CQL
-- ★ Aggregations solo operan dentro de UNA partición (por diseño)
-- Trabajar entre particiones requiere Spark o procesamiento en app

-- Funciones built-in disponibles en CQL
SELECT
  COUNT(*)           AS total_registros,
  SUM(total)         AS ingresos_totales,
  AVG(total)         AS ticket_promedio,
  MIN(total)         AS pedido_minimo,
  MAX(total)         AS pedido_maximo
FROM orders_by_user
WHERE user_id = 550e8400-e29b-41d4-a716-446655440000;

-- WRITETIME: timestamp de escritura de una columna
SELECT sensor_id, ts, temperature,
       WRITETIME(temperature) AS write_ts
FROM sensor_metrics
WHERE sensor_id = 'S-001' AND bucket = '202401'
LIMIT 10;

-- TOKEN: ver el token de una partition key
SELECT TOKEN(user_id), user_id FROM users LIMIT 5;

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 20 -->

CQL AVANZADO
Secondary Index: Cuándo y Cómo Usarlo

CQL
-- Índice 2i nativo (usar con precaución en producción)
CREATE INDEX IF NOT EXISTS idx_users_email
ON users (email);

-- Ahora se puede consultar por email (sin conocer user_id)
SELECT * FROM users WHERE email = 'ana@example.com';

-- ⚠ Cómo funciona un 2i:
-- Cada nodo mantiene un índice local de los valores que posee.
-- Una query por 2i → broadcast a TODOS los nodos → scatter/gather.
-- En clusters grandes: latencia impredecible y alta carga.

-- ✔ Regla de uso seguro de 2i nativo:
-- Columna con alta cardinalidad AND bajo volumen de datos AND
-- la query siempre incluye la partition key (reduce el scatter).

-- EXAMPLE: índice compuesto con partition key
SELECT * FROM sensor_config
WHERE sensor_id = 'S-001' AND active = true;
-- Si sensor_id es PK → el 2i solo actúa dentro de esa partición ✔

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 21 -->

CQL AVANZADO
SASI Index: Búsqueda en Rango y LIKE

CQL
-- SASI: Storage-Attached Secondary Index (pre-SAI, aún vigente)
-- Soporte para: =, <, >, LIKE, ORDER BY no-PK

-- Crear SASI index con tipo PREFIX para búsqueda LIKE
CREATE CUSTOM INDEX IF NOT EXISTS sasi_products_name
ON products (name)
USING 'org.apache.cassandra.index.sasi.SASIIndex'
WITH OPTIONS = {
  'mode': 'CONTAINS',          -- FULL | PREFIX | CONTAINS
  'analyzed': 'true',
  'analyzer_class': 'org.apache.cassandra.index.sasi.analyzer.NonTokenizingAnalyzer',
  'case_sensitive': 'false'
};

-- Query con LIKE (busca en cualquier posición del string)
SELECT product_id, name, price
FROM products
WHERE name LIKE '%laptop%';

-- Query con rango (numérico)
CREATE CUSTOM INDEX IF NOT EXISTS sasi_price
ON products (price)
USING 'org.apache.cassandra.index.sasi.SASIIndex';

SELECT * FROM products WHERE price > 500 AND price < 2000 ALLOW FILTERING;

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 22 -->

CQL AVANZADO
SAI: Storage Attached Index (Cassandra 4.0+)

CQL
-- SAI: índice recomendado en producción desde Cassandra 4.0
-- Reemplaza a SASI. Menor overhead, soporte para vectores en 5.0.

-- Crear SAI index en columnas simples
CREATE CUSTOM INDEX IF NOT EXISTS sai_users_active
ON users (active) USING 'StorageAttachedIndex';

CREATE CUSTOM INDEX IF NOT EXISTS sai_price
ON products (price) USING 'StorageAttachedIndex';

-- Queries sin ALLOW FILTERING (eficientes con SAI)
SELECT * FROM users WHERE active = true;
SELECT * FROM products WHERE price < 1500;

-- SAI en colecciones MAP
CREATE CUSTOM INDEX ON user_attributes (VALUES(attrs))
USING 'StorageAttachedIndex';

SELECT * FROM user_attributes WHERE attrs CONTAINS 'premium';

-- ★ Cassandra 5.0 agrega soporte vectorial (ANN) via SAI
--   Habilita búsqueda semántica / RAG en la base de datos

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 23 -->

CQL AVANZADO
Materialized Views: Internals y Limitaciones

CQL
-- MV: Cassandra mantiene la sincronización automáticamente
-- Cada write en la tabla base → write en la MV (overhead ~2x)

CREATE TABLE orders (
  user_id    UUID,
  order_id   TIMEUUID,
  status     TEXT,
  total      DECIMAL,
  created_at TIMESTAMP,
  PRIMARY KEY ((user_id), order_id)
);

-- MV para consultar por status (nuevo patrón de acceso)
CREATE MATERIALIZED VIEW orders_by_status AS
  SELECT * FROM orders
  WHERE status IS NOT NULL
    AND user_id IS NOT NULL
    AND order_id IS NOT NULL
  PRIMARY KEY ((status), created_at, user_id, order_id)
  WITH CLUSTERING ORDER BY (created_at DESC);

-- Ahora se puede consultar:
SELECT * FROM orders_by_status
WHERE status = 'PENDING' LIMIT 100;

-- ⚠ Limitaciones de MV:
-- Solo 1 columna nueva en la PK. No puede filtrar filas (solo IS NOT NULL).
-- Las MV están marcadas como 'experimental' en Cassandra 5.x.
-- En producción de alta carga: preferir tablas espejo manuales.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 24 -->

CQL AVANZADO
UDF & UDA: Funciones Definidas por el Usuario

CQL
-- Habilitar UDF (deshabilitado por defecto en cassandra.yaml)
-- enable_user_defined_functions: true

-- UDF: User Defined Function (por fila)
CREATE OR REPLACE FUNCTION celsius_to_fahrenheit(c FLOAT)
  CALLED ON NULL INPUT
  RETURNS FLOAT
  LANGUAGE java
  AS 'return (c * 9.0f / 5.0f) + 32.0f;';

-- Usar la UDF en una query
SELECT sensor_id, ts, temperature,
       celsius_to_fahrenheit(temperature) AS temp_f
FROM sensor_metrics
WHERE sensor_id = 'S-001' AND bucket = '202401'
LIMIT 20;

-- UDA: User Defined Aggregate (sobre múltiples filas de UNA partición)
CREATE OR REPLACE FUNCTION accumulate_avg(state TUPLE<INT,FLOAT>, val FLOAT)
  CALLED ON NULL INPUT
  RETURNS TUPLE<INT,FLOAT>
  LANGUAGE java
  AS 'return tuple(state.getInt(0)+1, state.getFloat(1)+val);';

CREATE OR REPLACE AGGREGATE custom_avg(FLOAT)
  SFUNC accumulate_avg
  STYPE TUPLE<INT,FLOAT>
  INITCOND (0, 0.0f);

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 25 -->

CQL AVANZADO
Soporte JSON en CQL

CQL
-- INSERT como JSON completo
INSERT INTO users JSON '{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "ana_garcia",
  "email": "ana@example.com",
  "active": true,
  "created_at": "2024-01-15 10:30:00.000Z"
}';

-- SELECT como JSON
SELECT JSON user_id, username, email, active
FROM users
WHERE user_id = 550e8400-e29b-41d4-a716-446655440000;

-- Resultado:
-- {"user_id":"550e8400...","username":"ana_garcia","email":"ana@...","active":true}

-- toJson() / fromJson() para campos individuales
SELECT user_id, username, toJson(active) AS active_json
FROM users LIMIT 5;

INSERT INTO users (user_id, active)
VALUES (uuid(), fromJson('true'));

-- ★ Útil para integración con APIs REST o sistemas que trabajan nativamente con JSON

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 26 -->

CQL AVANZADO
BATCH Avanzado: Logged vs Unlogged vs Counter

CQL
-- LOGGED BATCH: atomicidad garantizada (batchlog en coordinador + 1 réplica)
-- Útil para mantener tabelas espejo sincronizadas
BEGIN BATCH
  INSERT INTO users (user_id, username, email)
    VALUES (uuid(), 'pedro', 'pedro@x.com');
  INSERT INTO users_by_email (email, user_id, username)
    VALUES ('pedro@x.com', ?, 'pedro');
APPLY BATCH;

-- UNLOGGED BATCH: sin batchlog → mejor performance
-- NO garantiza atomicidad entre particiones
-- ✔ Útil solo si todas las ops van a la MISMA partición
BEGIN UNLOGGED BATCH
  UPDATE sensor_metrics SET temperature=22.5 WHERE sensor_id='S-001' AND bucket='202401' AND ts=?;
  UPDATE sensor_metrics SET pressure=1013.2 WHERE sensor_id='S-001' AND bucket='202401' AND ts=?;
APPLY BATCH;

-- COUNTER BATCH: obligatorio para tables COUNTER
BEGIN COUNTER BATCH
  UPDATE page_views SET views=views+1 WHERE page_id='/home' AND date='2024-01-15';
  UPDATE page_views SET views=views+1 WHERE page_id='/about' AND date='2024-01-15';
APPLY BATCH;

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 27 -->

CQL AVANZADO
TTL Avanzado y Gestión de Tombstones

CQL
-- TTL en nivel de columna individual
UPDATE products
SET promo_price = 89.99
WHERE product_id = ? AND category = 'electronics'
USING TTL 86400;  -- 24 horas

-- Ver TTL y WRITETIME juntos
SELECT product_id,
       TTL(promo_price)        AS promo_ttl_secs,
       WRITETIME(promo_price)  AS promo_write_ts,
       TTL(price)              AS price_ttl  -- null = sin TTL
FROM products WHERE product_id = ? AND category = 'electronics';

-- Renovar TTL sin cambiar el valor
UPDATE products USING TTL 172800  -- 48 horas
SET promo_price = 89.99           -- misma promo, TTL extendido
WHERE product_id = ? AND category = 'electronics';

-- ★ Tombstones: qué son y por qué importan
-- DELETE genera un tombstone (marca de borrado con timestamp)
-- GC Grace Seconds: ventana de seguridad antes de eliminar tombstones
-- (default: 864000s = 10 días → permite que Hinted Handoff propague)

-- Ver GC grace de una tabla
SELECT gc_grace_seconds FROM system_schema.tables
WHERE keyspace_name='iot_platform' AND table_name='sensor_metrics';

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 28 -->

BLOQUE 5
Spark · Drivers · nodetool · Schema Evolution

### Notes:

<!-- Slide number: 29 -->

INTEGRACIÓN
Cassandra + Apache Spark: Análisis a Escala

Para queries analíticas complejas (GROUP BY libre, JOINs, ML) que CQL no puede expresar → Spark Cassandra Connector.

Cassandra Cluster
Apache Spark
Spark
Connector
Datos operacionales
sensor_metrics, orders...
DataFrame API · SQL · MLlib
Streaming · Graph · Batch

SCALA / PySpark

# PySpark con Spark Cassandra Connector
spark = SparkSession.builder \
  .config("spark.cassandra.connection.host", "10.0.0.1") \
  .getOrCreate()

df = spark.read.format("org.apache.spark.sql.cassandra") \
  .options(table="sensor_metrics", keyspace="iot_platform") \
  .load()

# Ahora podemos hacer aggregations libres sobre TODAS las particiones
df.groupBy("sensor_id").agg(avg("temperature"), max("pressure")).show()

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 30 -->

INTEGRACIÓN
Drivers: Conectar Aplicaciones a Cassandra

El DataStax Driver es el cliente oficial para aplicaciones. Disponible en Java, Python, Go, Node.js, .NET y C++.

Connection Pool
Load Balancing
Policy
Retry Policy
El driver mantiene múltiples conexiones por host. Configurable con pooling_options.
TokenAwarePolicy: enruta la query directamente al nodo que posee la partición → sin salto extra.
Si un nodo falla → reintento automático en la réplica siguiente. Configurable por operación.

Prepared
Statements
Async Execution
Schema Metadata
Pre-parsear la query en el servidor → reduce latencia en queries repetitivas. Cacheable en el driver.
executeAsync() devuelve un Future. Permite pipelining de múltiples queries sin bloquear el hilo.
El driver sincroniza el schema del cluster → tipos, tablas y UDTs disponibles en runtime.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 31 -->

CQL AVANZADO
Driver Python: Ejemplo Completo

Python
from cassandra.cluster import Cluster
from cassandra.policies import TokenAwarePolicy, DCAwareRoundRobinPolicy
from cassandra.auth import PlainTextAuthProvider

# Conexión con token-aware routing (recomendado)
cluster = Cluster(
    contact_points=['10.0.0.1', '10.0.0.2'],
    load_balancing_policy=TokenAwarePolicy(
        DCAwareRoundRobinPolicy(local_dc='dc_east')
    ),
    auth_provider=PlainTextAuthProvider('cassandra', 'secret')
)
session = cluster.connect('iot_platform')

# Prepared statement (pre-parseado en el servidor)
insert_stmt = session.prepare("""
    INSERT INTO sensor_metrics
      (sensor_id, bucket, ts, temperature, humidity)
    VALUES (?, ?, ?, ?, ?)
    USING TTL 7776000
""")

# Batch de inserts asíncronos
futures = []
for reading in sensor_batch:
    bound = insert_stmt.bind([reading.id, reading.bucket,
                              reading.ts, reading.temp, reading.hum])
    futures.append(session.execute_async(bound))

for f in futures:
    f.result()  # Esperar confirmación

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 32 -->

OPERACIONES
nodetool: Administración desde la Línea de Comandos

nodetool es la CLI de administración de Cassandra. Permite monitorear, mantener y diagnosticar el cluster.

nodetool status
Vista general del cluster: UP/DOWN, carga, tokens, datacenter y rack de cada nodo.

nodetool info
Detalles del nodo local: versión, heap, cache stats, uptime.

nodetool cfstats
  <ks>.<table>
Estadísticas por tabla: read/write latency, tombstone warnings, partition size, bloom filter FP rate.

nodetool repair
  <keyspace>
Reconcilia réplicas divergentes. Obligatorio después de DNOD prolongado o antes de decommission.

nodetool compact
  <ks> <table>
Fuerza compaction manual. Útil para limpiar tombstones urgentemente.

nodetool tpstats
Thread pool stats: dropped messages, pending tasks. Indicador clave de saturación.

nodetool getcompactionstats
Ver el progreso de compaction en curso: bytes procesados, tablas en cola.

nodetool decommission
Retira el nodo local del ring. Migra sus datos a los vecinos. Proceso graceful.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 33 -->

CQL AVANZADO
Schema Evolution: Cambios Sin Downtime

CQL
-- Cassandra permite ALTER TABLE sin detener el cluster

-- Agregar columna (siempre seguro)
ALTER TABLE users ADD phone_number TEXT;
ALTER TABLE orders ADD shipping_address FROZEN<address>;

-- Renombrar columna de clustering (solo si no hay datos)
-- ALTER TABLE t RENAME old_col TO new_col;

-- Cambiar tipo de dato (reglas estrictas)
-- Solo se permite si el nuevo tipo es compatible en binario:
-- INT → BIGINT ✔  |  TEXT → VARCHAR ✔  |  BIGINT → INT ✘
ALTER TABLE metrics ALTER value TYPE DOUBLE;  -- de FLOAT a DOUBLE ✔

-- Eliminar columna (marca como dropped — espacio liberado en compaction)
ALTER TABLE users DROP legacy_field;

-- Cambiar opciones de tabla
ALTER TABLE sensor_metrics
  WITH gc_grace_seconds = 432000  -- 5 días (reducir si writes son solo nuevos)
  AND compaction = {
    'class': 'TimeWindowCompactionStrategy',
    'compaction_window_unit': 'HOURS',
    'compaction_window_size': 24
  };

-- ★ TRUNCATE: borra todos los datos, mantiene el schema
TRUNCATE TABLE test_data;

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 34 -->

OPERACIONES
Monitoreo: Métricas Clave en Producción

Cassandra expone métricas vía JMX, nodetool y (con agente) Prometheus. Estas son las métricas que importan.

Latencia
Compaction
Tombstones
·  p99 read latency < 10ms (local)
·  pending compaction tasks > 32 → alarma
·  tombstone warnings en cfstats
·  p99 write latency < 5ms
·  compaction bytes/sec (throttle si necesario)
·  tombstone_failure_threshold (default 100k)
·  coordinator read latency (cross-node)
·  sstable count por tabla (> 20 → problema)
·  gc_grace_seconds configurado correctamente

Memoria
Red
Disponibilidad
·  Heap usage < 32GB (fuera del rango G1 óptimo)
·  dropped mutations → pérdida de datos potencial
·  nodetool status → todos los nodos UP Normal
·  off-heap: row cache + key cache + bloom filters
·  tpstats: MutationStage pending > 0 → saturación
·  repair coverage: 100% dentro de gc_grace_seconds
·  GC pauses: stop-the-world > 200ms → alarma
·  internode_messaging_timeout configurado
·  bootstrap/decommission en progreso

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 35 -->

BLOQUE 6
Ejercicio Integrador Avanzado · Cierre

### Notes:

<!-- Slide number: 36 -->

EJERCICIO
Ejercicio Avanzado: Plataforma IoT — Fase 2

Continuamos el sistema de monitoreo de 10.000 sensores. Ahora incorporamos indexación avanzada, vistas, y operaciones de mantenimiento.

7

SAI Index
Crear un SAI index en sensor_config.active y otro en sensor_config.model. Probar queries sin ALLOW FILTERING.

8

UDF
Definir una UDF celsius_to_fahrenheit(FLOAT) en Java. Usarla en un SELECT sobre sensor_metrics del sensor 'S-001'.

9

TWCS
Alterar la tabla sensor_metrics para usar TimeWindowCompactionStrategy con ventana de 24 horas.

10

MV avanzada
Crear una MV alerts_by_temp que filtre (IS NOT NULL) y ordene por temperatura DESC sobre sensor_metrics.

11

nodetool
Ejecutar: nodetool status, nodetool cfstats iot_platform.sensor_metrics, nodetool info. Interpretar los resultados.

12

Schema evol.
Agregar columna co2_level FLOAT a sensor_metrics. Verificar que los datos existentes no se afectan.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 37 -->

CQL AVANZADO
Solución: Tareas 7, 8 y 9

CQL
-- Tarea 7: SAI Index
CREATE CUSTOM INDEX sai_active
ON sensor_config (active) USING 'StorageAttachedIndex';

CREATE CUSTOM INDEX sai_model
ON sensor_config (model) USING 'StorageAttachedIndex';

SELECT * FROM sensor_config WHERE active = true;   -- sin ALLOW FILTERING ✔
SELECT * FROM sensor_config WHERE model = 'TempPro v2';  -- ✔

-- Tarea 8: UDF celsius → fahrenheit
CREATE OR REPLACE FUNCTION celsius_to_fahrenheit(c FLOAT)
  CALLED ON NULL INPUT RETURNS FLOAT LANGUAGE java
  AS 'return (c * 9.0f / 5.0f) + 32.0f;';

SELECT sensor_id, ts, temperature,
       celsius_to_fahrenheit(temperature) AS temp_f
FROM sensor_metrics
WHERE sensor_id = 'S-001' AND bucket = '202401' LIMIT 20;

-- Tarea 9: TWCS
ALTER TABLE sensor_metrics
  WITH compaction = {
    'class': 'TimeWindowCompactionStrategy',
    'compaction_window_unit': 'HOURS',
    'compaction_window_size': 24
  };

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 38 -->

CQL AVANZADO
Solución: Tareas 10, 11 y 12

CQL
-- Tarea 10: Materialized View con temperatura
CREATE MATERIALIZED VIEW alerts_by_temp AS
  SELECT * FROM sensor_metrics
  WHERE sensor_id IS NOT NULL
    AND bucket IS NOT NULL
    AND ts IS NOT NULL
    AND temperature IS NOT NULL
  PRIMARY KEY ((bucket), temperature, sensor_id, ts)
  WITH CLUSTERING ORDER BY (temperature DESC, sensor_id ASC, ts DESC);

SELECT * FROM alerts_by_temp
WHERE bucket = '202401' LIMIT 50;

-- Tarea 11: nodetool (ejecutar en terminal del nodo)
-- $ nodetool status
-- $ nodetool cfstats iot_platform.sensor_metrics
-- $ nodetool info

-- Tarea 12: Schema evolution sin downtime
ALTER TABLE sensor_metrics ADD co2_level FLOAT;

-- Verificar que los datos existentes no se afectan
SELECT sensor_id, ts, temperature, co2_level
FROM sensor_metrics
WHERE sensor_id = 'S-001' AND bucket = '202401' LIMIT 5;
-- co2_level aparece como null en filas anteriores (sin afectar datos)

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 39 -->

ERRORES
Anti-Patterns Avanzados: Los Errores que Cuestan Caro

Hot Partition
Causa: Partition key con baja cardinalidad o un usuario con millones de registros.
CRÍTICO
⚠ Un nodo al 90% de CPU mientras los demás están ociosos.
✔ Fix: Composite PK con salt o bucket. Ejemplo: (sensor_id, YYYYMM).

Tombstone Overload
Causa: DELETE masivos o UPDATE en columnas con TTL muy frecuentes.
CRÍTICO
⚠ Reads lentos, warnings 'Read N live rows and M tombstone cells'.
✔ Fix: Usar TTL en lugar de DELETE. Ajustar gc_grace_seconds. Forzar compaction.

Unbounded Partition
Causa: Time-series sin bucket. Todos los datos de un sensor en una partición.
SERIO
⚠ Partition size > 1GB. nodetool: large partition warnings.
✔ Fix: Bucket pattern: (sensor_id, YYYYMM). Meta-dato de partición controlado.

Missing Prepared Statements
Causa: Concatenar strings para queries en lugar de usar prepared statements.
SERIO
⚠ CPU alta en parsing, latencia variable en queries idénticas.
✔ Fix: session.prepare() una vez por query pattern. Reusar el PreparedStatement.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 40 -->

DECISIÓN
Cassandra en el Ecosistema NoSQL: ¿Cuándo Elegirla?

La decisión correcta depende del patrón de acceso, no de la popularidad de la tecnología.
| Criterio | Cassandra | MongoDB | Redis | Neo4j |
| --- | --- | --- | --- | --- |
| Escala horizontal | ★★★★★ | ★★★★ | ★★★★ | ★★ |
| Write throughput | ★★★★★ | ★★★ | ★★★★★ | ★ |
| Query flexibility | ★★ | ★★★★ | ★★ | ★★★★★ |
| Consistencia | Tunable | Fuerte | Eventual | Fuerte/Graph |
| Modelo de datos | Tabular | Documental | K/V | Grafos |
| Caso ideal | IoT · logs · series | CMS · catálogos | Caché · sesiones | Redes · recom. |
Persistencia polilgota: en sistemas complejos, combinar Cassandra (writes masivos) + Redis (caché) + Elasticsearch (búsqueda full-text) es arquitectura habitual.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 41 -->

ARQUITECTURA
Persistencia Políglota: Cassandra en el Stack

Cassandra raramente es la única base de datos en sistemas de escala. Se combina con otras tecnologías para cubrir casos que CQL no puede resolver.

Capa de Aplicación  (microservicios / API Gateway)

Cassandra
Redis
PostgreSQL
Elasticsearch
Escrituras masivas
Time-series · Historial
Audit logs
Caché de sesiones
Leaderboards
Pub/Sub · Rate limit
Transacciones ACID
Reporting · BI
Datos relacionales
Búsqueda full-text
Analytics en tiempo real
Dashboards / Kibana
★  Clase 13 (Persistencia Polimórfica) profundizará en cómo gestionar múltiples motores desde una sola capa de persistencia.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 42 -->

CASOS DE USO
Cassandra en Producción: Casos Reales

Netflix
Apple
Instagram
Almacena el historial de visualizaciones de 200M+ usuarios. 30M+ escrituras/segundo.
Backend de iCloud: Mensajes, Contactos, Notas. Cada registro de usuario = una partición.
Timeline de feeds. Cassandra como storage principal para posts e interacciones.
Petabytes · 5000+ nodos
300M+ usuarios activos
1B+ usuarios

Uber
Discord
Goldman Sachs
Seguimiento en tiempo real de viajes. Posición de conductores cada 4 segundos.
Historial de mensajes de chat. Migró de MongoDB a Cassandra a los 100M de mensajes/día.
Registro de transacciones financieras. Consistencia configurable para writes críticos.
Millones de requests/min
Billones de mensajes
Compliance + speed

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes:

<!-- Slide number: 43 -->

BIBLIOGRAFÍA
Bibliografía y Recursos

LIBRO
Bradberry, R. & Lubow, E. (2013). Practical Cassandra. Addison-Wesley. [Cap. 5–8: Internals, Ops, Performance]

LIBRO
Harrison, G. (2015). Next Generation Databases. Apress. [Cap. 6–7: Wide Column & Distributed Architecture]

LIBRO
Pivert, O. (2018). NoSQL Data Models. ISTE. [Cap. 4: Tabular Models — Replication & Consistency]

PAPER
Lakshman, A. & Malik, P. (2010). Cassandra: A Decentralized Structured Storage System. ACM SIGOPS.

PAPER
DeCandia, G. et al. (2007). Dynamo: Amazon's Highly Available Key-Value Store. SOSP '07.

DOC
Apache Cassandra Docs. Architecture: https://cassandra.apache.org/doc/latest/cassandra/architecture/

DOC
DataStax Driver Docs: https://docs.datastax.com/en/driver-matrix/doc/index.html

DOC
SAI Reference: https://cassandra.apache.org/doc/latest/cassandra/developing/cql/indexing/sai/

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 8

### Notes: