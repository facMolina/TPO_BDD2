<!-- Slide number: 1 -->

CLASE 7
Bases de Datos
Tabulares & CQL

Unidad II  ·  Modelos NoSQL  ·  Modelo Tabular
Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE  ·  2025

### Notes:

<!-- Slide number: 2 -->

AGENDA
Agenda de la clase

BLOQUE 1
Qué son las bases de datos tabulares · Origen y motivación

BLOQUE 2
Modelo tabular: partición, clustering, familias de columnas

BLOQUE 3
Diseño orientado a consultas · Estrategias de modelado

BLOQUE 4
Cassandra como implementación · Arquitectura básica

BLOQUE 5
CQL Práctica: DDL, DML, tipos de datos, particionado

BLOQUE 6
Ejercicio integrador + errores frecuentes

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 3 -->

BLOQUE 1
Fundamentos de Bases de Datos Tabulares

### Notes:

<!-- Slide number: 4 -->

FUNDAMENTOS
¿Qué es el Modelo Tabular?

Un almacenamiento orientado a columnas dinámicas, distribuido y diseñado para escala horizontal.

FILAS & COLUMNAS
DINÁMICAS
CLAVE COMPUESTA
Cada fila puede tener un conjunto distinto de columnas. No hay NULL implícito.
PartitionKey + ClusteringKey definen unívocamente cada fila y su distribución.

ESCALA HORIZONTAL
DISEÑO QUERY-FIRST
Los datos se distribuyen entre nodos por hash de la partition key.
El schema se modela según las consultas, no según la normalización.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 5 -->

FUNDAMENTOS
Origen: Google BigTable (2006)

El paper de Chang et al. (2006) definió el modelo que inspiró HBase, Cassandra y DynamoDB.

2006
Google publica BigTable. Modelo de sparse tables sobre GFS.

2008
Facebook libera Cassandra como open source. Fusiona ideas de BigTable y DynamoDB.

2010
Apache acepta Cassandra como proyecto de alto nivel.

2012
HBase + Hadoop se consolidan como la alternativa open-source al ecosistema Google.

2024
Cassandra 5.0 introduce almacenamiento vectorial y mejoras en CQL.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 6 -->

FUNDAMENTOS
Relacional vs Tabular — Comparación Clave

| Dimensión | Relacional (RDBMS) | Tabular (Wide Column) |
| --- | --- | --- |
| Schema | Estricto, predefinido | Flexible, por fila |
| Índice | B-Tree, muchos índices secundarios | Principalmente por PK + clustering |
| JOINs | Nativo y eficiente | No soportado — desnormalización |
| Escalado | Vertical (scale-up) | Horizontal (scale-out) |
| Consistencia | ACID plena | Eventual / configurable |
| Casos ideales | Transaccional, reporting ad hoc | Time-series, IoT, alta escritura |

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 7 -->

FUNDAMENTOS
Anatomía de una Wide Column Store

KEYSPACE  ≈  Base de datos

TABLE  (Column Family)

ROW KEY
user:001

name=Ana
email=ana@x.com
score=92

ROW KEY
user:002

name=Bob
city=BsAs

ROW KEY
user:003

name=Carlos
age=28
plan=pro
joined=2024
★  Cada fila puede tener columnas distintas  ·  sin NULLs implícitos

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 8 -->

FUNDAMENTOS
Bases Tabulares y el Teorema CAP

Cassandra es un AP system. Prioriza Disponibilidad + Tolerancia a particiones, sacrificando consistencia inmediata.

C

AP system

Disponibilidad + Tolerancia a particiones
Consistency

Eventual consistency
Las réplicas convergen, no son síncronas

Tunable consistency
Se puede ajustar por operación (ONE, QUORUM, ALL)

A

P

Cassandra
(AP)
Availability
Partition
Tolerance

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 9 -->

BLOQUE 2
Modelo Tabular en Detalle

### Notes:

<!-- Slide number: 10 -->

MODELO TABULAR
Partition Key: El Corazón del Modelo Tabular

La partition key determina en qué nodo vive la fila. Es la decisión de diseño más crítica.

PK: "user:001"
hash(PK) = 7A3F
Nodo 3 del Ring

✔
Alta cardinalidad
Muchos valores distintos → distribución uniforme

✔
Acceso por igualdad
WHERE partition_key = 'X' — siempre eficiente

✘
Baja cardinalidad
Pocos valores → hot partitions, cuellos de botella

✘
Partición gigante
Millones de filas en una sola partición → problema grave

⚠
Composite PK
Combinar campos para mayor distribución cuando sea necesario

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 11 -->

MODELO TABULAR
Clustering Key: Orden dentro de la Partición

La clustering key ordena las filas dentro de cada partición. Habilita rangos, paginación y orden eficiente.
| sensor\_id (PK) | timestamp (CK) | temperatura | unidad |
| --- | --- | --- | --- |
| S001 | 2024-01-01 08:00 | 22.5 | °C |
| S001 | 2024-01-01 08:05 | 22.8 | °C |
| S001 | 2024-01-01 08:10 | 23.1 | °C |
| S002 | 2024-01-01 08:00 | 19.0 | °C |
| S002 | 2024-01-01 08:05 | 18.7 | °C |
★  sensor_id es la Partition Key — todos los datos de un sensor van al mismo nodo.
★  timestamp es la Clustering Key — los datos se almacenan ordenados por tiempo (ASC/DESC).

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 12 -->

MODELO TABULAR
Primary Key Compuesta: Sintaxis y Semántica

PRIMARY KEY ( (partition_key1, partition_key2), clustering_key1, clustering_key2 )
                 └─── Composite Partition Key ───┘  └──── Ordered within partition ────┘

PK simple

Una sola partition key, sin clustering.
PRIMARY KEY (user_id)

PK compuesta

user_id particiona, created_at ordena.
PRIMARY KEY (user_id, created_at)

PK compuesta
de partición

Hash sobre (country, year) → + distribución.
PRIMARY KEY ((country, year), event_id)

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 13 -->

MODELO TABULAR
Familias de Columnas

Una column family agrupa columnas relacionadas bajo un identificador común. En CQL cada tabla es una column family.

user_profile

user_id
name
email
created_at

user_metrics

user_id
login_count
last_seen
score

user_addresses

user_id
address_type
street
city
country

En BigTable original: múltiples CFs en una tabla. En Cassandra: 1 tabla = 1 CF lógica.
Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 14 -->

BLOQUE 3
Diseño Orientado a Consultas

### Notes:

<!-- Slide number: 15 -->

MODELADO
Query-First Design: El Principio Fundamental

❌ Enfoque Relacional
✔ Enfoque Query-First
1. Diseñar el schema (3NF)
2. Definir tablas y relaciones
3. Generar las consultas

Resultado: Schema normalizado, JOINs en runtime, índices secundarios proliferan.
1. Definir las queries de negocio
2. Identificar patrones de acceso
3. Diseñar tablas para esas queries

Resultado: Una tabla por query frecuente. Datos desnormalizados. Sin JOINs en runtime.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 16 -->

MODELADO
Patrones de Modelado Tabular

One table
per query
Tabla espejo
(duplication)
Lookup table
Una tabla por cada consulta frecuente. Desnormalizar según acceso.
Mismos datos en múltiples tablas con diferentes PKs. Storage barato, lecturas baratas.
Tabla auxiliar para invertir el acceso. Ej: buscar por email en lugar de por user_id.

Bucket pattern
Time-series
Materialized
View
Agrupar documentos temporales en 'baldes' para evitar particiones gigantes. Ej: logs por hora.
sensor_id como PK, timestamp como CK con TTL. Ventana deslizante de datos.
Vista pre-calculada con PK diferente. Cassandra la mantiene sincronizada automáticamente.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 17 -->

MODELADO
Desnormalización: Trade-offs Conscientes

En bases tabulares, la duplicación de datos es una estrategia deliberada, no un error de diseño.

BENEFICIOS
COSTOS
✔  Lecturas en O(1) — sin JOINs
⚠  Mayor uso de storage
✔  Predecibilidad de latencia
⚠  Escrituras múltiples al actualizar
✔  Escala horizontal sin coordinación
⚠  Riesgo de inconsistencia entre tablas
✔  Sin locks distribuidos en reads
⚠  Complejidad en la capa de aplicación

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 18 -->

MODELADO
Caso Práctico: Diseño para una Red Social

Query requerida: 'Obtener los últimos 20 posts de un usuario, ordenados por fecha desc'

❌ Diseño relacional
✔ Diseño query-first
users(id, name, email, ...)
posts(id, user_id FK, content,
      created_at, likes_count)

SELECT * FROM posts
  WHERE user_id = ?
  ORDER BY created_at DESC
  LIMIT 20

-- Requiere índice en user_id + sort
-- Escaneo de índice en nodos remotos
posts_by_user (
  user_id   TEXT,
  created_at TIMESTAMP,
  post_id   UUID,
  content   TEXT,
  PRIMARY KEY (
    (user_id), created_at
  )
) WITH CLUSTERING ORDER BY
  (created_at DESC);

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 19 -->

BLOQUE 4
Cassandra — Arquitectura y Conceptos Clave

### Notes:

<!-- Slide number: 20 -->

CASSANDRA
Arquitectura Peer-to-Peer: Sin Master

A diferencia de HBase o MongoDB, Cassandra no tiene nodo master. Todos los nodos son iguales — el riesgo de SPOF desaparece.

N1

Gossip Protocol
Los nodos intercambian estado entre sí c/1s. No hay registro central.

N6

N2

Token Ring
Cada nodo posee un rango del ring. La PK se hashea a un token.

Replication Factor
RF=3 → cada dato se replica en 3 nodos consecutivos del ring.

N5

N3

Coordinator
Cualquier nodo puede ser coordinador para una request del cliente.

N4

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 21 -->

CASSANDRA
Consistencia Tunable en Cassandra

Cassandra permite ajustar el nivel de consistencia por operación. RF y CL interactúan para determinar el comportamiento real.

ONE
Responde al primer nodo. Máxima velocidad, menor consistencia.
Logs, métricas no críticas

QUORUM
Mayoría de réplicas (RF/2 +1). Balance velocidad/consistencia.
Aplicaciones web típicas

LOCAL_QUORUM
Quorum solo en el datacenter local. Multi-DC sin latencia cross.
Multi-region apps

ALL
Todas las réplicas deben confirmar. Máx consistencia, menor disponibilidad.
Datos financieros críticos

ANY
Incluso un hint basta. Ultra-disponible, sin garantía de lectura.
Write-only (logs masivos)
Fuerte consistencia lograda cuando: Writes(CL) + Reads(CL) > RF

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 22 -->

CASSANDRA
SSTable y LSM-Tree: Motor de Almacenamiento

Cassandra usa un Log-Structured Merge Tree (LSM) en lugar de B-Tree. Optimizado para altas tasas de escritura.

Write
Request
MemTable
(RAM)
CommitLog
(disk)
SSTable
(disk)
Compaction
(merge)

1. Write al CommitLog (WAL) + MemTable en RAM
2. MemTable flush a disco como SSTable (inmutable) cuando alcanza threshold
3. Compaction: múltiples SSTables se fusionan → menor fragmentación, tombstones eliminados
4. Reads: buscan en MemTable → Bloom Filter → SSTable(s). Bloom Filter evita lecturas innecesarias a disco.
★ Las escrituras son siempre append-only → latencia de write muy baja y predecible

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 23 -->

BLOQUE 5
CQL — Cassandra Query Language

### Notes:

<!-- Slide number: 24 -->

CQL PRÁCTICA
CQL: Cassandra Query Language

CQL es la interfaz estándar para Cassandra desde la v1.2. Sintaxis familiar a SQL, con restricciones derivadas del modelo distribuido.
| CQL | SQL | Dimensión |
| --- | --- | --- |
| Keyspace | Database / Schema | Contenedor lógico |
| Table (Column Family) | Table | Estructura de datos |
| Partition Key | Primary Key (simétrico) | Distribución |
| Clustering Key | ORDER BY persistente | Orden interno |
| NO JOINs | JOINs completos | Relaciones |
| WHERE limitado | WHERE libre con índices | Filtrado |
| TTL nativo | Manual / triggers | Expiración de datos |

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 25 -->

CQL PRÁCTICA
DDL: Creación de Keyspace

CQL
-- Crear keyspace con estrategia de replicación simple (dev/test)
CREATE KEYSPACE IF NOT EXISTS ecommerce
  WITH replication = {
    'class': 'SimpleStrategy',
    'replication_factor': 3
  };

-- Keyspace para producción multi-datacenter
CREATE KEYSPACE IF NOT EXISTS ecommerce_prod
  WITH replication = {
    'class': 'NetworkTopologyStrategy',
    'dc_east': 3,
    'dc_west': 2
  }
  AND durable_writes = true;

-- Usar el keyspace
USE ecommerce;

-- Ver keyspaces disponibles
DESCRIBE KEYSPACES;

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 26 -->

CQL PRÁCTICA
DDL: CREATE TABLE — Estructura Básica

CQL
-- Tabla simple con PK compuesta
CREATE TABLE IF NOT EXISTS users (
  user_id    UUID        PRIMARY KEY,
  username   TEXT,
  email      TEXT,
  created_at TIMESTAMP,
  active     BOOLEAN
);

-- Tabla con partition key + clustering key
CREATE TABLE IF NOT EXISTS orders_by_user (
  user_id    UUID,
  order_id   TIMEUUID,
  total      DECIMAL,
  status     TEXT,
  items      LIST<TEXT>,
  PRIMARY KEY ((user_id), order_id)
) WITH CLUSTERING ORDER BY (order_id DESC);

-- Ver estructura de la tabla
DESCRIBE TABLE orders_by_user;

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 27 -->

CQL PRÁCTICA
CQL: Tipos de Datos Nativos

Numéricos
Texto & IDs
Tiempo
INT
BIGINT
FLOAT
DOUBLE
DECIMAL
VARINT
COUNTER
TEXT / VARCHAR
ASCII
UUID
TIMEUUID
BLOB
TIMESTAMP
DATE
TIME
DURATION

Booleano
Colecciones
Especiales
BOOLEAN
LIST<T>
SET<T>
MAP<K,V>
TUPLE<T1,T2>
FROZEN<T>
USER TYPE
VECTOR<T,n>*

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7
* VECTOR<T,n> introducido en Cassandra 5.0 para búsqueda semántica / ANN.

### Notes:

<!-- Slide number: 28 -->

CQL PRÁCTICA
DML: INSERT — Inserción de Datos

CQL
USE ecommerce;

-- INSERT básico
INSERT INTO users (user_id, username, email, created_at, active)
VALUES (uuid(), 'ana_garcia', 'ana@example.com', toTimestamp(now()), true);

-- INSERT con TTL (expira en 7 días)
INSERT INTO session_tokens (user_id, token, created_at)
VALUES (uuid(), 'abc123xyz', toTimestamp(now()))
USING TTL 604800;

-- INSERT condicional (LWT - Light Weight Transaction)
-- ⚠ Usa Paxos → costo de latencia significativo
INSERT INTO users (user_id, email)
VALUES (uuid(), 'nuevo@mail.com')
IF NOT EXISTS;

-- Ver el TTL de una columna
SELECT TTL(token) FROM session_tokens WHERE user_id = ...;

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 29 -->

CQL PRÁCTICA
DML: SELECT — Consultas

CQL
-- SELECT básico por partition key (siempre eficiente)
SELECT * FROM orders_by_user
WHERE user_id = 550e8400-e29b-41d4-a716-446655440000;

-- SELECT con clustering key (rango — muy eficiente)
SELECT * FROM orders_by_user
WHERE user_id = 550e8400-e29b-41d4-a716-446655440000
  AND order_id >= minTimeuuid('2024-01-01 00:00:00')
  AND order_id <= maxTimeuuid('2024-12-31 23:59:59');

-- LIMIT (pagination)
SELECT * FROM orders_by_user
WHERE user_id = ?
LIMIT 20;

-- Aggregation (limitada, solo sobre una partición)
SELECT COUNT(*), AVG(total) FROM orders_by_user
WHERE user_id = 550e8400-e29b-41d4-a716-446655440000;

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 30 -->

CQL PRÁCTICA
DML: UPDATE & DELETE

CQL
-- UPDATE básico
UPDATE users
SET email = 'nuevo@email.com', active = false
WHERE user_id = 550e8400-e29b-41d4-a716-446655440000;

-- UPDATE condicional (LWT)
UPDATE users
SET email = 'nuevo@email.com'
WHERE user_id = 550e8400-e29b-41d4-a716-446655440000
IF active = true;

-- UPDATE con TTL en columna específica
UPDATE products USING TTL 86400
SET promo_price = 99.99
WHERE product_id = ? AND category = 'electronics';

-- DELETE fila completa
DELETE FROM users WHERE user_id = ?;

-- DELETE columna específica
DELETE email FROM users WHERE user_id = ?;

-- ⚠ DELETE no libera espacio inmediatamente → crea un tombstone

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 31 -->

CQL PRÁCTICA
Colecciones: LIST, SET y MAP

CQL
-- Tabla con colecciones
CREATE TABLE product_catalog (
  product_id UUID PRIMARY KEY,
  name       TEXT,
  tags       SET<TEXT>,
  images     LIST<TEXT>,
  metadata   MAP<TEXT, TEXT>
);

-- Insertar con colecciones
INSERT INTO product_catalog (product_id, name, tags, images, metadata)
VALUES (
  uuid(), 'Laptop Pro',
  {'tech', 'laptop', 'nuevo'},
  ['img1.jpg', 'img2.jpg'],
  {'color': 'negro', 'marca': 'Dell', 'garantia': '2 años'}
);

-- Actualizar colecciones
UPDATE product_catalog
SET tags = tags + {'oferta'},
    images = images + ['img3.jpg'],
    metadata['stock'] = '45'
WHERE product_id = ?;

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 32 -->

CQL PRÁCTICA
Índices Secundarios y ALLOW FILTERING

CQL
-- Índice secundario (usar con precaución)
CREATE INDEX IF NOT EXISTS idx_users_email
ON users (email);

-- Consulta usando el índice
SELECT * FROM users WHERE email = 'ana@example.com';

-- ALLOW FILTERING: fuerza escaneo de tabla completa
-- ⚠ Usar solo en datasets pequeños o desarrollo
SELECT * FROM users
WHERE active = true
ALLOW FILTERING;

-- ✔ Alternativa correcta: tabla dedicada para esa query
CREATE TABLE users_by_email (
  email   TEXT PRIMARY KEY,
  user_id UUID,
  username TEXT
);
-- Mantener sincronizada desde la app al escribir en 'users'

-- Materialized View (Cassandra mantiene la sync automáticamente)
CREATE MATERIALIZED VIEW users_by_email_mv AS
  SELECT * FROM users
  WHERE email IS NOT NULL AND user_id IS NOT NULL
  PRIMARY KEY (email, user_id);

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 33 -->

CQL PRÁCTICA
BATCH Statements y Lightweight Transactions

CQL
-- BATCH: atomicidad en una partición (o entre tablas con cuidado)
BEGIN BATCH
  INSERT INTO users (user_id, username, email)
  VALUES (uuid(), 'carlos', 'carlos@x.com');

  INSERT INTO users_by_email (email, user_id)
  VALUES ('carlos@x.com', ?);
APPLY BATCH;

-- LOGGED BATCH (default): garantiza que todas las ops se ejecuten
-- UNLOGGED BATCH: mejor performance, sin garantía de atomicidad total

-- LWT (Paxos): IF clause
-- ✔ Para unicidad o CAS (Compare-and-Swap)
UPDATE inventory
SET stock = stock - 1
WHERE product_id = ? AND warehouse_id = ?
IF stock > 0;

-- ⚠ LWT tiene ~4x la latencia de una write normal
-- Usar solo cuando la consistencia sea estrictamente necesaria

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 34 -->

CQL PRÁCTICA
TTL — Time To Live: Expiración Nativa

CQL
-- TTL a nivel de tabla (default para todas las filas)
CREATE TABLE web_sessions (
  session_id TEXT PRIMARY KEY,
  user_id    UUID,
  data       TEXT
) WITH default_time_to_live = 1800;  -- 30 minutos

-- TTL a nivel de inserción (override)
INSERT INTO web_sessions (session_id, user_id, data)
VALUES ('sess_abc123', ?, '{"cart": [...]}')
USING TTL 3600;  -- 1 hora

-- Consultar TTL restante
SELECT session_id, TTL(data) as ttl_restante
FROM web_sessions
WHERE session_id = 'sess_abc123';

-- Remover TTL de una columna (TTL = 0)
UPDATE web_sessions USING TTL 0
SET data = 'datos permanentes'
WHERE session_id = 'sess_abc123';

-- ★ TTL expirado crea un tombstone → compaction lo elimina definitivamente

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 35 -->

CQL PRÁCTICA
Tablas COUNTER: Contadores Distribuidos

CQL
-- ⚠ Las tablas COUNTER son un tipo especial en Cassandra
-- Solo pueden contener: PK + columnas COUNTER

CREATE TABLE page_views (
  page_id    TEXT,
  date       DATE,
  views      COUNTER,
  unique_visitors COUNTER,
  PRIMARY KEY ((page_id), date)
);

-- Incrementar contadores (no se usa INSERT)
UPDATE page_views
SET views = views + 1,
    unique_visitors = unique_visitors + 1
WHERE page_id = '/home' AND date = '2024-01-15';

-- Decrementar
UPDATE page_views
SET views = views - 5
WHERE page_id = '/home' AND date = '2024-01-15';

-- Leer contadores
SELECT page_id, date, views FROM page_views
WHERE page_id = '/home'
ORDER BY date DESC LIMIT 30;

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 36 -->

CQL PRÁCTICA
UDT — User Defined Types

CQL
-- Definir un tipo personalizado
CREATE TYPE IF NOT EXISTS address (
  street     TEXT,
  city       TEXT,
  country    TEXT,
  postal_code TEXT
);

-- Usar UDT en una tabla
CREATE TABLE customers (
  customer_id UUID PRIMARY KEY,
  name        TEXT,
  home_address address,
  work_address address
);

-- Insertar con UDT
INSERT INTO customers (customer_id, name, home_address)
VALUES (
  uuid(),
  'María López',
  { street: 'Av. Corrientes 1234',
    city: 'Buenos Aires',
    country: 'Argentina',
    postal_code: 'C1043' }
);

-- Acceder a campos del UDT
SELECT name, home_address.city FROM customers
WHERE customer_id = ?;

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 37 -->

CQL PRÁCTICA
Buenas Prácticas de Particionado

Una partición mal diseñada puede destruir el rendimiento incluso con hardware excelente.

✔ Tamaño objetivo
✔ Alta cardinalidad
100MB – 1GB por partición. nodetool cfstats para medir.
Evitar country, status, boolean como única partition key.

✔ Bucket pattern
✔ Evitar ALLOW FILTERING
Para time-series: PK = (sensor_id, bucket_month). Controla el tamaño.
En producción es un full-scan. Siempre crear la tabla correcta.

✘ Hot partition
✘ Tombstones excesivos
Un usuario con millones de órdenes rompe la distribución del ring.
Muchos DELETE sin compaction degradan las reads. Monitorear.

⚠ LWT con moderación
⚠ Batch cross-partition
IF EXISTS / IF NOT EXISTS usa Paxos → 4x latencia.
BATCH entre particiones distintas no es atómico realmente.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 38 -->

BLOQUE 6
Ejercicio Integrador · Errores Frecuentes · Cierre

### Notes:

<!-- Slide number: 39 -->

EJERCICIO
Ejercicio Integrador: Sistema IoT de Monitoreo

Contexto de negocio: una empresa gestiona 10.000 sensores industriales que envían métricas cada 30 segundos.

1

Keyspace
Crear el keyspace iot_platform con RF=3 y NetworkTopologyStrategy (DC: dc_main, RF=3).

2

UDT
Definir un UDT sensor_location con: building (TEXT), floor (INT), zone (TEXT).

3

Tabla config
Crear sensor_config: sensor_id (PK), model, location (UDT), active. Datos de 3 sensores.

4

Time-series
Crear sensor_metrics: PK((sensor_id, bucket), timestamp DESC), temperature, pressure, humidity. Bucket = YYYYMM.

5

Queries
a) Los últimos 100 registros del sensor 'S-001' en enero 2024.
b) Sensores activos (ALLOW FILTERING en dev).

6

Vista
Materialized View sensor_metrics_by_bucket para consultar todas las métricas de un bucket mensual dado.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 40 -->

CQL PRÁCTICA
Ejercicio: Solución (Pasos 1-4)

CQL
CREATE KEYSPACE IF NOT EXISTS iot_platform
  WITH replication = {'class':'NetworkTopologyStrategy','dc_main':3}
  AND durable_writes = true;
USE iot_platform;

CREATE TYPE IF NOT EXISTS sensor_location (
  building TEXT, floor INT, zone TEXT
);

CREATE TABLE IF NOT EXISTS sensor_config (
  sensor_id TEXT PRIMARY KEY,
  model     TEXT,
  location  FROZEN<sensor_location>,
  active    BOOLEAN
);
INSERT INTO sensor_config (sensor_id, model, location, active)
  VALUES ('S-001','TempPro v2',{building:'A',floor:3,zone:'Prod'},true);

CREATE TABLE IF NOT EXISTS sensor_metrics (
  sensor_id   TEXT,
  bucket      TEXT,          -- YYYYMM: '202401'
  ts          TIMESTAMP,
  temperature FLOAT,
  pressure    FLOAT,
  humidity    FLOAT,
  PRIMARY KEY ((sensor_id, bucket), ts)
) WITH CLUSTERING ORDER BY (ts DESC);

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 41 -->

CQL PRÁCTICA
Ejercicio: Solución (Pasos 5-6)

CQL
-- Paso 5a: Últimos 100 registros sensor S-001 en enero 2024
SELECT sensor_id, ts, temperature, humidity
FROM sensor_metrics
WHERE sensor_id = 'S-001'
  AND bucket    = '202401'
LIMIT 100;

-- Paso 5b: Sensores activos (solo dev — ALLOW FILTERING)
SELECT sensor_id, model FROM sensor_config
WHERE active = true
ALLOW FILTERING;

-- Paso 6: Materialized View por bucket
CREATE MATERIALIZED VIEW IF NOT EXISTS metrics_by_bucket AS
  SELECT * FROM sensor_metrics
  WHERE bucket IS NOT NULL
    AND sensor_id IS NOT NULL
    AND ts IS NOT NULL
  PRIMARY KEY ((bucket), sensor_id, ts)
  WITH CLUSTERING ORDER BY (sensor_id ASC, ts DESC);

-- Ahora podemos consultar todas las métricas de un mes dado:
SELECT * FROM metrics_by_bucket
WHERE bucket = '202401' LIMIT 500;

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 42 -->

ERRORES
Errores Frecuentes — y Cómo Evitarlos

Error #1
Partition Key de baja cardinalidad
✔ Usar composite PK: (status, user_id) o una tabla dedicada.
⚠ PK = status ('active'/'inactive'). Solo 2 particiones → enorme desequilibrio.

Error #2
ALLOW FILTERING en producción
✔ Crear tabla users_by_status con status como PK.
⚠ SELECT * WHERE active=true ALLOW FILTERING → escanea todos los nodos.

Error #3
UPDATE sin WHERE completo
✔ Siempre especificar la PK. Sin PK completa, la sentencia falla.
⚠ UPDATE users SET email=? — CQL requiere la PK completa en WHERE.

Error #4
Tombstones sin compaction
✔ Configurar TTL en lugar de DELETE. Monitorear con nodetool.
⚠ DELETE masivos acumulan tombstones que degradan lecturas exponencialmente.

Error #5
LWT en hot paths
✔ Usar LWT solo donde la unicidad sea estrictamente necesaria.
⚠ IF NOT EXISTS en cada registro de usuario → latencia 4x en escrituras críticas.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 43 -->

COMPARATIVA
Comparativa: Implementaciones Tabulares

| Feature | Cassandra | HBase | DynamoDB | Google BigTable |
| --- | --- | --- | --- | --- |
| Arquitectura | Peer-to-peer (ring) | Master-Slave (HMaster) | Managed (serverless) | Managed (Colossus) |
| Lenguaje | CQL (SQL-like) | Java API / HBase Shell | PartiQL / SDK | Bigtable API |
| Consistencia | Tunable (ONE/QUORUM/ALL) | Strong (ZooKeeper) | Eventual / Strong | Strong per-row |
| Escalado | Horizontal automático | Horizontal (manual) | Automático (AWS) | Automático (GCP) |
| Integ. Hadoop | Spark Connector | Nativa (ecosistema) | EMR / Glue | Dataproc |
| Open Source | Sí (Apache) | Sí (Apache) | No (propietario) | No (propietario) |

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 44 -->

DECISIÓN
¿Cuándo Elegir Bases Tabulares?

La clave no es qué tecnología es 'mejor' — es qué tecnología resuelve mejor el problema de negocio.

✔ SÍ elegir tabular
✘ NO elegir tabular
→  Series de tiempo (IoT, métricas, logs)
→  Queries ad hoc complejas y variables
→  Alta velocidad de escritura sostenida
→  Muchos JOINs entre entidades distintas
→  Escala horizontal predecible
→  Transacciones ACID estrictas
→  Queries de acceso bien definidas
→  Reporting/BI con agregaciones libres
→  Datos con TTL natural (sesiones, caché)
→  Modelo de datos muy relacional y normalizado
→  Multi-datacenter con geo-distribución
→  Equipo sin experiencia en diseño NoSQL

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 45 -->

REFLEXIÓN
Preguntas de Reflexión

Un sistema de e-commerce necesita: (a) búsqueda de productos por categoría y precio, (b) historial de órdenes por usuario. ¿Usarías la misma tabla para ambas queries? ¿Por qué?

1
💡 Pensá en el acceso por partition key y si hay alguna tabla que pueda satisfacer ambas con la misma PK.

Si usás CONSISTENCY ALL para todas las operaciones con RF=3, ¿qué pasa si uno de los tres nodos cae? ¿Cómo reconfigurarías para mantener disponibilidad sin perder consistencia?

2
💡 Analizá la fórmula: Writes(CL) + Reads(CL) > RF. ¿Qué combinación de CLs te da consistencia fuerte con un nodo caído?

Tenés un sistema de logs con 50.000 escrituras/segundo. El tech lead propone una tabla con log_level como única partition key. ¿Qué problema identificás y cómo lo resolverías?

3
💡 Cardinalidad. ¿Cuántos valores distintos tiene log_level? ¿Qué pasa con la distribución del ring?

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 46 -->

BIBLIOGRAFÍA
Bibliografía y Recursos

LIBRO
Bradberry, R. & Lubow, E. (2013). Practical Cassandra. Addison-Wesley. [Cap. 2–4]

LIBRO
Harrison, G. (2015). Next Generation Databases. Apress. [Cap. 6: Wide Column Stores]

LIBRO
Pivert, O. (2018). NoSQL Data Models. ISTE. [Cap. 4: Tabular Models]

DOC
Apache Cassandra Documentation. https://cassandra.apache.org/doc/latest/

DOC
CQL Reference. https://cassandra.apache.org/doc/latest/cassandra/developing/cql/

PAPER
Chang, F. et al. (2006). Bigtable: A Distributed Storage System. OSDI '06.

PAPER
Lakshman, A. & Malik, P. (2010). Cassandra: A Decentralized Structured Storage System. SIGOPS.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 47 -->

PRÓXIMA CLASE
Clase 8
Cassandra en Profundidad

Arquitectura interna avanzada: Gossip, Snitch, Virtual Nodes

Modelado avanzado: Materialized Views, SASI Index

Operaciones: nodetool, repair, compaction strategies

Integración con Spark y ecosistema Big Data

Práctica CQL avanzada: continuación del ejercicio IoT
Tarea para la próxima clase: completar el ejercicio IoT — agregarle TTL de 90 días a sensor_metrics y un BATCH que inserte en sensor_config y sensor_metrics simultáneamente.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 7

### Notes:

<!-- Slide number: 48 -->

3 Ideas Clave de Hoy

Diseñar para las queries
El modelo tabular no es un RDBMS mal usado. Es un paradigma diferente donde el schema existe para resolver queries específicas con latencia predecible.

La Partition Key lo define todo

Una PK correcta es la diferencia entre escala horizontal transparente y un sistema que colapsa bajo carga. Alta cardinalidad, distribución uniforme.

CQL es familiar pero tiene reglas
Sintaxis parecida a SQL, restricciones derivadas del modelo distribuido. Sin JOINs, WHERE limitado a PK, colecciones nativas, TTL integrado.
Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE  ·  2025

### Notes: