# 03 — Neo4j — Defensa Oral

⭐⭐ Probabilidad alta de pregunta práctica (te tira una query Cypher) o teórica (por qué grafo y no Mongo).

---

## PARTE 1 — Resumen conceptual

### ¿Qué es Neo4j?

> "Neo4j es la **base de datos de grafos líder del mercado**. Almacena información como **nodos** (entidades) conectados por **relaciones dirigidas** con propiedades. Es ACID completo. Usa el lenguaje **Cypher** (estándar openCypher). Su gran ventaja es **index-free adjacency**: cada nodo tiene un puntero directo a sus relaciones, lo que hace que el traversal sea **O(1) por salto**, independientemente del tamaño total del grafo."

### Property Graph Model

- **Nodo**: entidad. Tiene **labels** (categorías, pueden ser múltiples) y **propiedades** (clave-valor).
- **Relación**: conexión dirigida con **tipo** obligatorio y propiedades opcionales.
- **Propiedad**: clave-valor en nodos o relaciones.

```
(ana:Person {name:'Ana', edad:28}) -[:TRABAJA_EN {desde:2020}]-> (acme:Company {name:'ACME'})
```

### En el TP

| Label | Propiedades clave |
|---|---|
| `Artist` | `stage_name`, `main_genre`, `country`, `followers` |
| `Album` | `uid`, `title`, `release_year` |
| `Song` | `uid`, `title`, `duration_ms`, `bpm`, `popularity` |
| `User` | `name`, `country`, `plan` |
| `Genre` | `name` |
| `Playlist` | `name`, `type`, `followers_current` |

| Relación | Dirección | Propiedades |
|---|---|---|
| `RELEASED` | `(Artist)→(Album)` | — |
| `PERFORMED` | `(Artist)→(Song)` | — |
| `IN_ALBUM` | `(Song)→(Album)` | — |
| `HAS_GENRE` | `(Artist)→(Genre)` | — |
| `PLAYED` | `(User)→(Song)` | `timestamp`, `device`, `context`, `completed` |
| `FOLLOWS` | `(User)→(Artist)` | — |
| `CONTAINS` | `(Playlist)→(Song)` | `position` |
| `COLLABORATED_WITH` | `(Artist)↔(Artist)` | `song_title`, `collab_type` |

### Características técnicas

- **Almacenamiento nativo de grafos**: Node Records (15 bytes fijos) + Relationship Records (34 bytes fijos). Acceso por ID = offset directo en disco.
- **Index-free adjacency**: cada nodo tiene puntero directo a su lista de relaciones. SQL usa índice + JOIN; Neo4j sigue el puntero.
- **ACID completo**: A (todo o nada), C (constraints al COMMIT), I (MVCC), D (WAL).
- **Clustering Enterprise**: protocolo **Raft** (N = 2F+1 para tolerar F fallas). Core Servers para escritura, Read Replicas para lectura escala.
- **CAP**: **CP** — frente a partición, los Core sin quorum rechazan escrituras.
  - 💡 **CP** = **C**onsistency + **P**artition tolerance. Igual que MongoDB: prioriza datos consistentes sobre disponibilidad. En cluster Enterprise usa **Raft** (algoritmo de consenso). Si un grupo de nodos queda aislado y no tiene mayoría, **deja de aceptar escrituras** hasta que se restaure la red.
- **AuraDB Free** (la que usamos): sin APOC, sin GDS, sin clustering — Cypher puro.

---

## PARTE 2 — Q&A para la defensa

### ⭐ Q1: ¿Por qué Neo4j y no MongoDB para las colaboraciones?

**Respuesta corta**:
> "Las colaboraciones son **relaciones profundas y recursivas** (un artista colaboró con otro, que colaboró con otro). En MongoDB, esto requiere múltiples `$lookup` encadenados — la performance degrada exponencialmente con la profundidad. Neo4j usa **index-free adjacency**: el traversal es **O(1) por salto**, independientemente del tamaño total del grafo."

💡 **Para el TP**: "Si queremos encontrar artistas que están a 2 saltos de Beyoncé (colaboradores de colaboradores), en Neo4j es una sola línea: `MATCH (b:Artist {name:'Beyoncé'})-[:COLLABORATED_WITH*2]->(x)`. En Mongo serían 2 `$lookup` y el resultado sería costoso."

### ⭐ Q2: ¿Qué es index-free adjacency?

**Respuesta corta**:
> "Cada nodo en Neo4j almacena un puntero directo a su lista de relaciones. Para navegar a un vecino, no se consulta ningún índice — simplemente se sigue el puntero. El costo del traversal es **independiente del tamaño total del grafo**."

💡 **Compará con SQL**:
- SQL: `SELECT * FROM friends WHERE user_id = 42` → busca en B-tree O(log n).
- Neo4j: nodo 42 → puntero → rel-list → puntero → nodo vecino. O(1) por salto.

### Q3: ¿Qué es Cypher?

**Respuesta corta**:
> "Es el lenguaje declarativo de consulta de Neo4j. Hoy es estándar **openCypher**. Sintaxis 'ASCII art': los patrones se escriben como se ven. Por ejemplo `(a)-[:CONOCE]->(b)` describe el patrón visualmente."

### Q4: ¿Qué garantías ACID ofrece Neo4j?

**Respuesta corta**:
> "ACID completo:
> - **Atomicidad**: todo o nada por transacción.
> - **Consistencia**: constraints se verifican al COMMIT (ej: UNIQUE).
> - **Aislamiento**: MVCC (Multi-Version Concurrency Control), las TX concurrentes ven versiones independientes.
> - **Durabilidad**: WAL (Write-Ahead Log) — toda TX se escribe en el log antes de aplicarse al store. Si crashea → recovery."

### ⭐ Q5: ¿Neo4j es CP o AP?

**Respuesta corta**:
> "**CP**. En standalone no hay partición (trivialmente CP). En cluster (Enterprise) usa **Raft**: si hay partición y un grupo no tiene quorum, **rechaza escrituras** — prioriza consistencia."

💡 **Si repregunta**: "Las Read Replicas pueden ser AP — pueden servir lecturas stale durante una partición. Para garantizar read-your-writes en cluster se usan **Bookmarks** (consistencia causal)."

### Q6: ¿Qué es el shortestPath?

**Respuesta corta**:
> "Es una función de Cypher que devuelve el camino más corto entre dos nodos usando BFS. Sintaxis: `MATCH p = shortestPath((a)-[:REL*]-(b)) RETURN p, length(p)`."

⚠️ **No confundir** con `allShortestPaths()` (devuelve todos los caminos de la misma longitud mínima).

### Q7 (TP1 corregida): ¿Qué hace tu query 7e?

**Respuesta**:
> "Detecta **clusters de artistas altamente interconectados** — vecindarios densos. La query encuentra pares (a, b) que tienen al menos 2 colaboradores en común, y agrupa todos esos artistas en un cluster. En el TP1 nos equivocamos: agrupábamos solo por `main_genre`, lo que no es detección de comunidades. La corrección usa el patrón `(a)-[:COLLABORATED_WITH]-(x)-[:COLLABORATED_WITH]-(b)` + `(a)-[:COLLABORATED_WITH]-(b)` con conteo de `x`."

### Q8: ¿Qué es MERGE vs CREATE?

**Respuesta corta**:
> "`CREATE` siempre crea un nodo nuevo, aunque exista otro idéntico. `MERGE` es un **upsert**: busca el nodo, si no existe lo crea. Sintaxis: `MERGE (p:Person {id:5}) ON CREATE SET p.creado = datetime() ON MATCH SET p.visitas = p.visitas + 1`."

⚠️ **Trampa**: Si querés MERGE de un nodo Y una relación, hacelo en pasos separados:
```cypher
MERGE (a:Person {name:'Ana'})
MERGE (b:Person {name:'Luis'})
MERGE (a)-[:AMIGA_DE]->(b)
```
Si hacés `MERGE (a)-[:AMIGA_DE]->(b)` sin merger primero los nodos, puede crear duplicados.

### Q9: ¿Qué es DETACH DELETE?

**Respuesta corta**:
> "`DELETE` falla si el nodo tiene relaciones activas. `DETACH DELETE` elimina el nodo **y** todas sus relaciones de una sola vez."

### ⭐ Q10: ¿Por qué la query de "amigos de amigos" es 100× más rápida en Neo4j que en SQL?

**Respuesta corta**:
> "En SQL cada nivel de profundidad agrega un JOIN nuevo. Para 6 grados de separación serían 6 JOINs encadenados — el costo crece exponencialmente con el volumen total. En Neo4j, gracias a index-free adjacency, cada salto es O(1) y solo cambias `*2` por `*6` en la query."

### Q11: ¿Qué pasa cuando AuraDB Free se pausa?

**Respuesta corta**:
> "AuraDB Free se pausa automáticamente tras ~3 días de inactividad para ahorrar recursos. Hay que reactivarla manualmente desde console.neo4j.io. Cuando está pausada, el driver tira `Could not perform discovery. No routing servers available`."

### Q12: ¿Qué son labels múltiples?

**Respuesta corta**:
> "Un nodo puede tener varios labels al mismo tiempo: `(ana:Person:Employee:Manager)`. Esto es imposible en SQL (una fila pertenece a una sola tabla). En Neo4j permite categorizar de forma cruzada sin duplicar el nodo."

---

## PARTE 3 — Queries prácticas

### 🔍 Cómo acceder a la consola web de Neo4j AuraDB

Para practicar Cypher en la instancia real del TP **sin instalar nada**:

1. Andá a **[console.neo4j.io](https://console.neo4j.io)** e iniciá sesión con la cuenta del grupo (`molina.roman@gmail.com`).
2. Verificá que la instancia esté en estado **RUNNING** (verde). Si dice "Paused" → click en `Resume` y esperá ~2 minutos.
3. Click en **`Open`** sobre la instancia → se abre **Neo4j Workspace** en una nueva pestaña.
4. En el Workspace tenés 3 tabs:

| Tab | Para qué |
|---|---|
| **Query** | Donde escribís y ejecutás Cypher (ASCII art con resultados gráficos) |
| **Explore** | Visualización del grafo en modo navegación |
| **Import** | Para cargar CSVs |

> 💡 **Atajo en el tab Query**: `Ctrl+Enter` ejecuta la query.

> 🌐 **URL directa al Workspace**: [workspace-preview.neo4j.io](https://workspace-preview.neo4j.io)

> ⚠️ **AuraDB Free se pausa tras ~3 días de inactividad**. Antes de la defensa, asegurate de reactivarla.

---

### 📝 Anatomía de una query en Cypher

Cypher es **declarativo** y usa "ASCII art" — los patrones del grafo se escriben **como se dibujan**.

#### A) Las palabras clave que siempre vas a usar

| Cláusula | Para qué | Análogo SQL |
|---|---|---|
| `MATCH` | Buscar un patrón en el grafo | `SELECT ... FROM ... WHERE` |
| `WHERE` | Filtrar (después de MATCH) | `WHERE` |
| `RETURN` | Qué devolver | `SELECT` |
| `CREATE` | Crear nodos/relaciones | `INSERT` |
| `MERGE` | Crear si no existe, sino devolver | `UPSERT` |
| `SET` | Asignar propiedad o label | `UPDATE` |
| `DELETE` / `DETACH DELETE` | Eliminar | `DELETE` |
| `WITH` | Encadenar resultados de una etapa a la siguiente | (no hay análogo directo) |
| `ORDER BY`, `LIMIT`, `SKIP` | Ordenar y paginar | igual que SQL |

#### B) Sintaxis ASCII art — esto es lo más importante

```cypher
(nodo:Label {prop:'valor'})
```
- `( )` → nodo
- `:Label` → label (categoría del nodo). Múltiples labels: `(n:Person:Employee)`
- `{ }` → propiedades dentro del nodo

```cypher
(a)-[:TIPO_REL]->(b)
```
- `-[ ]->` → relación **dirigida** de `a` hacia `b`
- `:TIPO_REL` → tipo de relación (siempre mayúsculas por convención)

#### C) Variantes de relación que tenés que reconocer

```cypher
(a)-[:CONOCE]->(b)             // dirigida: a → b
(a)<-[:CONOCE]-(b)             // dirigida: b → a
(a)-[:CONOCE]-(b)              // cualquier dirección
(a)-[r:CONOCE {desde:2020}]->(b)  // capturo la rel en variable r con propiedades
(a)-[:CONOCE*2]->(b)           // exactamente 2 saltos
(a)-[:CONOCE*1..3]->(b)        // entre 1 y 3 saltos
(a)-[:CONOCE*]->(b)            // ilimitado (cuidado: puede explotar)
```

#### D) Anatomía visual

```cypher
MATCH (u:User {name:'Ana'})-[:PLAYED]->(s:Song)<-[:PERFORMED]-(a:Artist)
WHERE s.duration_ms > 180000
RETURN a.stage_name AS artista, count(s) AS canciones
ORDER BY canciones DESC
LIMIT 10
```

Leelo así:
1. **MATCH** el patrón: User llamado Ana → escuchó (`PLAYED`) → una Song ← que tocó (`PERFORMED`) → un Artist.
2. **WHERE** filtrá las que duran más de 3 minutos.
3. **RETURN** el nombre del artista y cuántas canciones.
4. **ORDER BY ... LIMIT** ordená descendente y traé top 10.

#### E) Reglas para escribir Cypher

1. **Case-sensitive**: `:Person` ≠ `:person`. Convención: **PascalCase** para labels, **MAYÚSCULAS_CON_GUION** para tipos de relación, **camelCase** para propiedades.
2. **Crear relación SIEMPRE necesita primero MATCH de los nodos**. Si hacés `CREATE (a:Person {name:'Ana'})-[:CONOCE]->(b:Person {name:'Luis'})` cuando Ana ya existe, **crea un nuevo nodo Ana duplicado**.
3. **DELETE sin DETACH falla** si el nodo tiene relaciones. Usá `DETACH DELETE` para borrar nodo + relaciones de una.
4. Usá **`MERGE` en lugar de `CREATE`** cuando querés "crear si no existe".

---

### 3.1 Queries del TP (Req 7)

📝 **7a — Artistas con más colaboraciones directas**:

```cypher
MATCH (a:Artist)-[r:COLLABORATED_WITH]-(b:Artist)
RETURN a.stage_name AS artista, count(DISTINCT b) AS colaboradores
ORDER BY colaboradores DESC
LIMIT 10
```

📝 **7b — Camino más corto entre dos artistas**:

```cypher
MATCH (a:Artist {stage_name:'Beyoncé'}), (b:Artist {stage_name:'AC/DC'})
MATCH p = shortestPath((a)-[:COLLABORATED_WITH*]-(b))
RETURN [n IN nodes(p) | n.stage_name] AS camino, length(p) AS saltos
```

📝 **7c — Artistas puente (cross-genre)**:

```cypher
MATCH (a:Artist)-[r:COLLABORATED_WITH {collab_type:'cross-genre'}]-(b:Artist)
RETURN a.stage_name AS puente,
       count(DISTINCT b) AS conexiones_cross
ORDER BY conexiones_cross DESC
```

📝 **7d — Recomendación por vecindad**:

```cypher
MATCH (user:User {name:'User_1'})-[:PLAYED]->(s:Song)<-[:PERFORMED]-(escuchado:Artist)
MATCH (escuchado)-[:COLLABORATED_WITH]-(rec:Artist)
WHERE NOT (user)-[:FOLLOWS]->(rec) AND rec <> escuchado
RETURN rec.stage_name AS recomendado, count(DISTINCT escuchado) AS conexiones
ORDER BY conexiones DESC
LIMIT 5
```

📝 **7e — Clusters densos (CORREGIDO)**:

```cypher
MATCH (a:Artist)-[:COLLABORATED_WITH]-(x:Artist)-[:COLLABORATED_WITH]-(b:Artist)
WHERE a <> b AND (a)-[:COLLABORATED_WITH]-(b)
WITH a, b, count(x) AS colaboradores_comunes
WHERE colaboradores_comunes >= 2
WITH collect(DISTINCT a.stage_name) AS comunidad,
     collect(DISTINCT a.main_genre) AS generos_en_cluster
RETURN comunidad[0..6] AS muestra_artistas,
       generos_en_cluster[0] AS genero_dominante,
       size(comunidad) AS tamanio_cluster
ORDER BY tamanio_cluster DESC LIMIT 10
```

### 3.2 Queries genéricas "tipo profe"

📝 **Crear nodos y relaciones — red social mínima**:

```cypher
// Crear nodos
CREATE
  (ana:Person {name:'Ana', edad:28}),
  (luis:Person {name:'Luis', edad:35}),
  (maria:Person {name:'María', edad:22})

// Crear relaciones entre nodos existentes
MATCH (ana:Person {name:'Ana'}), (luis:Person {name:'Luis'})
CREATE (ana)-[:AMIGA_DE {desde:2020}]->(luis)

// Crear nodos Y relación en un solo bloque
CREATE
  (pedro:Person {name:'Pedro'}),
  (acme:Company {name:'ACME'}),
  (pedro)-[:TRABAJA_EN {rol:'Dev', desde:2022}]->(acme)
```

📝 **Búsquedas**:

```cypher
// Todos los nodos Person
MATCH (p:Person) RETURN p

// Filtro por propiedad
MATCH (p:Person {ciudad:'Buenos Aires'}) RETURN p.name

// Comparación
MATCH (p:Person) WHERE p.edad >= 25 RETURN p

// Operadores de texto
MATCH (p:Person) WHERE p.name STARTS WITH 'A' RETURN p
MATCH (p:Person) WHERE p.email ENDS WITH '@uade.edu.ar' RETURN p
MATCH (p:Person) WHERE p.name CONTAINS 'Ana' RETURN p

// Traversal
MATCH (ana:Person {name:'Ana'})-[:AMIGA_DE]->(amigo) RETURN amigo.name

// Amigos de amigos (2 saltos)
MATCH (ana:Person {name:'Ana'})-[:AMIGA_DE*2]->(fof:Person)
RETURN DISTINCT fof.name
```

📝 **Agregaciones**:

```cypher
// Contar amigos por persona
MATCH (p:Person)-[:AMIGO_DE]->(a)
RETURN p.name, count(a) AS amigos
ORDER BY amigos DESC

// HAVING con WITH
MATCH (p:Person)-[:AMIGA_DE]->(a)
WITH p, count(a) AS cant
WHERE cant > 5
RETURN p.name, cant

// collect() — agrupar en lista
MATCH (c:Company)<-[:TRABAJA_EN]-(p:Person)
RETURN c.name AS empresa, collect(p.name) AS equipo, count(p) AS total

// Estadísticas
MATCH (p:Person)
RETURN p.ciudad,
       count(p) AS cantidad,
       avg(p.edad) AS edad_promedio,
       max(p.edad) AS max_edad,
       min(p.edad) AS min_edad
```

📝 **Actualizar y eliminar**:

```cypher
// Update propiedad
MATCH (p:Person {name:'Ana'}) SET p.email = 'ana@mail.com' RETURN p

// Agregar label
MATCH (p:Person {name:'Ana'}) SET p:Premium

// Eliminar propiedad
MATCH (p:Person {name:'Ana'}) REMOVE p.email

// Eliminar nodo (sin relaciones)
MATCH (p:Person {name:'Ana'}) DELETE p

// Eliminar nodo Y relaciones
MATCH (p:Person {name:'Ana'}) DETACH DELETE p

// Limpiar todo
MATCH (n) DETACH DELETE n
```

📝 **Índices y constraints**:

```cypher
// Índice
CREATE INDEX cliente_id FOR (c:Cliente) ON (c.id)

// Constraint UNIQUE (crea índice automáticamente)
CREATE CONSTRAINT cliente_email_unico
FOR (c:Cliente) REQUIRE c.email IS UNIQUE

// Ver índices
SHOW INDEXES

// Plan de ejecución
EXPLAIN MATCH (c:Cliente {id:1}) RETURN c
PROFILE MATCH (c:Cliente {id:1}) RETURN c  // ejecuta y muestra costos
```

📝 **shortestPath y paths variables**:

```cypher
// Camino más corto
MATCH p = shortestPath((a:Person {name:'Ana'})-[:CONOCE*]-(b:Person {name:'Pedro'}))
RETURN p, length(p)

// Profundidad exacta
MATCH (a:Person)-[:CONOCE*3]->(b:Person) RETURN a, b

// Rango variable
MATCH (a:Person)-[:CONOCE*1..4]->(b:Person) RETURN a, b

// Capturar path como variable
MATCH p = (a:Person {name:'Ana'})-[:CONOCE*1..3]->(b)
RETURN p, length(p) AS profundidad
```

---

## PARTE 4 — Errores conceptuales a NO cometer

⚠️ **NO decir**: "Las relaciones son como foreign keys."
✅ **Correcto**: "Las FK son solo un número. En grafos, la relación **es una estructura almacenada físicamente** con punteros bidireccionales. No requiere búsqueda de índice."

⚠️ **NO decir**: "Los nodos son como tablas."
✅ **Correcto**: "Un nodo es como una **fila**. Los **labels** son como las tablas. Un nodo puede pertenecer a múltiples 'tablas' (labels) simultáneamente."

⚠️ **NO decir**: "DELETE elimina el nodo y sus relaciones."
✅ **Correcto**: "`DELETE` falla si hay relaciones. Para eliminar nodo + relaciones usar `DETACH DELETE`."

⚠️ **NO decir**: "MATCH (p:person) es lo mismo que MATCH (p:Person)."
✅ **Correcto**: "Cypher es **case-sensitive** para labels, tipos de relación y propiedades."

⚠️ **NO usar relaciones de profundidad ilimitada en producción**:
```cypher
MATCH (a)-[:REL*]->(b)  // ⚠️ puede agotar memoria
MATCH (a)-[:REL*1..6]->(b)  // ✅ siempre con límite
```

---

## PARTE 5 — Comparativa rápida

| | MongoDB | **Neo4j** | Cassandra |
|---|---|---|---|
| Unidad básica | Documento | **Nodo + Relación** | Fila + Columnas |
| Relaciones | Manual (`$lookup`) | **Físicas (puntero)** | No nativo |
| Profundidad relacional | Degrada con `$lookup` | **O(1) por salto** | No aplica |
| Esquema | Schema-on-read | **Schema-optional** | Por tabla |
| ACID | Multi-doc (v4+) | **Sí completo** | LWT por partición |
| CAP | CP (default) | **CP** | AP |
| Caso ideal | Catálogos | **Redes, recomendaciones** | Time-series, eventos |
