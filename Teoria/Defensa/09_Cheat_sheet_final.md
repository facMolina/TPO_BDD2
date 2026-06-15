# 09 — Cheat Sheet Final (para el día de la defensa)

⭐⭐⭐ **Imprimí esta página o leela en el celular antes de entrar.** Es lo mínimo indispensable.

---

## 🎯 Primer minuto — Cómo arrancar si te toca explicar el TP

> "Buenas. Nuestro TP es una **plataforma de streaming musical** que implementa **persistencia poliglota** con 3 motores NoSQL en Node.js:
>
> - **MongoDB Atlas** → catálogo maestro (artistas, álbumes, canciones, playlists).
> - **Neo4j AuraDB** → red de colaboraciones entre artistas y recomendaciones.
> - **DataStax Astra (Cassandra)** → eventos de reproducción masivos, métricas horarias y charts diarios.
>
> La app expone un menú interactivo con 5 operaciones (OP-1 a OP-5). Cada operación coordina varios motores según el caso de uso. Hay un archivo `config.js` que lee las credenciales del `.env` y mantiene un pool de conexiones a los 3 motores."

---

## 🔑 Las 3 frases que tenés que memorizar

1. **¿Por qué 3 motores?**
   > "Porque el dominio tiene **3 naturalezas de datos** diferentes: datos maestros estructurados (Mongo), red de relaciones (Neo4j) y eventos masivos de escritura (Cassandra). Ningún motor por sí solo cubre los 3 casos eficientemente."

2. **CAP de cada motor**
   > "**MongoDB es CP** con `w:majority`. **Neo4j es CP**. **Cassandra es AP** — prioriza Availability y tolera consistencia eventual, configurable por operación con W+R>N."

3. **Coherencia entre motores**
   > "Aceptamos **consistencia eventual entre motores**. Cassandra es la escritura crítica. MongoDB se actualiza con umbral (no por cada evento). Neo4j no participa en OP-2 porque las relaciones son estables. Si falla un motor secundario → mensaje de error, no abortamos."

---

## ⭐ Las 5 operaciones — formato resumen

| Op | Motores | Flujo | Por qué |
|---|---|---|---|
| **OP-1** | C → N → M | Secuencial | Cada paso depende del anterior |
| **OP-2** | C + M (Neo4j NO) | C primero, M condicional | Eventos van a Cassandra; Mongo es best-effort |
| **OP-3** | M ‖ N | Paralelo | Consultas independientes |
| **OP-4** | C → M | Secuencial | Mongo necesita los IDs de C |
| **OP-5** | C ‖ M ‖ N | Paralelo | Las 3 consultas son independientes |

---

## 🔥 Las 5 preguntas teóricas más probables

### 1. ¿Por qué Cassandra y no MongoDB para los eventos?
> Volumen + arquitectura. 4.600 writes/s sostenidas. Mongo es CP (latencia por consistencia). Cassandra es AP peer-to-peer, sin coordinador central, append-only LSM-Tree.

### 2. ¿Por qué MongoDB para el catálogo y no Cassandra?
> Queries ad-hoc por filtros variables. Cassandra es query-first (una tabla por query) — no escala para 10+ patrones de búsqueda. Mongo soporta filtros por cualquier campo con índices.

### 3. ¿Por qué Neo4j para las colaboraciones?
> Index-free adjacency: O(1) por salto independientemente del tamaño del grafo. En Mongo serían 3+ `$lookup` encadenados → degrada exponencialmente.

### 4. ¿Por qué Neo4j NO participa en OP-2?
> Las relaciones estructurales entre artistas son estables. Un evento de reproducción individual no las modifica. Escribir 400M veces/día sería prohibitivo sin beneficio.

### 5. ¿Qué pasa si falla un motor?
> Depende: Cassandra crítica → si falla en OP-2, abortamos. Mongo best-effort → si falla, el evento ya quedó en C, aceptamos divergencia eventual. Si Neo4j cae, OP-3 y OP-5 degradan pero OP-2 funciona.

---

## 💻 Queries que tenés que poder escribir DE MEMORIA

### Cassandra — El ejemplo del compañero

```cql
CREATE TABLE eventos (
  organismo_id  TEXT,
  evento_ts     TIMESTAMP,
  estado        TEXT,
  PRIMARY KEY ((organismo_id), evento_ts)
) WITH CLUSTERING ORDER BY (evento_ts DESC);

INSERT INTO eventos (organismo_id, evento_ts, estado)
VALUES ('municipio_001', toTimestamp(now()), 'activo');

SELECT * FROM eventos WHERE organismo_id = 'municipio_001';
```

### Cassandra — COUNTER (chart en tiempo real)

```cql
UPDATE chart_counters
SET reproducciones = reproducciones + 1
WHERE pais = 'AR' AND fecha = '2026-06-15' AND cancion_id = 'X::Y';
```

### MongoDB — Pipeline básico

```javascript
db.plays.aggregate([
  { $match: { timestamp: { $gte: ISODate('2026-06-08') } } },
  { $group: { _id: '$song_id', total: { $sum: 1 } } },
  { $sort: { total: -1 } },
  { $limit: 10 }
])
```

### MongoDB — Update con operadores

```javascript
db.productos.updateOne(
  { nombre: 'Laptop' },
  { $set: { precio: 1100 }, $inc: { stock: -1 } }
)
```

### Neo4j — Crear + traversal

```cypher
CREATE (ana:Person {name:'Ana'}), (luis:Person {name:'Luis'})
CREATE (ana)-[:AMIGA_DE]->(luis)

MATCH (ana:Person {name:'Ana'})-[:AMIGA_DE*2]->(fof:Person)
RETURN DISTINCT fof.name
```

### Neo4j — Camino más corto

```cypher
MATCH p = shortestPath(
  (a:Person {name:'Ana'})-[:CONOCE*]-(b:Person {name:'Pedro'})
)
RETURN p, length(p)
```

---

## 📋 Tabla maestra — Memorizá esto

| | MongoDB | Neo4j | Cassandra |
|---|---|---|---|
| Modelo | Documento BSON | Grafo (Property Graph) | Wide Column |
| Lenguaje | MQL + Aggregation | Cypher | CQL |
| CAP | **CP** | **CP** | **AP** |
| ACID | Multi-doc (v4+) | Completo | LWT por partición |
| Esquema | Schema-on-read | Schema-optional | Por tabla |
| JOINs | `$lookup` | Traversal nativo | NO |
| Latencia típica | ~5ms | ~15ms (3 saltos) | ~10ms |
| Write throughput | Medio | Bajo | **Excelente** |
| Replicación | Master-Slave (RS) | Master-Slave (Raft) | **Peer-to-Peer** |
| Sharding | Shard key | Limitado | **Consistent Hashing nativo** |
| Caso ideal | Catálogos | Redes, recomendaciones | Eventos, time-series |

---

## 🧠 CAP — La fórmula que tenés que recordar

### Cassandra Tunable Consistency

```
W + R > N
```

| RF | W | R | Resultado |
|---|---|---|---|
| 3 | QUORUM (2) | QUORUM (2) | ✅ **Fuerte (recomendado)** |
| 3 | ONE (1) | ONE (1) | ❌ Eventual |

### MongoDB Write/Read Concern

- **w:0** = fire & forget
- **w:1** = solo Primary (default)
- **w:majority** = mayoría del RS (CP)
- **readConcern:linearizable** = sin datos stale

---

## ⚠️ Errores a NO cometer en la defensa

| ❌ NO digas | ✅ Decí |
|---|---|
| "Mongo no tiene transacciones" | "Mongo tiene transacciones ACID multi-doc desde v4.0" |
| "Cassandra es como Mongo pero distribuido" | "Cassandra es wide-column query-first, sin JOINs" |
| "Las relaciones en grafo son como FK" | "Las relaciones son estructuras físicas con punteros" |
| "Schema-less = sin estructura" | "Schema-less = esquema implícito gestionado por la app" |
| "NoSQL reemplaza a SQL" | "NoSQL complementa. Coexisten" |
| "CAP dice elegí 2 de 3 siempre" | "CAP dice: bajo partición, no podés tener C y A simultáneamente" |
| "deleteMany({}) borra la colección" | "deleteMany({}) vacía pero mantiene índices. drop() la elimina" |
| "DELETE nodo elimina relaciones" | "DELETE falla con relaciones. DETACH DELETE las elimina también" |
| "ALLOW FILTERING está bien" | "ALLOW FILTERING es full-scan, anti-pattern en producción" |

---

## 🎓 Si te bloqueás — qué hacer

1. **Tomate 2 segundos**. Está bien pensar antes de responder.
2. **Razoná en voz alta**. Aunque no sepas la respuesta exacta, mostrá que entendés los principios.
3. **Conectá con el TP**. Si te preguntan algo general, decí cómo se aplica al TP.
4. **Si no sabés, no inventes**. Decí: "No lo abordamos así en el TP, pero supongo que sería..." y razoná.
5. **Usá las frases memorizadas**. "Index-free adjacency", "Query-first design", "Consistencia tunable", "Peer-to-peer sin coordinador".

---

## 🎯 Para el día de la defensa

**Material que tenés que llevar:**
- ✅ Computadora con la app funcionando (asegurate que Neo4j esté **RUNNING**, se pausa por inactividad)
- ✅ Acceso a mongosh, neo4j Browser, cqlsh
- ✅ Conexión a internet
- ✅ Este cheat sheet impreso o en el celular

**Antes de entrar:**
1. **Reactivar Neo4j AuraDB** en console.neo4j.io (se pausa después de 3 días)
2. Probar `node app/index.js` y correr OP-1 con `User_1` → ver que funciona
3. Tener abierta la documentación de la app en otro tab por si hay que mostrar código

**Durante la defensa:**
- Hablá pausado.
- Mostrá la app funcionando si te lo piden.
- Si te piden una query, escribila en el cliente del motor (no en la app).
- Si la respuesta corta no convence al profe, ofrecé la explicación larga: "Si querés profundizo en..."

---

## 🚀 Frases de cierre que dejan buena impresión

- "**La complejidad de 3 motores es real. La aceptamos porque el dominio lo justifica.**"
- "**La persistencia poliglota no es una decisión arbitraria — es la única arquitectura que cubre todos los casos de uso eficientemente.**"
- "**Cada motor está donde estructuralmente brilla.**"
- "**Eventual consistency es una elección consciente, no un defecto.**"
- "**No hay un motor universalmente superior. Hay motores adecuados para cada problema.**"

---

## ✊ ¡Suerte!

> Si te pasa algo que no esperabas, **respirá**. El profe está más interesado en cómo pensás que en si sabés la respuesta exacta. Mostrá criterio: por qué tomaron tal decisión, qué trade-offs aceptaron, qué pasaría si fuera distinto.
