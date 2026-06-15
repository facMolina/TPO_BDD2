# 02 — MongoDB — Defensa Oral

⭐⭐ Es uno de los 3 motores. Probabilidad alta de pregunta práctica (te pide hacer una query) o teórica (por qué Mongo y no Cassandra para X).

---

## PARTE 1 — Resumen conceptual

### ¿Qué es MongoDB?

> "MongoDB es la **base de datos documental líder del mercado**. Almacena datos en **documentos BSON** (Binary JSON) dentro de **colecciones**. No tiene esquema fijo: cada documento puede tener campos distintos. Es lo opuesto al modelo relacional, donde el esquema se valida en escritura — en Mongo se valida en lectura (schema-on-read)."

### Conceptos clave

| Concepto SQL | Equivalente MongoDB |
|---|---|
| Base de datos | Base de datos |
| Tabla | Colección |
| Fila | Documento (BSON) |
| Columna | Campo |
| Primary Key | `_id` (`ObjectId` autogenerado) |
| JOIN | `$lookup` (en pipeline) |
| GROUP BY | `$group` (en pipeline) |

### Características técnicas

- **Motor de almacenamiento**: WiredTiger (desde v3.2). Concurrencia a nivel documento, no a nivel colección.
- **Replicación**: Replica Set (1 Primary + N Secondaries). Failover automático con elección Raft-like.
- **Sharding**: distribución horizontal con shard key. Componentes: `mongos` (router) + `config servers` + shards.
- **Transacciones ACID multi-documento**: desde v4.0 (replica set) y v4.2 (sharded).
- **CAP**: **CP** por default (con `w:majority` y `readConcern:majority`). Puede comportarse como AP con `w:1`.
- **Límite de documento**: 16 MB. Para archivos más grandes → GridFS.

### Modelado: Embedding vs Referencing

⭐ Esta es **la decisión de diseño más importante en MongoDB**.

| Embedding | Referencing |
|---|---|
| Sub-documento dentro del documento padre | Clave foránea manual + `$lookup` |
| ✅ Un solo acceso a disco | ✅ Sin duplicación |
| ✅ Sin JOIN | ✅ Documentos más chicos |
| ⚠️ Puede superar 16 MB si crece sin límite | ⚠️ Requiere `$lookup` |
| ⚠️ Duplicación si la sub-entidad es compartida | ⚠️ 2+ accesos a disco |

**Regla de oro**:
- "¿Los datos siempre se leen juntos?" → embed.
- "¿La sub-entidad se actualiza independientemente?" → reference.
- "¿La sub-entidad es compartida por muchos documentos?" → reference (evita duplicación).
- "¿El array puede crecer sin límite?" → reference (riesgo de pasar 16 MB).

### En nuestro TP

| Colección | Modelado | Por qué |
|---|---|---|
| `artists` | datos planos + array `genres` | El artista es la unidad, género se lee siempre |
| `albums` | referencia a `artist_id` | El álbum se consulta independiente |
| `songs` | array `genres` + ref a artist | Géneros son pocos, artist es compartido |
| `plays` | doc por evento, ref a song/user | El evento es independiente |
| `playlists` | array de `songs` ref | Lista puede crecer |

---

## PARTE 2 — Q&A para la defensa

### ⭐ Q1: ¿Por qué MongoDB para el catálogo y no Cassandra?

**Respuesta corta**:
> "MongoDB soporta consultas ad-hoc por cualquier campo (búsqueda de artistas por nombre, álbumes por año, canciones por género). Cassandra requiere modelar una tabla por query — para un catálogo navegable con filtros variables, MongoDB es mucho más natural."

💡 **Si repregunta**:
> "Además, el catálogo no tiene volumen de escritura masivo: 80 artistas, 564 canciones. Cassandra es overkill. Su fortaleza es la escritura masiva distribuida, no el catálogo maestro. La latencia de lectura de Mongo (≈5ms con índice) es perfectamente adecuada para mostrar la página de un artista."

### ⭐ Q2: ¿Por qué MongoDB y no PostgreSQL?

**Respuesta corta**:
> "Los datos del catálogo son **semi-estructurados**: un artista tiene géneros (array), una canción tiene metadatos variables (bpm, duración, popularity). Forzar esto en tablas relacionales requeriría tablas auxiliares y JOINs. En MongoDB es un documento natural."

💡 **Si repregunta** (esquema flexible):
> "Si mañana queremos agregar el campo `spotify_uri` a algunas canciones, en Mongo se hace sin migración. En PostgreSQL requiere `ALTER TABLE` con downtime. **schema-on-read** vs **schema-on-write**."

### Q3: ¿MongoDB tiene transacciones?

**Respuesta corta**:
> "Sí, desde la versión 4.0 (2018) soporta transacciones ACID multi-documento. Antes era ACID solo por documento. Hoy se pueden agrupar varias operaciones en una transacción con `client.startSession()` + `session.startTransaction()`."

⚠️ **Trampa**: si te preguntan "¿usaron transacciones en el TP?", la respuesta correcta es **no las usamos** porque para el dominio de streaming no son necesarias (eventual consistency entre motores es aceptable).

### Q4: ¿Qué es el Aggregation Pipeline?

**Respuesta corta**:
> "Es el motor de consultas analíticas y transformaciones de MongoDB. Funciona como una pipeline: la salida de cada etapa es la entrada de la siguiente. Las etapas más usadas son `$match`, `$lookup`, `$group`, `$sort`, `$project`, `$unwind`."

💡 **Si repregunta** (performance):
> "Poner `$match` al inicio es crítico — permite que la pipeline use índices y reduzca los documentos procesados por las etapas siguientes."

### Q5 (TP1 corregida): ¿Qué hace tu query 4b?

**Respuesta**:
> "Devuelve el historial de la última semana **agrupado por artista Y género simultáneamente**. En el TP1 nos equivocamos: agrupábamos solo por artista. La corrección es agrupar por `{ artista: ..., genero: ... }` en el mismo `$group`. Esto significa que un artista que toca dos géneros aparece dos veces, una por cada género."

### Q6: ¿Qué es el ObjectId?

**Respuesta corta**:
> "Es el ID por default que asigna MongoDB. 12 bytes: 4 de timestamp Unix + 5 de ID del proceso/host + 3 de contador aleatorio. **Globalmente único, ordenado cronológicamente, sin coordinación central**."

### Q7: ¿Qué es WiredTiger?

**Respuesta corta**:
> "Es el motor de almacenamiento por default desde MongoDB 3.2. Reemplazó al MMAPv1. Características: compresión (Snappy), concurrencia a nivel documento (no de colección como antes), transacciones ACID."

### Q8: ¿Cómo funciona el sharding?

**Respuesta corta**:
> "Distribuye una colección entre múltiples nodos (shards) usando una **shard key**. El cliente nunca habla con los shards directamente — habla con `mongos` (router), que consulta los **Config Servers** para saber qué chunk está en qué shard."

💡 **Criterios para la shard key**:
- Alta cardinalidad (muchos valores únicos)
- Baja frecuencia (no hay un valor que se repita mucho)
- No monótona (no usar ObjectId crudo o timestamp como shard key → todo va al último shard)

### ⭐ Q9: ¿MongoDB es CP o AP?

**Respuesta corta**:
> "Es **CP por default** con `w:majority`. Frente a partición de red, el primary rechaza escrituras si no puede confirmar a la mayoría del replica set. Se puede configurar como AP con `w:1`."

### Q10: ¿Qué es la "Schema-on-Read" en MongoDB?

**Respuesta corta**:
> "MongoDB acepta cualquier documento sin validar estructura al insertar. La aplicación es responsable de interpretar los documentos al leerlos. Esto se llama **schema-on-read**. Es opuesto a SQL que es **schema-on-write**."

💡 **No es caos**: en producción se usan `$jsonSchema` validators para definir un esquema implícito sin perder flexibilidad.

---

## PARTE 3 — Queries prácticas

### 3.1 Queries del dominio del TP

📝 **Top 10 canciones más reproducidas en las últimas 24h** (Req 4a):

```javascript
db.plays.aggregate([
  { $match: { timestamp: { $gte: new Date(Date.now() - 24*60*60*1000) } } },
  { $group: { _id: "$song_id", reproducciones: { $sum: 1 } } },
  { $sort: { reproducciones: -1 } },
  { $limit: 10 },
  { $lookup: { from: "songs", localField: "_id", foreignField: "song_id", as: "song" } },
  { $unwind: "$song" },
  { $project: { _id: 0, cancion: "$song.title", artista: "$song.artist_name", reproducciones: 1 } }
])
```

📝 **Historial semanal agrupado por artista Y género** (Req 4b — CORREGIDO):

```javascript
db.plays.aggregate([
  { $match: { user_id: "User_1", timestamp: { $gte: new Date(Date.now() - 7*24*60*60*1000) } } },
  { $lookup: { from: "songs", localField: "song_id", foreignField: "song_id", as: "song" } },
  { $unwind: "$song" },
  { $group: {
      _id: {
        artista: "$song.artist_name",
        genero: { $arrayElemAt: ["$song.genres", 0] }
      },
      reproducciones: { $sum: 1 }
  }},
  { $sort: { reproducciones: -1 } }
])
```

⭐ **Clave aquí**: el `$group` agrupa por **un objeto con dos campos** simultáneamente. Esto era lo que fallaba en el TP1.

📝 **Canciones con alta reproducción y baja completitud** (Req 4c):

```javascript
db.plays.aggregate([
  { $group: {
      _id: "$song_id",
      total: { $sum: 1 },
      completadas: { $sum: { $cond: ["$completed", 1, 0] } }
  }},
  { $addFields: { completitud: { $divide: ["$completadas", "$total"] } } },
  { $match: { total: { $gte: 100 }, completitud: { $lt: 0.5 } } },
  { $sort: { total: -1 } }
])
```

### 3.2 Queries "tipo profe" — casos genéricos

📝 **CRUD básico — colección `productos`**:

```javascript
// Insertar uno
db.productos.insertOne({
  nombre: "Laptop",
  precio: 1200,
  stock: 50,
  categorias: ["electronica", "computacion"]
})

// Insertar varios
db.productos.insertMany([
  { nombre: "Mouse", precio: 25, stock: 200 },
  { nombre: "Teclado", precio: 45, stock: 150 }
])

// Buscar
db.productos.find({ precio: { $gt: 100 } })
db.productos.find({ stock: { $gt: 0 }, precio: { $lt: 200 } })
db.productos.find({ categorias: "electronica" })  // elemento en array

// Actualizar
db.productos.updateOne(
  { nombre: "Laptop" },
  { $set: { precio: 1100 }, $inc: { stock: -1 } }
)

// Eliminar
db.productos.deleteOne({ nombre: "Mouse" })
db.productos.deleteMany({ stock: { $lte: 0 } })
```

📝 **Pipeline de ventas**:

```javascript
db.ventas.aggregate([
  { $match: { anio: 2026, estado: "completada" } },
  { $unwind: "$productos" },
  { $group: {
      _id: "$productos.categoria",
      total_ventas: { $sum: "$productos.precio" },
      cantidad: { $count: {} }
  }},
  { $sort: { total_ventas: -1 } },
  { $limit: 10 }
])
```

📝 **`$lookup` (JOIN) entre pedidos y clientes**:

```javascript
db.pedidos.aggregate([
  { $lookup: {
      from: "clientes",
      localField: "cliente_id",
      foreignField: "_id",
      as: "datos_cliente"
  }},
  { $unwind: "$datos_cliente" }
])
```

📝 **Índices**:

```javascript
db.productos.createIndex({ nombre: 1 })           // ascendente
db.productos.createIndex({ precio: -1 })          // descendente
db.productos.createIndex({ categoria: 1, precio: -1 })  // compuesto
db.productos.createIndex({ email: 1 }, { unique: true })
db.productos.createIndex({ descripcion: "text" }) // full-text

db.productos.getIndexes()
db.productos.find({ nombre: "Laptop" }).explain("executionStats")  // ver si usa IXSCAN
```

### 3.3 Operadores que tenés que recordar de memoria

| Operador | Uso |
|---|---|
| `$eq` / `$ne` | igual / distinto |
| `$gt` / `$gte` / `$lt` / `$lte` | comparaciones |
| `$in` / `$nin` | en lista / no en lista |
| `$and` / `$or` / `$not` | lógicos |
| `$exists` | el campo existe |
| `$regex` | regex |
| `$set` | asignar en update |
| `$inc` | incrementar |
| `$push` / `$pull` | agregar/quitar de array |
| `$addToSet` | agregar a array sin duplicar |

---

## PARTE 4 — Errores conceptuales a NO cometer

⚠️ **NO decir**: "MongoDB no tiene transacciones."
✅ **Correcto**: "MongoDB soporta transacciones ACID multi-documento desde la v4.0 (2018), pero con costo de rendimiento."

⚠️ **NO decir**: "Una colección es exactamente igual a una tabla SQL."
✅ **Correcto**: "La analogía sirve para empezar, pero una colección **no impone esquema** — los documentos pueden ser distintos."

⚠️ **NO decir**: "Schema-less = sin estructura."
✅ **Correcto**: "Schema-less significa que el esquema lo gestiona la aplicación. En producción se usan `$jsonSchema` validators."

⚠️ **NO decir**: "deleteMany({}) borra la colección."
✅ **Correcto**: "`deleteMany({})` vacía la colección pero la mantiene con sus índices. `drop()` la elimina completamente."

⚠️ **NO decir**: "updateOne reemplaza el documento."
✅ **Correcto**: "`updateOne` con operadores ($set, $inc) modifica campos. `replaceOne` reemplaza el documento completo."

---

## PARTE 5 — Comparativa rápida con los otros motores

| | MongoDB | Neo4j | Cassandra |
|---|---|---|---|
| Modelo | Documento BSON | Grafo | Tabular column-family |
| Esquema | Flexible (schema-on-read) | Flexible (sin esquema) | Por tabla, flexible por fila |
| Consultas ad-hoc | ✅ Excelente | ✅ via Cypher | ❌ requiere modelar por query |
| Relaciones profundas | ❌ `$lookup` no escala | ✅ index-free adjacency | ❌ no soporta JOINs |
| Escritura masiva | Media | Baja | ✅ Excelente |
| CAP | CP (default) | CP standalone | AP |
| Caso ideal | Catálogos, CMS, contenido | Redes, recomendaciones | Series temporales, eventos |
