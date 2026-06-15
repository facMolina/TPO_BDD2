Ingeniería de Datos II

Guía de Comandos NoSQL

MongoDB  ·  Neo4j  ·  Redis  ·  Cassandra

Material de apoyo para la Defensa Oral del TP Integrador

Ing. Damián Arnaudo  |  UADE — FICE

⚠️  Esta guía es un material de referencia rápida para la instancia de defensa oral.
No reemplaza el conocimiento conceptual. Se espera que puedas justificar cada comando
que escribas: qué hace, cuándo conviene usarlo y por qué elegiste ese diseño en tu TP.

📘  MongoDB — Base Documental

💡 Contexto en el TP: motor principal para persistencia de documentos JSON con estructura
flexible. Justificá tus decisiones de embedding vs. referencia y el uso de índices.

  Conexión y base de datos

mongosh                              # Conectar al servidor local
mongosh "mongodb://host:27017"       # Conectar a host remoto
show dbs                             # Listar bases de datos
use nombreDB                         # Crear/seleccionar base de datos
db                                   # Ver base de datos activa
db.createCollection("coleccion")     # Crear colección explícitamente
show collections                     # Listar colecciones
db.coleccion.drop()                  # Eliminar colección

  Inserción

// Insertar un documento
db.productos.insertOne({
  nombre: "Laptop",
  precio: 1200,
  stock: 50,
  categorias: ["electronica", "computacion"],
  specs: { ram: "16GB", ssd: "512GB" }
})

// Insertar múltiples documentos
db.productos.insertMany([
  { nombre: "Mouse", precio: 25, stock: 200 },
  { nombre: "Teclado", precio: 45, stock: 150 }
])

  Consultas (find)

db.productos.find({})                               // Todos los documentos
db.productos.find({ precio: { $gt: 100 } })        // Mayor que
db.productos.find({ precio: { $gte: 100, $lte: 500 } }) // Rango
db.productos.find({ $and: [{ stock: { $gt: 0 } }, { precio: { $lt: 200 } }] })
db.productos.find({ $or: [{ categoria: "A" }, { categoria: "B" }] })
db.productos.find({ nombre: { $regex: "^Lap", $options: "i" } }) // Regex
db.productos.find({ "specs.ram": "16GB" })         // Campo anidado
db.productos.find({ categorias: "electronica" })   // Elemento en array
db.productos.find({ stock: { $exists: true } })    // Campo existe

// Proyección: mostrar solo algunos campos (1=mostrar, 0=ocultar)
db.productos.find({}, { nombre: 1, precio: 1, _id: 0 })

// Ordenar, limitar y saltar

db.productos.find().sort({ precio: -1 })           // Descendente
db.productos.find().limit(5).skip(10)

// Buscar un documento
db.productos.findOne({ nombre: "Laptop" })

  Actualización

// Actualizar un campo
db.productos.updateOne(
  { nombre: "Laptop" },
  { $set: { precio: 1100, "specs.ram": "32GB" } }
)

// Incrementar un valor numérico
db.productos.updateOne({ nombre: "Mouse" }, { $inc: { stock: -1 } })

// Agregar elemento a un array
db.productos.updateOne({ _id: id }, { $push: { categorias: "oferta" } })

// Actualizar múltiples documentos
db.productos.updateMany({ stock: 0 }, { $set: { disponible: false } })

// Upsert: insertar si no existe
db.productos.updateOne({ sku: "X99" }, { $set: { precio: 99 } }, { upsert: true })

  Eliminación

db.productos.deleteOne({ nombre: "Mouse" })
db.productos.deleteMany({ stock: { $lte: 0 } })

  Agregación (pipeline)

db.ventas.aggregate([
  // Etapa 1: Filtrar documentos
  { $match: { anio: 2024, estado: "completada" } },

  // Etapa 2: Descomponer array en documentos individuales
  { $unwind: "$productos" },

  // Etapa 3: Agrupar y calcular
  { $group: {
      _id: "$productos.categoria",
      total_ventas: { $sum: "$productos.precio" },
      cantidad: { $count: {} },
      promedio: { $avg: "$productos.precio" }
  }},

  // Etapa 4: Ordenar
  { $sort: { total_ventas: -1 } },

  // Etapa 5: Limitar resultados
  { $limit: 10 },

  // Etapa 6: Proyectar campos finales
  { $project: { categoria: "$_id", total_ventas: 1, cantidad: 1, _id: 0 } }
])

// JOIN entre colecciones ($lookup)
db.pedidos.aggregate([

  { $lookup: {
      from: "clientes",
      localField: "cliente_id",
      foreignField: "_id",
      as: "datos_cliente"
  }},
  { $unwind: "$datos_cliente" }
])

  Índices

db.productos.createIndex({ nombre: 1 })             // Índice simple ASC
db.productos.createIndex({ precio: -1 })            // Índice simple DESC
db.productos.createIndex({ categoria: 1, precio: -1 }) // Índice compuesto
db.productos.createIndex({ nombre: 1 }, { unique: true }) // Único
db.productos.createIndex({ descripcion: "text" })  // Búsqueda de texto
db.productos.getIndexes()                           // Ver índices existentes
db.productos.dropIndex("nombre_1")                  // Eliminar índice

// Analizar uso de índice en una query
db.productos.find({ nombre: "Laptop" }).explain("executionStats")

  Operadores de referencia rápida

Operador

$eq / $ne

$gt / $gte

$lt / $lte

$in / $nin

Descripción

Igual / Distinto

Mayor / Mayor o igual

Menor / Menor o igual

Está en lista / No está en lista

$and / $or / $not

Lógicos

$exists

$type

$regex

$set

$inc

$push / $pull

$unset

El campo existe (true/false)

Filtra por tipo BSON

Expresión regular

Asignar valor en update

Incrementar valor numérico

Agregar/quitar de array

Eliminar un campo

🧠  Neo4j — Base de Grafos (Cypher)

💡 Contexto en el TP: motor para representar y consultar relaciones entre entidades.
Justificá la semántica de tus etiquetas y el nombre de las relaciones (verbos en
infinitivo o pasado: COMPRA, PERTENECE_A, TRABAJA_EN). Evitá relaciones genéricas.

  Nodos — Crear, leer, modificar, eliminar

// Crear nodo con etiqueta y propiedades
CREATE (:Cliente { id: 1, nombre: "Ana López", email: "ana@mail.com" })

// Crear nodo y asignar variable
CREATE (c:Cliente { id: 2, nombre: "Luis Gómez" }) RETURN c

// Buscar todos los nodos de una etiqueta
MATCH (c:Cliente) RETURN c

// Buscar con filtro
MATCH (c:Cliente { nombre: "Ana López" }) RETURN c
MATCH (c:Cliente) WHERE c.nombre CONTAINS "Ana" RETURN c
MATCH (c:Cliente) WHERE c.id IN [1, 2, 3] RETURN c

// Modificar propiedad
MATCH (c:Cliente { id: 1 }) SET c.activo = true RETURN c

// Agregar nueva etiqueta
MATCH (c:Cliente { id: 1 }) SET c:Premium RETURN c

// Eliminar propiedad
MATCH (c:Cliente { id: 1 }) REMOVE c.email RETURN c

// Eliminar nodo (solo si no tiene relaciones)
MATCH (c:Cliente { id: 1 }) DELETE c

// Eliminar nodo y todas sus relaciones
MATCH (c:Cliente { id: 1 }) DETACH DELETE c

  Relaciones

// Crear relación entre dos nodos nuevos
CREATE (c:Cliente {nombre:"Ana"})-[:REALIZA]->(p:Pedido {id:101})

// Crear relación entre nodos existentes
MATCH (c:Cliente {id:1}), (p:Producto {sku:"X99"})
CREATE (c)-[:COMPRA { fecha: date(), cantidad: 3 }]->(p)

// Leer relaciones
MATCH (c:Cliente)-[r:COMPRA]->(p:Producto) RETURN c, r, p

// Relación en cualquier dirección
MATCH (a)-[:CONOCE]-(b) RETURN a, b

// Relaciones de profundidad variable (caminos)
MATCH (a:Cliente)-[:CONOCE*1..3]->(b:Cliente) RETURN a, b

// Camino más corto
MATCH (a:Ciudad {nombre:"BsAs"}), (b:Ciudad {nombre:"Mendoza"}),

      p = shortestPath((a)-[:CONECTA*]-(b))
RETURN p

  Consultas de agregación y análisis

// Contar nodos
MATCH (c:Cliente) RETURN count(c) AS total_clientes

// Agrupar y contar
MATCH (c:Cliente)-[:COMPRA]->(p:Producto)
RETURN p.categoria AS categoria, count(*) AS total ORDER BY total DESC

// Promedio, máximo, mínimo
MATCH (p:Producto) RETURN avg(p.precio), max(p.precio), min(p.precio)

// WITH para encadenar lógica
MATCH (c:Cliente)-[:COMPRA]->(p:Producto)
WITH c, count(p) AS cant_compras
WHERE cant_compras > 5
RETURN c.nombre, cant_compras ORDER BY cant_compras DESC

// COLLECT: agrupar en lista
MATCH (c:Cliente)-[:COMPRA]->(p:Producto)
RETURN c.nombre, collect(p.nombre) AS productos_comprados

// Recomendación simple (clientes con compras similares)
MATCH (c1:Cliente)-[:COMPRA]->(p:Producto)<-[:COMPRA]-(c2:Cliente)
WHERE c1 <> c2 AND c1.id = 1
RETURN c2.nombre, count(p) AS productos_en_comun ORDER BY productos_en_comun DESC

  Índices y restricciones

// Crear índice para acelerar búsquedas (Neo4j 4+)
CREATE INDEX cliente_id FOR (c:Cliente) ON (c.id)
CREATE INDEX producto_sku FOR (p:Producto) ON (p.sku)

// Restricción de unicidad
CREATE CONSTRAINT cliente_id_unico FOR (c:Cliente) REQUIRE c.id IS UNIQUE

// Ver índices y restricciones
SHOW INDEXES
SHOW CONSTRAINTS

// Explicar plan de ejecución
EXPLAIN MATCH (c:Cliente { id: 1 }) RETURN c
PROFILE MATCH (c:Cliente { id: 1 }) RETURN c

  MERGE — Crear solo si no existe

// MERGE: garantiza que el nodo/relación exista (crea o reutiliza)
MERGE (c:Cliente { id: 5 })
ON CREATE SET c.nombre = "Carlos", c.creado = datetime()
ON MATCH SET c.ultimo_acceso = datetime()
RETURN c

// MERGE en relaciones
MATCH (c:Cliente {id:1}), (p:Producto {sku:"X99"})
MERGE (c)-[:COMPRA]->(p)

⚡  Redis — Base Clave/Valor en Memoria

💡 Contexto en el TP (temas impares): Redis actúa como fuente de verdad operacional
en tiempo real, NO como caché de MongoDB. Usalo para estados activos, sesiones,
contadores en vivo, rankings y estructuras que requieren acceso de microsegundos.

  Conexión y comandos básicos

redis-cli                              # Conectar localmente
redis-cli -h host -p 6379             # Conectar a host remoto
PING                                   # Verificar conexión (responde PONG)
INFO server                            # Info del servidor
SELECT 0                               # Seleccionar base de datos (0-15)
DBSIZE                                 # Cantidad de claves en la DB
FLUSHDB                                # Borrar todas las claves (¡cuidado!)
KEYS patron*                           # Buscar claves por patrón (no usar en prod)
SCAN 0 MATCH "prefijo:*" COUNT 100    # Iterar claves de forma segura

  Strings — Tipo básico

SET usuario:1:nombre "Ana López"
GET usuario:1:nombre
SET contador 0
INCR contador                          # Incrementar en 1 (atómico)
INCRBY contador 5                      # Incrementar en N
DECR contador
APPEND usuario:1:nombre " (VIP)"
STRLEN usuario:1:nombre               # Longitud del string

// TTL — Expiración automática
SET sesion:abc123 "datos" EX 3600     # Expira en 3600 segundos (1 hora)
EXPIRE clave 300                       # Asignar TTL a clave existente
TTL sesion:abc123                      # Ver segundos restantes (-1=sin TTL, -
2=expirada)
PERSIST clave                          # Quitar TTL

  Hash — Objeto estructurado

HSET producto:101 nombre "Laptop" precio 1200 stock 50
HGET producto:101 nombre
HMGET producto:101 nombre precio stock  # Múltiples campos
HGETALL producto:101                   # Todos los campos y valores
HINCRBY producto:101 stock -1          # Decrementar stock
HINCRBYFLOAT producto:101 precio 50.5
HDEL producto:101 stock               # Eliminar campo
HEXISTS producto:101 nombre           # Verificar existencia de campo
HKEYS producto:101                    # Solo las claves
HVALS producto:101                    # Solo los valores
HLEN producto:101                     # Cantidad de campos

  List — Cola / Pila

RPUSH cola:pedidos "pedido:1"         # Agregar al final (cola)
RPUSH cola:pedidos "pedido:2" "pedido:3"

LPUSH pila:acciones "accion:1"        # Agregar al inicio (pila)
LPOP cola:pedidos                     # Extraer del inicio
RPOP cola:pedidos                     # Extraer del final
LRANGE cola:pedidos 0 -1             # Ver todos los elementos
LLEN cola:pedidos                    # Longitud de la lista
LINDEX cola:pedidos 0               # Elemento en posición N

// Cola bloqueante (útil para workers)
BLPOP cola:pedidos 30               # Bloquea hasta 30s si la cola está vacía

  Set — Conjunto sin duplicados

SADD tags:producto:101 "electronica" "oferta" "premium"
SMEMBERS tags:producto:101          # Ver todos los miembros
SISMEMBER tags:producto:101 "oferta" # ¿Pertenece al set?
SCARD tags:producto:101             # Cardinalidad (cantidad)
SREM tags:producto:101 "oferta"    # Eliminar miembro

// Operaciones de conjuntos
SUNION set1 set2                    # Unión
SINTER set1 set2                   # Intersección
SDIFF set1 set2                    # Diferencia
SRANDMEMBER tags:producto:101 3    # 3 miembros aleatorios

  Sorted Set — Ranking / Leaderboard

ZADD ranking:ventas 1500 "vendedor:1"
ZADD ranking:ventas 2300 "vendedor:2" 800 "vendedor:3"

// Consultar ranking
ZRANGE ranking:ventas 0 -1 WITHSCORES          # Ascendente
ZREVRANGE ranking:ventas 0 4 WITHSCORES        # Top 5 descendente
ZREVRANK ranking:ventas "vendedor:1"           # Posición en el ranking
ZSCORE ranking:ventas "vendedor:2"             # Score de un miembro

// Filtrar por score
ZRANGEBYSCORE ranking:ventas 1000 3000 WITHSCORES
ZREVRANGEBYSCORE ranking:ventas 3000 1000 LIMIT 0 5
ZCOUNT ranking:ventas 1000 3000                # Contar en rango

// Incrementar score
ZINCRBY ranking:ventas 300 "vendedor:1"

// Eliminar
ZREM ranking:ventas "vendedor:3"

  Transacciones y patrones avanzados

// Transacción atómica
MULTI
HINCRBY producto:101 stock -1
ZADD ultimas_ventas 1714000000 "venta:999"
EXEC                               # Ejecutar todo o nada
DISCARD                            # Cancelar transacción

// Pub/Sub — Mensajería
SUBSCRIBE canal:notificaciones     # Suscribirse
PUBLISH canal:notificaciones "nuevo pedido" # Publicar mensaje

// Pipeline (enviar varios comandos de una vez)
// Se usa desde el cliente (ej: redis-py pipeline())

📦  Cassandra — Base Tabular Distribuida (CQL)

💡 Contexto en el TP (temas pares): Cassandra gestiona escrituras masivas de datos
de series temporales (logs, métricas, eventos). El diseño de tablas se orienta
a las consultas (query-first design). La PRIMARY KEY determina distribución y orden.

  Conexión y keyspaces

cqlsh                                        # Conectar localmente
cqlsh host 9042                             # Conectar a host remoto

// Crear keyspace (entorno de trabajo)
CREATE KEYSPACE mi_app
  WITH replication = {
    'class': 'SimpleStrategy',
    'replication_factor': 1
  };

// Para entornos multi-datacenter
CREATE KEYSPACE mi_app
  WITH replication = {
    'class': 'NetworkTopologyStrategy',
    'datacenter1': 3
  };

USE mi_app;                                  # Seleccionar keyspace
DESCRIBE KEYSPACES;                          # Listar keyspaces
DESCRIBE TABLES;                             # Listar tablas del keyspace activo

  Diseño de tablas — PRIMARY KEY

// PRIMARY KEY = (partition key) + clustering columns
// Partition key: determina en qué nodo se almacenan los datos
// Clustering columns: determinan el orden dentro de la partición

// Tabla para logs de eventos (serie temporal)
CREATE TABLE eventos_por_usuario (
  usuario_id   UUID,
  timestamp    TIMESTAMP,
  tipo_evento  TEXT,
  payload      TEXT,
  PRIMARY KEY ((usuario_id), timestamp)
) WITH CLUSTERING ORDER BY (timestamp DESC);

// Tabla con partition key compuesta (evitar particiones calientes)
CREATE TABLE metricas_por_dia (
  sensor_id    TEXT,
  fecha        DATE,
  hora         TIME,
  valor        DOUBLE,
  PRIMARY KEY ((sensor_id, fecha), hora)
) WITH CLUSTERING ORDER BY (hora ASC);

// Tipos de datos comunes
// UUID, TIMEUUID, TEXT, VARCHAR, INT, BIGINT, FLOAT, DOUBLE,
// BOOLEAN, TIMESTAMP, DATE, TIME, LIST<TEXT>, SET<INT>, MAP<TEXT,TEXT>

  CRUD básico

// INSERT
INSERT INTO eventos_por_usuario (usuario_id, timestamp, tipo_evento, payload)
VALUES (uuid(), toTimestamp(now()), 'login', '{"ip":"192.168.1.1"}');

// INSERT con TTL (expiración automática)
INSERT INTO sesiones (id, datos) VALUES (uuid(), "token_abc")
  USING TTL 3600;

// SELECT — siempre con la partition key
SELECT * FROM eventos_por_usuario WHERE usuario_id = 550e8400-e29b-...-..;

// SELECT con rango en clustering column
SELECT * FROM eventos_por_usuario
  WHERE usuario_id = 550e8400-....
  AND timestamp >= 2024-01-01 00:00:00
  AND timestamp < 2024-02-01 00:00:00;

// UPDATE
UPDATE eventos_por_usuario SET tipo_evento = 'logout'
  WHERE usuario_id = 550e8400-.... AND timestamp = '2024-01-15 10:30:00';

// DELETE
DELETE FROM eventos_por_usuario
  WHERE usuario_id = 550e8400-.... AND timestamp = '2024-01-15 10:30:00';

  Índices y ALLOW FILTERING

// Índice secundario (usar con criterio — puede degradar performance)
CREATE INDEX ON eventos_por_usuario (tipo_evento);

// Después del índice, podemos filtrar por tipo_evento
SELECT * FROM eventos_por_usuario WHERE tipo_evento = 'login';

// ALLOW FILTERING — solo en desarrollo o datasets pequeños
// En producción puede causar full table scan en todos los nodos
SELECT * FROM eventos_por_usuario WHERE payload LIKE '%login%' ALLOW FILTERING;

  Administración de esquema

// Agregar columna
ALTER TABLE eventos_por_usuario ADD dispositivo TEXT;

// Ver descripción de tabla
DESCRIBE TABLE eventos_por_usuario;

// Ver info de particiones y rendimiento
SELECT * FROM system_schema.tables WHERE keyspace_name = "mi_app";

// Truncar tabla (borrar datos, mantener esquema)
TRUNCATE eventos_por_usuario;

// Eliminar tabla / keyspace
DROP TABLE eventos_por_usuario;
DROP KEYSPACE mi_app;

// Generar UUID
SELECT uuid() FROM system.local;
SELECT now() FROM system.local;      // TIMEUUID basado en tiempo

  Principios de modelado — Recordar en la defensa

Concepto

Query-first design

Partition key

Clustering column

Desnormalización

Partition caliente

Descripción / Regla práctica

Diseñar la tabla según la consulta, no la entidad

Distribuye datos entre nodos; filtro obligatorio en WHERE

Ordena dentro de la partición; permite rangos

Duplicar datos es aceptable para evitar JOINs

Evitar claves con cardinalidad baja (ej: boolean)

ALLOW FILTERING

Full-scan; solo para desarrollo o datasets chicos

TTL

Compaction

Expiración automática de datos; ideal para logs y sesiones

Cassandra fusiona SSTables periódicamente en background

