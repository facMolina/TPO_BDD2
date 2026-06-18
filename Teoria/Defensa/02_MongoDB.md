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
  - 💡 **CP** = **C**onsistency + **P**artition tolerance. Bajo partición de red, MongoDB **prefiere rechazar escrituras** antes que devolver datos inconsistentes. El Primary del Replica Set deja de aceptar writes si no puede confirmar a la mayoría.
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

### 🔍 Cómo probar las queries en MongoDB Atlas

⚠️ **Aclaración importante**: MongoDB Atlas Free Tier (M0) **NO tiene un shell `mongosh` embebido en el navegador**, a diferencia de Neo4j Workspace o Astra CQL Console. Esa opción se removió en versiones recientes de Atlas para planes gratuitos. **La opción más cercana a un "shell web" es el editor de Aggregations**.

| Lugar en Atlas | ¿Sirve? | Notas |
|---|---|---|
| **Browse Collections → tab `Aggregations`** | ✅ Sí — **es lo que vas a usar** | Pegás SOLO el array `[...]`, no acepta `new Date(...)` (hay que poner fechas literales) |
| **Browse Collections → tab `Find`** | ✅ Para queries simples | Solo equivale a un `find({...})`, sin pipeline |
| **MongoDB Charts** | ❌ NO — solo para gráficos | No es consola |
| **Atlas SQL Interface** | ❌ NO — para consultas SQL desde BI | Otra cosa |

#### Cómo usar el editor de Aggregations (el "shell web" de MongoDB)

1. Entrá a **[cloud.mongodb.com](https://cloud.mongodb.com)**.
2. **Project** del grupo → **Database** (panel izquierdo) → click en `Cluster0`.
3. Botón **`Browse Collections`**.
4. Panel izquierdo: elegí la DB `ing-datos-II` y la colección que necesites (`plays`, `songs`, `artists`, etc.).
5. Arriba a la derecha: tab **`Aggregations`** (al lado de `Documents` y `Schema`).
6. Ahí podés:
   - Armar el pipeline **etapa por etapa** con el botón **`Add Stage`** y elegir el operador (`$match`, `$group`, etc.) — Atlas te ayuda con autocompletado.
   - O click en **`Text View`** (ícono `</>`) y **pegar todo el array de una**.

#### Reglas para pegar las queries del archivo en el editor Aggregations

**Las queries de este archivo están escritas para `mongosh`** (`db.plays.aggregate([...])`). Para usarlas en el editor de Atlas hay que hacer **2 ajustes**:

**Ajuste 1 — Quitá el wrapper `db.col.aggregate(...)`** y pegá solo el array:

❌ NO funciona en el editor:
```javascript
db.plays.aggregate([
  { $match: {...} },
  { $group: {...} }
])
```

✅ Sí funciona:
```javascript
[
  { $match: {...} },
  { $group: {...} }
]
```

**Ajuste 2 — Reemplazá expresiones JavaScript de fechas por fechas literales** con `ISODate("...")`:

❌ NO funciona (es JavaScript dinámico):
```javascript
{ $match: { timestamp: { $gte: new Date(Date.now() - 24*60*60*1000) } } }
```

✅ Sí funciona (fecha hardcodeada):
```javascript
{ $match: { timestamp: { $gte: ISODate("2026-06-16T00:00:00Z") } } }
```

> 💡 **Truco rápido**: si querés "últimas 24h" hardcodeado, calculá la fecha de ayer a la misma hora y poné el ISODate. Para el día de la defensa: usá una fecha conocida con datos (ej: el día que cargaste eventos en Cassandra para no quedarte con queries vacías).

#### Si querés un shell `mongosh` real

Como en Atlas Free no está disponible en web, las opciones son:

- **MongoDB Compass** (cliente de escritorio, gratis): bajalo de [mongodb.com/products/compass](https://www.mongodb.com/products/compass) → conectás con la `MONGO_URI` del `.env`. Tiene un tab **`MONGOSH`** integrado en la parte inferior donde **sí podés pegar las queries tal cual** del archivo.
- **`mongosh` local** (si tenés Node.js):
  ```bash
  npm install -g mongosh
  mongosh "mongodb+srv://facmolina_db_user:<pass>@cluster0.qam1hkd.mongodb.net/ing-datos-II"
  ```

> ⭐ **Recomendación para la defensa**: instalá Compass. Tiene el editor visual de Aggregations **y** el shell `mongosh` integrado abajo. Es lo mejor de los dos mundos. Si en la defensa te piden ejecutar una query, abrís Compass y tirás `db.songs.find({artist_name: "The Weeknd"})` desde el shell.

---

### 📝 Anatomía de una query en MongoDB

Antes de mirar las queries, entendé **cómo se arman**. MongoDB tiene dos lenguajes superpuestos:

#### A) MQL (MongoDB Query Language) — para CRUD simple

```javascript
db.<coleccion>.<metodo>( <filtro>, <opciones> )
```

- `<coleccion>` → la colección sobre la que operás (ej: `productos`, `plays`, `songs`).
- `<metodo>` → `find`, `insertOne`, `updateOne`, `deleteOne`, etc.
- `<filtro>` → un **objeto JSON** que describe la condición (ej: `{ precio: { $gt: 100 } }`).
- `<opciones>` → segundo objeto, ej: proyección, options.

**Ejemplos visuales**:

```javascript
db.productos.find( { precio: { $gt: 100 } } )
           //│         └── filtro: precio > 100
           //└── colección
```

```javascript
db.productos.updateOne(
  { _id: 1 },                     // filtro: el documento a actualizar
  { $set: { precio: 1100 } }      // operador: qué cambiar
)
```

#### B) Aggregation Pipeline — para analítica y transformaciones

```javascript
db.<coleccion>.aggregate([
  { $stage1: {...} },
  { $stage2: {...} },
  { $stage3: {...} }
])
```

Es como una **cinta transportadora**: la salida de una etapa es la entrada de la siguiente.

**Etapas más usadas (memorizá el orden lógico)**:

| Etapa | Para qué |
|---|---|
| `$match` | Filtrar documentos (≈ `WHERE` de SQL). **Poner al inicio** para usar índices. |
| `$lookup` | JOIN con otra colección |
| `$unwind` | Convertir array en múltiples docs |
| `$group` | Agrupar y agregar (≈ `GROUP BY` de SQL) |
| `$sort` | Ordenar |
| `$limit` / `$skip` | Paginar |
| `$project` | Elegir qué campos devolver (≈ `SELECT col1, col2`) |

**Ejemplo visual del flujo**:

```
db.plays.aggregate([
  { $match:  { user_id: "User_1" } },     // (1) filtra plays de User_1
  { $group:  { _id: "$song_id",            // (2) agrupa por canción
               total: { $sum: 1 }} },      //     suma 1 por cada doc
  { $sort:   { total: -1 } },              // (3) ordena desc
  { $limit:  10 }                          // (4) top 10
])
```

#### C) Operadores que siempre van con `$`

- **Comparación**: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`
- **Lógicos**: `$and`, `$or`, `$not`
- **Update**: `$set`, `$inc`, `$push`, `$pull`, `$unset`
- **Agregación**: `$sum`, `$avg`, `$max`, `$min`, `$count`

#### D) Reglas para escribir queries

1. Todos los **operadores empiezan con `$`** y van **dentro de un objeto JSON**.
2. Los **campos anidados se acceden con punto**: `"specs.ram"`, `"author.name"`.
3. **Acceso a elementos de array**: `db.col.find({ tags: "promo" })` → busca docs cuyo array `tags` contenga "promo".
4. La query se **ejecuta del primer `$match` al último stage** → orden importa.

---

### 3.1 Queries del dominio del TP

> 🖥️ **Dónde ejecutarlas**: estas queries están en **formato `mongosh`** (con `db.col.aggregate(...)`).
>
> - En **Compass `MONGOSH` tab** o **mongosh local** → pegá tal cual, antes ejecutá `use ing-datos-II`.
> - En **Atlas Aggregations tab** → pegá solo el array `[...]` (sin el wrapper) y reemplazá `new Date(Date.now() - N)` por `ISODate("YYYY-MM-DDTHH:MM:SSZ")` hardcodeado.

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

### 3.1bis Versión "Atlas Aggregations tab" — copy/paste directo

Las mismas queries de arriba, pero adaptadas para pegar directo en **Browse Collections → tab Aggregations → Text View**. Solo el array, sin `db.col.aggregate(...)`, con fechas literales.

📝 **Top 10 canciones últimas 24h — Atlas Aggregations tab** (colección: `plays`):

```javascript
[
  { $match: { timestamp: { $gte: ISODate("2026-06-16T00:00:00Z") } } },
  { $group: { _id: "$song_id", reproducciones: { $sum: 1 } } },
  { $sort: { reproducciones: -1 } },
  { $limit: 10 },
  { $lookup: { from: "songs", localField: "_id", foreignField: "song_id", as: "song" } },
  { $unwind: "$song" },
  { $project: { _id: 0, cancion: "$song.title", artista: "$song.artist_name", reproducciones: 1 } }
]
```

📝 **Historial semanal por artista Y género — Atlas Aggregations tab** (colección: `plays`):

```javascript
[
  { $match: { user_id: "User_1", timestamp: { $gte: ISODate("2026-06-10T00:00:00Z") } } },
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
]
```

📝 **Canciones con alta repro y baja completitud — Atlas Aggregations tab** (colección: `plays`):

```javascript
[
  { $group: {
      _id: "$song_id",
      total: { $sum: 1 },
      completadas: { $sum: { $cond: ["$completed", 1, 0] } }
  }},
  { $addFields: { completitud: { $divide: ["$completadas", "$total"] } } },
  { $match: { total: { $gte: 100 }, completitud: { $lt: 0.5 } } },
  { $sort: { total: -1 } }
]
```

> 💡 Para usar las fechas: ajustá el `ISODate("...")` al rango que tengas datos. Si las cargaste con `init_mongodb.js`, los timestamps son de los últimos 30 días → usá una fecha de hace 7 o 30 días.

---

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
