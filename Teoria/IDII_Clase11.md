<!-- Slide number: 1 -->

CLASE 11
Acceso desde
Aplicaciones
Frameworks de Persistencia · Drivers · Patrones · Polyglot

Java / Spring

Python

Node.js

ORM · ODM

Polyglot
Ing. Damián Arnaudo  ·  UADE  ·  Ingeniería de Datos II

### Notes:

<!-- Slide number: 2 -->

HOJA DE RUTA
¿Qué veremos hoy?

3 h 30 min · 4 bloques

Arquitectura de acceso a datos
01

0:00 – 0:45
Capas, drivers, conexiones y pooling

Acceso por lenguaje
02
0:45 – 1:30

Java, Python y Node.js — drivers y ejemplos reales

Frameworks de persistencia
03
1:40 – 2:30

Spring Data, Mongoose, Pymongo, ODMs y ORMs

Persistencia polimórfica
04
2:30 – 3:30
Polyglot persistence, CQRS, Saga y patrones

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 3 -->

BLOQUE 01
Arquitectura
de Acceso

Capas · Drivers · Pooling · Protocolos

### Notes:

<!-- Slide number: 4 -->

ARQUITECTURA
La pila de acceso a datos

Capas entre la app y la base de datos

Lógica de Negocio / Servicios
Reglas de dominio, casos de uso

ORM / ODM / Framework de persistencia
Abstracción del acceso: Spring Data, Mongoose, SQLAlchemy...

Driver / Connector nativo
Protocolo específico: MongoDB Wire, Bolt, Redis RESP, CQL...

Connection Pool
Reutilización de conexiones: reduce overhead de TCP/auth

Capa de red (TCP/TLS)
Protocolo de transporte cifrado o plano

Motor de Base de Datos
MongoDB, Neo4j, Redis, Cassandra...

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 5 -->

DRIVERS
¿Qué es un Driver?

La capa que habla el idioma de cada motor

Un driver es una biblioteca que implementa el protocolo de comunicación nativo de un motor de base de datos. Traduce las llamadas de la aplicación (métodos, objetos) al formato binario o textual que el servidor entiende.

MongoDB
Wire Protocol (binario sobre TCP)
mongodb (Node), pymongo (Python), mongo-java-driver

Neo4j
Bolt Protocol (binario eficiente)
neo4j (Node/Python), neo4j-java-driver

Redis
RESP — Redis Serialization Protocol
ioredis / redis (Node), redis-py, Jedis (Java)

Cassandra
CQL Binary Protocol v4/v5
cassandra-driver (Node/Python), DataStax Java Driver

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 6 -->

CONNECTION POOL
Connection Pooling

Por qué no crear una conexión por request

Sin pooling  ✘
Con pooling  ✔
maxPoolSize
Cada request abre y cierra una conexión TCP

Máx. conexiones simultáneas
minPoolSize

Overhead de autenticación por cada request
Conexiones pre-calentadas

maxIdleTimeMS
Tiempo antes de cerrar idle
Bajo carga → agotamiento de conexiones

connectTimeoutMS
Timeout de nueva conexión
Latencia extra de 20–100 ms por conexión

waitQueueTimeoutMS
Timeout de espera en cola

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 7 -->

PROTOCOLOS
Protocolos de Comunicación

Cómo habla tu app con la base de datos

Wire Protocol
(MongoDB)
Bolt Protocol
(Neo4j)
Binario sobre TCP. Usa BSON para serializar documentos.
Soporta compresión (zstd, snappy) y autenticación SCRAM.
Binario diseñado para grafos. Eficiente en serialización de nodos/relaciones.
V1→V5, cada versión agrega features.

RESP
(Redis)
CQL Binary
(Cassandra)

Redis Serialization Protocol. Texto plano, simple, ultra-rápido.
RESP3 agrega tipos ricos: Map, Set, Double.
Protocolo binario sobre TCP, orientado a columnas.
PreparedStatements se precompilan en el servidor.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 8 -->

BLOQUE 02
Acceso por
Lenguaje

Java · Python · Node.js — drivers y ejemplos reales

### Notes:

<!-- Slide number: 9 -->

ECOSISTEMAS
¿Qué lenguaje, qué driver?

Cada lenguaje tiene su ecosistema de conectividad NoSQL
| Motor | Java | Python | Node.js |
| --- | --- | --- | --- |
| MongoDB | mongo-java-driver 5.x | pymongo 4.x | mongodb 6.x |
| Neo4j | neo4j-java-driver 5.x | neo4j 5.x / py2neo | neo4j 5.x |
| Redis | Jedis / Lettuce | redis-py 5.x | ioredis / redis 4.x |
| Cassandra | DataStax Java 4.x | cassandra-driver 3.x | cassandra-driver 4.x |

Regla general: siempre usar el driver oficial del motor (mantenido por el vendor). Los wrappers de terceros pueden quedar desactualizados respecto al protocolo y las features más recientes.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 10 -->

JAVA · MONGODB
Java — MongoDB Driver 5.x

Java

// Conectar (una sola instancia por app)
MongoClient client = MongoClients.create(
  MongoClientSettings.builder()
    .applyConnectionString(
      new ConnectionString(
        "mongodb://localhost:27017"))
    .applyToConnectionPoolSettings(b->
      b.maxSize(20).minSize(5))
    .build());

MongoDatabase db =
  client.getDatabase("ecommerce");
MongoCollection<Document> products =
  db.getCollection("products");

// Consulta con filtros
FindIterable<Document> result =
  products.find(
    Filters.and(
      Filters.eq("category","electronics"),
      Filters.lt("price", 500.0)
    )
  ).sort(Sorts.descending("price"));
Buenas prácticas

Una sola instancia
MongoClient gestiona el pool internamente. Crear múltiples instancias desperdicia conexiones.

Cerrar el cliente
Siempre cerrar el cliente al apagar la app (try-with-resources o shutdown hook).
POJO Codec

Mapear directamente a clases Java con PojoCodecProvider. Evita trabajar con Document crudo.
Reactive (coroutines)
MongoCollection<T> tiene variante reactiva con Publisher<T> para apps non-blocking.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 11 -->

JAVA · NEO4J
Java — Neo4j Driver 5.x · Bolt Protocol

Java

Driver driver = GraphDatabase.driver(
  "bolt://localhost:7687",
  AuthTokens.basic("neo4j", "pass")
);

// Sesión con transacción explícita
try (Session session = driver.session()) {
  List<String> friends = session
    .executeRead(tx -> {
      var result = tx.run(
        "MATCH (p:Person)-[:KNOWS]->(f) "
        + "WHERE p.name = $name "
        + "RETURN f.name AS name",
        Map.of("name", "Alice")
      );
      return result.list(r ->
        r.get("name").asString());
    });
  friends.forEach(System.out::println);
}
driver.close();
Sesiones y transacciones

executeRead()
Transacción de solo lectura. Puede reintentarse automáticamente.
executeWrite()
Transacción de escritura. ACID garantizado.

session.run()
Query sin transacción explícita. Menos seguro ante fallos.

Bookmarks
Garantizan consistencia causal en clusters. Se propagan entre sesiones.
Async Session
asyncSession() para apps reactivas con CompletableFuture.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 12 -->

JAVA · REDIS
Java — Redis: Jedis vs Lettuce

Java

// Jedis — síncrono, simple
JedisPool pool = new JedisPool(
  new JedisPoolConfig(), "localhost", 6379);

try (Jedis jedis = pool.getResource()) {
  jedis.set("user:42:session",
            "tok_xyz");
  jedis.expire("user:42:session", 3600);
  String tok = jedis.get(
    "user:42:session");
}
// Lettuce — reactivo (recomendado)
RedisClient client = RedisClient.create(
  "redis://localhost:6379");
StatefulRedisConnection<String,String>
  conn = client.connect();
RedisCommands<String,String> cmd =
  conn.sync();

cmd.set("user:42:session", "tok_xyz");
cmd.expire("user:42:session", 3600);
String tok = cmd.get(
  "user:42:session");

Jedis: Bloqueante, por hilo. Usar con pool. Ideal para apps síncronas simples.   Lettuce: Non-blocking, compartible entre hilos, soporte Reactive. Recomendado para apps de alta concurrencia.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 13 -->

JAVA · CASSANDRA
Java — DataStax Driver 4.x

Java

CQL y PreparedStatements

CqlSession session = CqlSession.builder()
  .addContactPoint(new InetSocketAddress(
    "localhost", 9042))
  .withLocalDatacenter("dc1")
  .withKeyspace("ecommerce")
  .build();

// PreparedStatement — precompilado
PreparedStatement ps = session.prepare(
  "SELECT * FROM orders_by_customer "
  + "WHERE customer_id = ?");

// Reutilizar para múltiples queries
BoundStatement bs = ps.bind(customerId);
bs = bs.setConsistencyLevel(
  ConsistencyLevel.LOCAL_QUORUM);

ResultSet rs = session.execute(bs);
for (Row row : rs) {
  System.out.println(row.getUuid(
    "order_id"));
}
Conceptos clave

PreparedStatement
Enviada al server una vez. Ejecutada N veces con parámetros. Más eficiente y segura.

ConsistencyLevel
LOCAL_ONE, LOCAL_QUORUM, ALL. Define cuántos réplicas deben confirmar.
Load Balancing
El driver distribuye queries entre nodos del cluster automáticamente.

Retry Policy
Reintento automático ante fallos transitorios configurables.
Reactive API
session.executeReactive() para streams reactivos con Project Reactor.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 14 -->

PYTHON
Python — Ecosistema NoSQL

Drivers síncronos, asíncronos y ORMs/ODMs

pymongo
motor
MongoDB
MongoDB

Oficial. Síncrono. El más usado en el ecosistema Python.
Async/await sobre pymongo. Ideal para FastAPI, aiohttp.

redis-py
neo4j
Redis
Neo4j

Oficial. Síncrono + async (aioredis integrado desde v4).
Driver oficial. Bolt + sync/async session.

py2neo
cassandra-driver
Neo4j
Cassandra

OGM de terceros. Mapea nodos a clases Python.
Oficial DataStax. Sync + async. Soporte para Cluster y LoadBalancing.

neomodel
MongoEngine
Neo4j
MongoDB
OGM inspirado en Django ORM. Define nodos como modelos declarativos.
ODM estilo Django. Define documentos como clases Python.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 15 -->

PYTHON · MONGODB
Python — pymongo 4.x

Python

from pymongo import MongoClient, DESCENDING
from pymongo.errors import ConnectionFailure

# Una sola instancia por aplicación
client = MongoClient(
  "mongodb://localhost:27017",
  maxPoolSize=20,
  minPoolSize=5,
  serverSelectionTimeoutMS=5000
)

db = client["ecommerce"]
products = db["products"]

# Consulta con filtros y proyección
result = products.find(
  {"category": "electronics",
   "price": {"$lt": 500}},
  {"name": 1, "price": 1, "_id": 0}
).sort("price", DESCENDING).limit(10)

for doc in result:
    print(doc["name"], doc["price"])
# Inserción y manejo de errores
from pymongo.errors import DuplicateKeyError

try:
    result = products.insert_one({
        "name": "Laptop Pro",
        "price": 1299.99,
        "category": "electronics",
        "tags": ["laptop", "pro"],
    })
    print(result.inserted_id)
except DuplicateKeyError as e:
    print(f"Ya existe: {e}")

# Aggregation pipeline
pipeline = [
  {"$match": {"category": "electronics"}},
  {"$group": {
    "_id": "$brand",
    "avg": {"$avg": "$price"}
  }},
  {"$sort": {"avg": -1}}
]
stats = list(products.aggregate(pipeline))

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 16 -->

PYTHON · ASYNC MONGODB
Python — motor: MongoDB asíncrono

Python

Ideal para FastAPI y aplicaciones async/await

import asyncio
from motor.motor_asyncio import (
    AsyncIOMotorClient
)

# Uso con FastAPI
from fastapi import FastAPI
app = FastAPI()

client = AsyncIOMotorClient(
    "mongodb://localhost:27017"
)
db = client["ecommerce"]

@app.get("/products/{category}")
async def get_products(category: str):
    cursor = db.products.find(
        {"category": category}
    ).sort("price", -1).limit(20)
    return await cursor.to_list(20)
¿Por qué async?

En aplicaciones web, la mayor parte del tiempo se espera I/O (BD, red). Con async/await, un solo proceso puede atender miles de requests concurrentes sin bloquear.
motor

MongoDB async. Wrappea pymongo con asyncio.
aioredis

Redis async (integrado en redis-py >= 4).

neo4j async

neo4j-driver ofrece AsyncSession nativo.
aiohttp

Cliente HTTP async. Combina bien con estas libs.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 17 -->

PYTHON · REDIS
Python — redis-py 5.x

Python

Síncrono y asíncrono en el mismo paquete

import redis

# Síncrono con pool
r = redis.Redis(
    host="localhost", port=6379,
    decode_responses=True,
    max_connections=20
)

# Strings + TTL
r.set("user:42:session", "tok_abc",
      ex=3600)
tok = r.get("user:42:session")

# Hash (objeto completo)
r.hset("user:42", mapping={
    "name": "Ana García",
    "email": "ana@uade.edu.ar",
    "role": "student"
})
r.expire("user:42", 7200)
user = r.hgetall("user:42")
import asyncio
import redis.asyncio as aioredis

# Asíncrono (desde redis-py 4.2+)
async def main():
    r = aioredis.Redis(
        host="localhost",
        decode_responses=True
    )
    await r.set(
        "user:42:session",
        "tok_abc", ex=3600
    )

    # Pipeline — batch de comandos
    async with r.pipeline() as pipe:
        await pipe.incr("visits")
        await pipe.incr("api_calls")
        await pipe.expire("visits",86400)
        results = await pipe.execute()

asyncio.run(main())

Pipeline: agrupa múltiples comandos en un solo round-trip. Reduce dramáticamente la latencia en operaciones batch.
Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 18 -->

PYTHON · NEO4J
Python — Neo4j Driver 5.x

Python

from neo4j import GraphDatabase

driver = GraphDatabase.driver(
    "bolt://localhost:7687",
    auth=("neo4j", "password")
)

def find_friends(name: str):
    with driver.session() as session:
        result = session.execute_read(
            _find_friends_tx, name
        )
        return result

def _find_friends_tx(tx, name):
    query = (
        "MATCH (p:Person)-[:KNOWS]->(f) "
        "WHERE p.name = $name "
        "RETURN f.name AS name, "
        "       f.age  AS age"
    )
    records = tx.run(query, name=name)
    return [{"name": r["name"],
             "age":  r["age"]}
            for r in records]

driver.close()
# Async session
from neo4j import AsyncGraphDatabase

async def find_friends_async(name):
    async with AsyncGraphDatabase.driver(
        "bolt://localhost:7687",
        auth=("neo4j", "pass")
    ) as driver:
        async with driver.session() as s:
            result = await s.execute_read(
                _tx_fn, name
            )
            return result

# neomodel — OGM declarativo
from neomodel import (StructuredNode,
  StringProperty, RelationshipTo)

class Person(StructuredNode):
    name = StringProperty(unique_index=True)
    knows = RelationshipTo(
        'Person', 'KNOWS')

alice = Person(name="Alice").save()
bob   = Person(name="Bob").save()
alice.knows.connect(bob)

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 19 -->

PYTHON · CASSANDRA
Python — cassandra-driver 3.x

Python

DataStax oficial — sync y async

from cassandra.cluster import Cluster
from cassandra.auth import (
    PlainTextAuthProvider)
from cassandra.query import SimpleStatement
from cassandra import ConsistencyLevel

cluster = Cluster(
    ["localhost"],
    port=9042,
    auth_provider=PlainTextAuthProvider(
        "cassandra", "cassandra")
)
session = cluster.connect("ecommerce")

# PreparedStatement
ps = session.prepare(
    "SELECT * FROM orders_by_customer "
    "WHERE customer_id = ?"
)

stmt = ps.bind([customer_id])
stmt.consistency_level = \
    ConsistencyLevel.LOCAL_QUORUM
rows = session.execute(stmt)
for row in rows:
    print(row.order_id, row.total)
# Async con execute_concurrent
from cassandra.concurrent import (
    execute_concurrent_with_args)

# Inserción masiva eficiente
insert_ps = session.prepare(
    "INSERT INTO events "
    "(device_id, ts, value) "
    "VALUES (?, ?, ?)"
)

# Lista de parámetros
params = [
    ("dev-001", t, v)
    for t, v in readings
]

results = execute_concurrent_with_args(
    session, insert_ps, params,
    concurrency=50  # 50 en paralelo
)

# Contar errores
errors = sum(1 for ok, _ in results
             if not ok)
print(f"{errors} errores")

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 20 -->

NODE.JS
Node.js — Ecosistema NoSQL

Drivers oficiales y frameworks en el ecosistema JS/TS

mongodb
ioredis
MongoDB
Redis

Driver oficial. Async/await nativo. TypeScript first.
Full-featured. Cluster, Sentinel, Lua scripts, pipeline.

redis (node-redis)
neo4j-driver
Redis
Neo4j

Oficial Redis Ltd. Más ligero que ioredis.
Oficial. Bolt. Promise + Reactive streams.

cassandra-driver
Mongoose
Cassandra
MongoDB

Oficial DataStax Node.js. Async con callbacks/promises.
ODM más popular de Node. Schema + validación + middleware.

Prisma
TypeORM
MongoDB/SQL
SQL/MongoDB
ORM type-safe moderno. Schema declarativo en .prisma.
ORM con decoradores. Soporta ActiveRecord y DataMapper.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 21 -->

NODE.JS · MONGODB
Node.js — MongoDB Driver 6.x

JavaScript

import { MongoClient, ObjectId } from 'mongodb';

const client = new MongoClient(
  'mongodb://localhost:27017',
  { maxPoolSize: 20, minPoolSize: 5 }
);
await client.connect();

const db = client.db('ecommerce');
const products = db.collection('products');

// Consulta con filtros
const result = await products
  .find({
    category: 'electronics',
    price: { $lt: 500 }
  })
  .sort({ price: -1 })
  .limit(10)
  .toArray();

// Inserción
const { insertedId } = await products
  .insertOne({ name: 'Laptop', price: 999 });
console.log('Creado:', insertedId);
// Aggregation pipeline
const stats = await products.aggregate([
  { $match: { category: 'electronics' }},
  { $group: {
      _id: '$brand',
      avgPrice: { $avg: '$price' },
      count: { $sum: 1 }
  }},
  { $sort: { avgPrice: -1 }},
  { $limit: 5 }
]).toArray();

// Transacciones (requiere replica set)
const session = client.startSession();
try {
  session.startTransaction();
  await orders.insertOne({...}, {session});
  await inventory.updateOne(
    { _id: itemId },
    { $inc: { stock: -1 } },
    { session }
  );
  await session.commitTransaction();
} catch(e) {
  await session.abortTransaction();
} finally { session.endSession(); }

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 22 -->

NODE.JS · REDIS
Node.js — ioredis

JavaScript

El cliente Redis más completo para Node.js

import Redis from 'ioredis';

const redis = new Redis({
  host: 'localhost', port: 6379,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
});

// Strings con TTL
await redis.set(
  'user:42:session', 'tok_abc',
  'EX', 3600
);
const tok = await redis.get(
  'user:42:session');

// Hash
await redis.hset('user:42', {
  name: 'Ana', email: 'ana@uade.edu.ar'
});
const user = await redis.hgetall('user:42');
// Pipeline — batch de comandos
const pipe = redis.pipeline();
pipe.incr('visits');
pipe.incr('api:calls');
pipe.expire('visits', 86400);
const [, [, visits]] = await pipe.exec();

// Pub/Sub
const sub = new Redis();
sub.subscribe('orders:new');
sub.on('message', (channel, msg) => {
  console.log('Nueva orden:', msg);
});

// Pub desde otro cliente
const pub = new Redis();
await pub.publish('orders:new',
  JSON.stringify({ id: 42, total: 99 })
);

// Sorted Set (ranking)
await redis.zadd('leaderboard',
  100, 'Alice', 95, 'Bob', 88, 'Carlos');
const top3 = await redis.zrevrange(
  'leaderboard', 0, 2, 'WITHSCORES');

Pub/Sub de Redis es ideal para mensajería ligera entre microservicios. Para durabilidad, considerar Redis Streams o Kafka.
Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 23 -->

NODE.JS · NEO4J + CASSANDRA
Node.js — Neo4j y Cassandra

JavaScript

// Neo4j — driver oficial
import neo4j from 'neo4j-driver';

const driver = neo4j.driver(
  'bolt://localhost:7687',
  neo4j.auth.basic('neo4j', 'pass')
);

const session = driver.session();
const result = await session.run(
  `MATCH (p:Person)-[:KNOWS]->(f)`,
  `WHERE p.name = $name`,
  `RETURN f.name AS name`,
  { name: 'Alice' }
);

const friends = result.records.map(
  r => r.get('name')
);
await session.close();
await driver.close();
// Cassandra — DataStax Node Driver
import cassandra from 'cassandra-driver';

const client = new cassandra.Client({
  contactPoints: ['localhost'],
  localDataCenter: 'datacenter1',
  keyspace: 'ecommerce',
});
await client.connect();

const ps = await client.prepare(
  'SELECT * FROM orders_by_customer'
  + ' WHERE customer_id = ?'
);

const result = await client.execute(
  ps,
  [customerId],
  { prepare: true,
    consistency:
      cassandra.types.consistencies
        .localQuorum }
);
console.log(result.rows);

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 24 -->

BLOQUE 03
Frameworks
de Persistencia

ORM · ODM · Spring Data · Mongoose · SQLAlchemy · neomodel

### Notes:

<!-- Slide number: 25 -->

FRAMEWORKS
¿Para qué sirve un Framework de Persistencia?

Del acceso crudo al acceso con semántica de dominio

Driver puro
INSERT INTO / db.collection.insertOne()
Máximo control. Máximo código.

abstracción

Active Record
User.save() — el objeto se persiste a sí mismo
Simple. Mezcla dominio y persistencia.

abstracción

Data Mapper
repository.save(user) — objeto ignora la BD
Separación limpia. Más código inicial.

abstracción

ORM / ODM completo
Anotaciones + query derivadas automáticas
Productividad máxima. Menos control.

abstracción

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 26 -->

SPRING DATA
Spring Data

Un modelo unificado para múltiples stores

JPA/Hibernate

MongoDB

Spring Data

Cassandra

Redis

Elasticsearch
Neo4j

Concepto clave: independientemente del motor, el Repository siempre luce igual. Solo cambia el módulo de Spring Data importado.
Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 27 -->

SPRING DATA MONGODB
Spring Data MongoDB — Repository Pattern

Java

Query derivada automática

@Document(collection = "products")
public class Product {
  @Id private String id;
  private String name;
  private String category;
  private Double price;
  private List<String> tags;
}

// Repository — sin implementación manual
public interface ProductRepository
    extends MongoRepository<Product, String> {

  List<Product> findByCategory(String c);
  List<Product> findByPriceLessThan(Double p);
  List<Product> findByTagsContaining(
    String tag);
  Page<Product> findByCategoryOrderByPriceDesc(
    String cat, Pageable pageable);
}
Spring Data parsea el nombre del método y genera la query MongoDB equivalente.

findBy
WHERE campo =

findByXLessThan
WHERE x < valor

findByXContaining
array contiene

findByXIn
WHERE x IN lista

findByXAndY
WHERE x = AND y =

OrderByXDesc
ORDER BY x DESC

Page<T> + Pageable
paginación automática
Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 28 -->

SPRING DATA MONGODB
Spring Data MongoDB — @Query y Aggregation

Java

// @Query — JSON de MongoDB inline
@Query("{category: ?0, price:{$lt:?1}}")
List<Product> findCheap(
  String category, Double maxPrice);

// @Aggregation pipeline
@Aggregation(pipeline = {
  "{ $match: {category: ?0} }",
  "{ $group: {
      _id: '$brand',
      avg: {$avg: '$price'},
      count: {$sum: 1}
  }}",
  "{ $sort: {avg: -1} }"
})
List<BrandStats> statsByCategory(
  String category);

// MongoTemplate para queries complejas
@Autowired MongoTemplate mongoTemplate;

Query q = new Query(
  Criteria.where("price").lt(500)
    .and("category").is("electronics")
).with(Sort.by(Sort.Direction.DESC,"price"));
List<Product> res =
  mongoTemplate.find(q, Product.class);
// Service que usa el repository
@Service
public class ProductService {

  @Autowired
  ProductRepository repo;

  public List<Product> getCheap(
      String cat, Double max) {
    return repo.findCheap(cat, max);
  }

  public Page<Product> paginate(
      String cat, int page) {
    return repo
      .findByCategoryOrderByPriceDesc(
        cat,
        PageRequest.of(page, 20)
      );
  }

  public List<BrandStats> stats(
      String cat) {
    return repo.statsByCategory(cat);
  }
}

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 29 -->

SPRING DATA NEO4J + REDIS
Spring Data — Neo4j y Redis

Java

// Spring Data Neo4j
@Node("Person")
public class Person {
  @Id @GeneratedValue Long id;
  String name;

  @Relationship(type="KNOWS",
    direction=OUTGOING)
  List<Person> friends;
}

public interface PersonRepo
  extends Neo4jRepository<Person,Long>{

  @Query("MATCH (p:Person)"
    + "-[:KNOWS*1..3]->(f) "
    + "WHERE p.name = $name "
    + "RETURN DISTINCT f")
  List<Person> friendsUpTo3(
    @Param("name") String name);
}
// Spring Data Redis
@RedisHash("session")
public class UserSession {
  @Id String token;
  String userId;
  Long expiresAt;
}

public interface SessionRepo
  extends CrudRepository<
    UserSession, String> {}

// @Cacheable sobre MongoDB
@Service public class ProductSvc {

  @Cacheable(value="products",
             key="#id")
  public Product findById(String id){
    return repo.findById(id)
               .orElseThrow();
  }
  @CacheEvict(value="products",
              key="#p.id")
  public void update(Product p){
    repo.save(p);
  }
}

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 30 -->

NODE.JS · MONGOOSE
Mongoose — ODM para Node.js / TypeScript

JavaScript

Schema · Validación · Middleware · Population

const productSchema = new Schema({
  name: {
    type: String, required: true, trim: true
  },
  price:    { type: Number, min: 0 },
  category: {
    type: String,
    enum: ['electronics','clothing','food']
  },
  tags:   [String],
  seller: {
    type: Schema.Types.ObjectId,
    ref: 'Seller'  // para populate
  },
}, { timestamps: true }); // createdAt/updatedAt

// Middleware pre-save
productSchema.pre('save', function(next) {
  this.name = this.name.toUpperCase();
  next();
});

export const Product = model(
  'Product', productSchema);
// Query con populate
const products = await Product
  .find({ category: 'electronics' })
  .populate('seller', 'name email')
  .sort({ price: -1 })
  .limit(20)
  .lean(); // POJO, no doc mongoose

// Índices en el schema
productSchema.index({ category: 1, price: -1 });
productSchema.index({ name: 'text' });

// Virtual (no persistido)
productSchema.virtual('priceWithVAT')
  .get(function() {
    return this.price * 1.21;
  });

// Método estático
productSchema.statics.findByTag =
  function(tag) {
    return this.find({ tags: tag });
  };

// Uso
const results = await Product.findByTag(
  'wireless');

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 31 -->

PYTHON · MONGOENGINE
Python — MongoEngine ODM

Python

Define documentos MongoDB como clases Python

from mongoengine import *
import mongoengine

mongoengine.connect('ecommerce',
  host='localhost', port=27017)

class Seller(Document):
    name  = StringField(required=True)
    email = EmailField(unique=True)

class Product(Document):
    name = StringField(
        required=True, max_length=200)
    price = FloatField(min_value=0)
    category = StringField(
        choices=['electronics',
                 'clothing', 'food'])
    tags   = ListField(StringField())
    seller = ReferenceField(Seller)

    meta = {
        'collection': 'products',
        'indexes': [
            ('category', 'price'),
            {'fields': ['$name'],
             'default_language': 'spanish'}
        ]
    }
# Creación
seller = Seller(
    name='TechStore',
    email='tech@store.com'
).save()

Product(
    name='Laptop Pro',
    price=1299.99,
    category='electronics',
    tags=['laptop', 'pro'],
    seller=seller
).save()

# Consultas
electronics = Product.objects(
    category='electronics',
    price__lt=500
).order_by('-price')

# Con dereference automático
for p in electronics:
    print(p.name, p.seller.name)

# Aggregation
pipeline = [
    {'$group': {
      '_id': '$category',
      'avg': {'$avg': '$price'}
    }}
]
Product.objects.aggregate(pipeline)

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 32 -->

PYTHON · SQLALCHEMY
Python — SQLAlchemy 2.x

Python

El ORM de referencia en Python — relevante en contextos polyglot

from sqlalchemy import create_engine, Column
from sqlalchemy import Integer, String, Float
from sqlalchemy.orm import (DeclarativeBase,
     Session, mapped_column, Mapped)

class Base(DeclarativeBase): pass

class Product(Base):
    __tablename__ = 'products'
    id       : Mapped[int] = mapped_column(
                  Integer, primary_key=True)
    name     : Mapped[str] = mapped_column(
                  String(200))
    price    : Mapped[float]= mapped_column(
                  Float)
    category : Mapped[str] = mapped_column(
                  String(50))

engine = create_engine(
  "postgresql://user:pass@localhost/db",
  pool_size=10, max_overflow=20
)
Base.metadata.create_all(engine)
¿Por qué mencionamos SQLAlchemy?

En sistemas polyglot, es común que parte de los datos viva en una BD relacional (PostgreSQL, MySQL) mientras otro subconjunto va a NoSQL.

ORM → SQL
SQLAlchemy, Django ORM, Peewee
ODM → MongoDB
MongoEngine, pymongo directo
OGM → Neo4j
neomodel, py2neo

KV → Redis
redis-py (generalmente directo)
Tabular → Cassandra
cassandra-driver (directo, sin ORM)

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 33 -->

ANTI-PATRÓN
El problema N+1

El anti-patrón más común en ORMs y ODMs
# ❌ MAL — N+1 queries
orders = Order.objects.all()   # 1 query
for order in orders:           # N queries!
    print(order.customer.name) # lazy load
// ❌ MAL — Node.js / Mongoose
const orders = await Order.find();
for (const o of orders) {
  await o.populate('customer'); // N queries!
}

// ✅ BIEN — populate en la query
const orders = await Order
  .find().populate('customer'); // 2 queries
# ✅ BIEN — select_related / prefetch_related
orders = Order.objects.all().select_related(
    'customer'  # 1 JOIN, 1 query total
)

Regla: nunca llamar a un método de carga de relación dentro de un loop. Siempre cargar las relaciones necesarias en la query inicial.
Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 34 -->

CARGA DE RELACIONES
Lazy Loading vs Eager Loading

Cuándo cargar los datos relacionados

EAGER LOADING
LAZY LOADING
Objetos asociados cargados inmediatamente con el objeto principal.

Bueno cuando siempre necesitás los datos relacionados.

Riesgo: traer datos innecesarios si la relación raramente se usa.

En JPA: fetch = FetchType.EAGER
En Mongoose: .populate() en la query
Objetos relacionados cargados solo cuando se accede.

Eficiente en memoria. Útil cuando los datos relacionados son opcionales.

Riesgo: N+1 queries si se itera sobre colecciones.

En JPA: fetch = FetchType.LAZY (default para colecciones)
En Mongoose: no populate en la query

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 35 -->

PATRONES
Patrones de Acceso a Datos

Repository · DAO · Unit of Work — diferencias y usos

Repository
DAO
(Data Access Object)
Unit of Work
Simula una colección en memoria de objetos de dominio. El cliente no sabe si los datos vienen de una BD, caché o API. Abstracción de más alto nivel.
Interfaz de bajo nivel que encapsula CRUD directamente. Más cercano a la BD. El cliente sabe que habla con una BD.
Registra todos los cambios a objetos. Los confirma en un único commit o hace rollback total. Garantiza consistencia dentro de una operación.

Ej: Spring Data Repository, MongoRepository
Ej: JdbcDao, MongoDao custom
Ej: JPA EntityManager, Hibernate Session

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 36 -->

BLOQUE 04
Persistencia
Polimórfica

Polyglot · CQRS · Saga · Coherencia multi-motor

### Notes:

<!-- Slide number: 37 -->

POLYGLOT PERSISTENCE
Persistencia Polimórfica

Cada dato va al motor que mejor le sirve

Definición: un sistema usa múltiples motores de BD en simultáneo, seleccionando el óptimo para cada tipo de dato según sus características de acceso, consistencia y escala.

MongoDB
Redis
Neo4j
Cassandra

Datos de negocio
estructurados / semi-estruc.
Sesiones, caché,
colas, tiempo real
Relaciones, grafos,
recomendaciones
Series temporales,
eventos, alta escritura

Aplicación / Capa de servicio — coordina y garantiza coherencia entre motores
Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 38 -->

CASO DE ESTUDIO
Caso: E-Commerce Polyglot

Una sola operación, tres motores

// Python — Servicio de alta de orden
class OrderService:

  def __init__(self):
    self.mongo  = MongoClient()["shop"]
    self.redis  = Redis(decode_responses=True)
    self.neo4j  = GraphDatabase.driver(
        "bolt://localhost:7687",
        auth=("neo4j","pass"))

  def create_order(self,
                   customer_id, items):
    # 1. Validar sesión en Redis
    session = self.redis.hgetall(
        f"user:{customer_id}:session")
    if not session:
      raise Unauthorized()

    # 2. Persistir en MongoDB
    result = self.mongo.orders.insert_one({
        "customer_id": customer_id,
        "items": items,
        "status": "pending"
    })
    order_id = str(result.inserted_id)

    # 3. Actualizar grafo en Neo4j
    with self.neo4j.session() as neo:
      neo.execute_write(lambda tx: tx.run(
        "MATCH (c:Customer {id:$cid}) "
        "MERGE (o:Order {id:$oid}) "
        "CREATE (c)-[:PLACED]->(o)",
        cid=customer_id, oid=order_id
      ))
    return order_id
Flujo de la operación

Redis
Verificar sesión activa

MongoDB
Persistir orden (fuente de verdad)

Neo4j
Crear relación cliente → orden

¿Qué pasa si Neo4j falla? → Saga + compensación
Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 39 -->

COHERENCIA
El Problema de la Coherencia Multi-Motor

La BD no coordina — la aplicación debe hacerlo

En un sistema monomotor, el motor garantiza ACID. En persistencia polimórfica, no hay una transacción global. La aplicación es responsable de la coherencia entre motores.

Escribir en MongoDB

1
Fuente de verdad. Si falla → abortar y retornar error.

Actualizar Redis

2
Si falla → compensar: borrar el dato insertado en MongoDB.

Crear nodo Neo4j

3
Si falla → compensar: deshacer paso 1 y 2 o encolar para retry.

Confirmación total

4

Solo si los 3 pasos exitosos → responder éxito al cliente.
Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 40 -->

PATRÓN SAGA
Patrón Saga

Transacciones distribuidas sin 2-phase commit

Coreografiada
Orquestada
Cada servicio publica eventos. Otros servicios escuchan y reaccionan.

Descentralizado. Difícil de debuggear.
Los rollbacks son transacciones compensatorias.
Un orquestador central coordina los pasos y decide compensaciones.

Más fácil de rastrear y auditar.
Punto único de fallo (el orquestador).

Svc A → evento OrderCreated
Svc B escucha → evento InventoryReserved
Svc C escucha → evento PaymentProcessed
Si falla B → publica InventoryFailed
Svc A escucha → compensa (cancela orden)
Orquestador:
→ llama Svc A (MongoDB)
→ si OK: llama Svc B (Redis)
→ si OK: llama Svc C (Neo4j)
→ si falla C: compensa A y B

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 41 -->

CQRS
CQRS — Command Query Responsibility Segregation

Separar escritura y lectura para escalar independientemente

COMMAND  (Escritura)
QUERY  (Lectura)
Operaciones que modifican estado.
Van al motor optimizado para escritura.

Ejemplo:
→ Cassandra para eventos masivos
→ MongoDB para inserciones transaccionales
→ Redis para contadores en tiempo real
Operaciones de solo lectura.
Van al modelo de lectura optimizado.

Ejemplo:
→ Redis para dashboards en tiempo real
→ MongoDB con índices para búsquedas
→ Neo4j para recomendaciones de grafo

sync

La sincronización entre el modelo de escritura y el de lectura puede ser síncrona o asíncrona (event-driven). La consistencia eventual es aceptable en la mayoría de lecturas.
Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 42 -->

ERRORES COMUNES
Errores Conceptuales Frecuentes

✘  ORM es lo mismo que ODM
ORM mapea objetos ↔ tablas relacionales. ODM mapea objetos ↔ documentos. El modelo subyacente es diferente.

✘  Lazy loading siempre es mejor
Lazy loading en loops genera el N+1 problem. Cada caso requiere análisis. A veces Eager es la respuesta correcta.

✘  Redis reemplaza a MongoDB
Redis es para datos operativos en memoria. No reemplaza al motor documental para datos persistentes y consultables con queries complejas.

✘  La BD garantiza coherencia en polyglot

En persistencia polimórfica, la coherencia entre motores es responsabilidad de la aplicación. Diseñar para fallos parciales.

✘  Cassandra soporta queries ad-hoc como MongoDB
Cassandra requiere que el modelo se diseñe para las queries esperadas. No soporta queries flexibles como MongoDB.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 43 -->

COMPARATIVA
Cuadro Comparativo — Frameworks y Lenguajes

| Framework / Lib | Lenguaje | Motor | Nivel | Cuándo usarlo |
| --- | --- | --- | --- | --- |
| Spring Data MongoDB | Java/Kotlin | MongoDB | Alto | Microservicios Java empresariales |
| Mongoose | JS/TS | MongoDB | Medio | APIs Node.js / Express / Fastify |
| MongoEngine | Python | MongoDB | Medio | Modelos Django-like en Python |
| pymongo | Python | MongoDB | Bajo | Control fino, scripts, ETL |
| motor | Python | MongoDB | Bajo | FastAPI / aiohttp async |
| Spring Data Neo4j | Java/Kotlin | Neo4j | Alto | Grafos en apps Spring |
| neomodel | Python | Neo4j | Medio | OGM declarativo estilo Django |
| Spring Data Redis | Java/Kotlin | Redis | Alto | Caché y sesiones Spring Boot |
| redis-py | Python | Redis | Bajo | Scripts, microservices Python |
| ioredis | JS/TS | Redis | Bajo | Node.js, clusters, Pub/Sub |
| Spring Data Cassandra | Java/Kotlin | Cassandra | Alto | Series temporales Java |
| cassandra-driver | Py/JS | Cassandra | Bajo | Control total, alt. performance |

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 44 -->

PREGUNTA DISPARADORA
¿Cuándo elegirías pymongo
directo en lugar de MongoEngine?

Complejidad del dominio
Tamaño del equipo
¿Tus documentos tienen muchas reglas de validación?
¿Necesitás estandarizar accesos entre varios devs?

Tipo de queries
Performance crítica
¿Usás aggregations complejas o Atlas Search?
¿El overhead del ODM impacta en tu latencia?

### Notes:

<!-- Slide number: 45 -->

BUENAS PRÁCTICAS
Testing de la Capa de Persistencia

Estrategias por lenguaje

Testcontainers (Java)
@DataMongoTest (Java/Spring)

Levanta contenedores Docker reales durante el test. Alta fidelidad.
Spring Boot carga solo el slice de MongoDB. Más rápido que contexto completo.
JUnit 5 + @Testcontainers + @Container
Testcontainers o Flapdoodle (MongoDB embebido)

mongomock (Python)
fakeredis (Python)
Implementación in-memory de MongoDB para tests unitarios. Sin Docker.
Implementación in-memory de Redis. Tests ultrarrápidos sin servidor real.
pip install mongomock — para pymongo y MongoEngine
pip install fakeredis — funciona con redis-py

MongoDB Memory Server (Node)
Repository Mocking (todos)
Instancia MongoDB in-process para Jest. Sin Docker.
Mockear el Repository con unittest.mock / Mockito / jest.mock. Solo testea lógica.
npm i mongodb-memory-server — para Mongoose o driver nativo
No toca BD. Ideal para unit tests de servicios

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 46 -->

MICROSERVICIOS
Database per Service

Cada microservicio dueño de sus propios datos

Principio: en arquitecturas de microservicios, ningún servicio comparte su BD con otro. Cada servicio elige el motor más adecuado para su dominio y escala independientemente.

User Service
Product Service
Session Service
Graph Service
Events Service

PostgreSQL
(relacional)
MongoDB
(documentos)
Redis
(clave/valor)
Neo4j
(grafos)
Cassandra
(tabular)

Java + JPA
Python + pymongo
Node + ioredis
Python + neo4j
Java + DataStax

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 47 -->

BIBLIOGRAFÍA
Bibliografía y Recursos

Obligatoria
Harrison, G. (2015). Next Generation Databases. Apress. — Cap. 11–12: Polyglot Persistence & Access Patterns

Pivert, O. (Ed.). (2018). NoSQL Data Models. ISTE. — Cap. 6: Frameworks and Object Mapping

Fowler, M. (2002). Patterns of Enterprise Application Architecture. Addison-Wesley. — Repository, Unit of Work, Data Mapper

Documentación oficial
Spring Data:          https://docs.spring.io/spring-data/

pymongo:              https://pymongo.readthedocs.io/

motor (async):        https://motor.readthedocs.io/

Mongoose:             https://mongoosejs.com/docs/

neo4j-driver (Py/JS): https://neo4j.com/docs/drivers-apis/

redis-py:             https://redis-py.readthedocs.io/

ioredis:              https://github.com/redis/ioredis

cassandra-driver:     https://docs.datastax.com/en/developer/

Complementaria
Richardson, C. (2018). Microservices Patterns. Manning. — Saga, CQRS, Event Sourcing, Database per Service

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 48 -->

GUÍA DE DECISIÓN
¿Cómo elegir el framework correcto?

| Situación / Necesidad | Motor | Framework sugerido | Lenguaje |
| --- | --- | --- | --- |
| API REST Java + lógica compleja | MongoDB | Spring Data MongoDB | Java |
| API Node.js, startup rápido | MongoDB | Mongoose | JS/TS |
| Microservicio Python + FastAPI | MongoDB | motor (async) o pymongo | Python |
| Modelos estilo Django en Python | MongoDB | MongoEngine | Python |
| Grafo de relaciones en Java | Neo4j | Spring Data Neo4j | Java |
| Grafo declarativo en Python | Neo4j | neomodel | Python |
| Caché y sesiones Spring Boot | Redis | Spring Data Redis + @Cacheable | Java |
| Redis en Python async | Redis | redis-py + aioredis | Python |
| Redis en Node.js con Pub/Sub | Redis | ioredis | JS/TS |
| Series temporales / IoT Java | Cassandra | Spring Data Cassandra | Java |
| Control total / alta perf. | Cualquiera | Driver nativo oficial | Cualquiera |

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 49 -->

SÍNTESIS DE CLASE
3 Ideas que
no podés olvidar

01
El driver es el piso mínimo. ORM/ODM agrega productividad a cambio de abstracción. Elegí según la complejidad del dominio y el tamaño del equipo.

02
En persistencia polimórfica, la coherencia entre motores es responsabilidad de la aplicación. Diseñá para los fallos parciales con Saga desde el inicio.

03
Python, Java y Node.js tienen ecosistemas maduros para todos los motores NoSQL. El lenguaje no limita la elección de base de datos.
Próxima clase → Persistencia polimórfica aplicada · TP Integrador 2.ª Entrega

### Notes: