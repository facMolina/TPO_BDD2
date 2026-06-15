# 07 — Comparativa de Motores en el Contexto del TP

⭐⭐⭐ **Este archivo es la artillería para la pregunta teórica más probable**: *"¿Por qué tal motor y no tal otro para tal parte del modelo?"*

---

## 1. Resumen de elecciones del TP

| Parte del modelo | Motor elegido | Por qué |
|---|---|---|
| Catálogo de artistas, álbumes, canciones | **MongoDB** | Datos semi-estructurados, queries ad-hoc, schema flexible |
| Playlists con canciones | **MongoDB** | Embedding natural (lista de songs por playlist) |
| Red de colaboraciones entre artistas | **Neo4j** | Traversal profundo, recomendación por proximidad |
| Recomendación de artistas (OP-1, OP-5) | **Neo4j** | Index-free adjacency vs `$lookup` recursivo en Mongo |
| Eventos de reproducción (400M/día) | **Cassandra** | Escritura masiva distribuida sin coordinador central |
| Métricas horarias por canción | **Cassandra (COUNTER)** | Incrementos atómicos distribuidos |
| Charts diarios por país | **Cassandra** | Clustering key con ordenamiento nativo |

---

## 2. La pregunta clave: ¿Por qué Cassandra y no MongoDB para los eventos?

⭐⭐⭐ **Probabilidad muy alta de que el profe pregunte esto exactamente.**

### Respuesta corta (de memoria)

> "**Volumen y arquitectura**. 400 millones de reproducciones diarias son 4.600 escrituras/segundo sostenidas. MongoDB es **CP** según CAP — prioriza consistencia, lo que introduce **latencia en escrituras concurrentes**. Además, MongoDB tiene un **Primary único** por replica set: las escrituras no escalan horizontalmente, solo las lecturas. Cassandra es **AP** y **peer-to-peer**: cada nodo acepta escrituras independientemente, sin coordinador central. Para nuestro caso de uso, donde aceptamos consistencia eventual a cambio de throughput, Cassandra gana por diseño."

### Respuesta larga (si insiste)

> "Hay tres niveles para esta decisión:
>
> 1. **Modelo de consistencia**: MongoDB requiere coordinación con el Primary para cada escritura. Cassandra usa consistencia tunable: con `CL=ONE` la escritura se confirma al primer nodo que responda, sin esperar coordinación global.
>
> 2. **Escalabilidad de escrituras**: MongoDB escala lecturas (replica set) y volumen (sharding), pero las escrituras siguen pasando por el Primary del shard. Cassandra escala writes **linealmente** agregando nodos.
>
> 3. **Optimización para series temporales**: el modelo wide-column de Cassandra está hecho para datos time-series. Su LSM-Tree es append-only — latencia de escritura predecible y baja. El B-tree de MongoDB hace updates en lugar de appends."

---

## 3. ¿Por qué MongoDB para el catálogo y no Cassandra?

⭐ Pregunta probable.

### Respuesta corta

> "**Naturaleza de las queries**. El catálogo se navega con filtros variables: buscar artistas por nombre, álbumes por año, canciones por género o duración. **Cassandra requiere modelar una tabla por query** — si tengo 10 patrones de búsqueda distintos, necesito 10 tablas (anti-pattern). MongoDB soporta queries ad-hoc por cualquier campo con índices. Para un dominio con bajo volumen de escrituras (80 artistas, 564 canciones) y muchos patrones de lectura, MongoDB es ideal."

### Respuesta larga

> "Además, los documentos del catálogo son **densos y semi-estructurados**: un artista tiene géneros (array), una canción tiene metadata variable. Cassandra soporta colecciones (LIST, SET, MAP), pero el modelo está orientado a **filas planas** organizadas por partition key. Forzar embedding profundo en Cassandra es ir contra su diseño. MongoDB con BSON es la elección natural."

---

## 4. ¿Por qué Neo4j para las colaboraciones y no MongoDB?

⭐⭐ Pregunta MUY probable.

### Respuesta corta

> "**Profundidad relacional**. Para encontrar 'artistas a 3 saltos de Beyoncé' en MongoDB necesitaría 3 `$lookup` encadenados — la latencia degrada exponencialmente con la profundidad. Neo4j usa **index-free adjacency**: cada nodo tiene puntero directo a su lista de relaciones. El traversal es **O(1) por salto**, independientemente del tamaño total del grafo."

### Frase clave

> "En SQL/MongoDB, la relación es un número (FK). En Neo4j, la relación **es una estructura física almacenada** con punteros bidireccionales."

### Ejemplo concreto del TP

Para OP-1 (recomendación):
- En Neo4j: `MATCH (artistas_escuchados)-[:COLLABORATED_WITH]-(rec) RETURN rec` → 1 query, O(1) por arista.
- En MongoDB: 3 `$lookup` encadenados sobre 80 artistas + 95 pares de colaboraciones — para más profundidad se vuelve impracticable.

---

## 5. ¿Por qué Cassandra para los charts y no MongoDB?

### Respuesta corta

> "Los charts son **time-series altamente particionables** por país y fecha. En Cassandra, `PRIMARY KEY ((pais, fecha), reproducciones DESC)` permite obtener el top 50 leyendo las primeras 50 filas de una partición — sin sorting en runtime. Además, OP-2 escribe en `chart_counters` (tabla COUNTER) en tiempo real con incrementos atómicos distribuidos. En MongoDB tendríamos que hacer `$inc` sobre documentos, con locking a nivel documento."

### Frase clave

> "El clustering key DESC de Cassandra es ordenamiento nativo en disco — Mongo necesita sort en memoria para el top-N."

---

## 6. Matriz: ¿Y si hubiéramos usado solo un motor?

### Solo MongoDB

| Problema | Cómo se vería |
|---|---|
| 400M eventos/día | Saturaría replica set, requeriría sharding agresivo + Primary monolítico por shard |
| Recomendación por colaboraciones | `$lookup` recursivo no escala más allá de 2-3 niveles |
| Charts en tiempo real | `$inc` con lock a nivel documento; mejor que Mongo, pero no óptimo |
| Catálogo | ✅ MongoDB brilla acá |

**Conclusión**: MongoDB cubre 1 de 4 casos de uso bien. Los otros 3 se forzarían.

### Solo Neo4j

| Problema | Cómo se vería |
|---|---|
| 400M eventos/día | Neo4j no está pensado para ingestión a esa velocidad |
| Catálogo navegable | Cypher sirve para queries simples, pero AuraDB Free es CP standalone |
| Charts time-series | Neo4j no tiene tablas COUNTER nativas |
| Recomendaciones por grafo | ✅ Brilla acá |

**Conclusión**: Neo4j es el motor del TP **menos versátil** — está hiper-especializado en grafos.

### Solo Cassandra

| Problema | Cómo se vería |
|---|---|
| Catálogo con queries ad-hoc | Anti-pattern: tendría que diseñar 10+ tablas para cada filtro |
| Recomendaciones por relaciones profundas | Imposible — no soporta JOINs ni traversals |
| Eventos masivos | ✅ Brilla acá |
| Charts time-series | ✅ Brilla acá |

**Conclusión**: Cassandra cubre 2 de 4 casos de uso bien. Los otros 2 se vuelven inviables.

### Conclusión final

> "**Por eso elegimos los 3 motores**. La persistencia poliglota no es una decisión arbitraria — es la **única arquitectura** que cubre todos los casos de uso eficientemente. Cada motor está donde estructuralmente brilla."

---

## 7. Cuadro maestro de comparación

| Característica | **MongoDB** | **Neo4j** | **Cassandra** | (Redis) |
|---|---|---|---|---|
| Modelo de dato | Documento BSON | Property Graph | Wide Column | K/V + estructuras |
| Esquema | Schema-on-read | Schema-optional | Por tabla | Sin esquema |
| Lenguaje | MQL + Aggregation | Cypher | CQL (SQL-like) | Comandos simples |
| Unidad básica | Documento | Nodo + Relación | Fila particionada | Clave |
| Queries ad-hoc | ✅ Excelente | ✅ Cypher rico | ❌ Query-first only | ❌ |
| JOINs | `$lookup` | Traversal nativo | ❌ NO | ❌ |
| Relaciones profundas | Degrada con `$lookup` | ✅ **O(1) por salto** | ❌ | ❌ |
| Transacciones | ACID multi-doc (v4+) | ACID completo | LWT (Paxos) por partición | MULTI/EXEC en 1 nodo |
| Write throughput | Medio | Bajo | ✅ **Excelente** | ✅ Excelente (memoria) |
| Read latency típica | ~5ms | ~15ms (3 saltos) | ~10ms | ~1ms |
| Replicación | Master-Slave (RS) | Master-Slave (Raft) | Peer-to-Peer | Master-Slave (Sentinel) |
| Sharding | Shard key + mongos | Limitado | Consistent Hashing nativo | Cluster (hash slots) |
| Consistencia | Configurable (`w:0..majority`) | Strong / Causal | Tunable (`ONE..ALL`) | Eventual / Strong (Sentinel) |
| **CAP** | **CP (default)** | **CP** | **AP** | CA/CP/AP |
| Open source | ✅ (SSPL) | ✅ (GPL/AGPL) | ✅ (Apache) | ✅ (BSD) |
| **Caso ideal** | CMS, catálogos, perfiles | Redes, recomendaciones, fraude | Series temporales, IoT, eventos | Caché, sesiones, rankings |
| Anti-pattern | Datos altamente relacionales en grafo | Datos sin relaciones | Queries ad-hoc | Datos persistentes y complejos |

---

## 8. Trade-offs explícitos del TP

### ✅ Lo que ganamos con la arquitectura poliglota

1. **Performance óptimo por caso de uso** — cada motor brilla en su zona.
2. **Escalabilidad independiente** — podemos escalar Cassandra para eventos sin tocar MongoDB.
3. **Modelo de consistencia diferenciado** — fuerte en catálogo (Mongo), eventual en eventos (Cassandra).
4. **Mejor uso de recursos** — no forzamos un motor a hacer algo para lo que no fue diseñado.

### ⚠️ Lo que sacrificamos

1. **Operación**: 3 conexiones, 3 esquemas, 3 sets de credenciales.
2. **Coherencia atómica entre motores**: no hay transacción distribuida → la app coordina.
3. **Mayor superficie de fallo**: si un motor cae, las operaciones que lo usan fallan.
4. **Complejidad de aprendizaje**: el equipo tiene que dominar 3 modelos de datos.

### Frase para defensa

> "La complejidad operacional es **real**. La aceptamos porque el dominio justifica la decisión arquitectónica. En una plataforma sin millones de eventos diarios, hubiéramos resuelto todo con MongoDB y listo."

---

## 9. ¿Cuándo elegir cuál? — Framework de selección

| Pregunta | Si SÍ | Si NO |
|---|---|---|
| ¿Necesitás transacciones ACID estrictas entre entidades? | **PostgreSQL** | NoSQL |
| ¿Los datos son altamente relacionales (red, grafo)? | **Neo4j** | sigue |
| ¿El volumen de escritura es masivo y distribuido geográficamente? | **Cassandra** | sigue |
| ¿Los datos son semi-estructurados con queries ad-hoc por filtros variables? | **MongoDB** | sigue |
| ¿Los datos son de bajo volumen con acceso por clave exacta y baja latencia? | **Redis** | reconsiderar |

---

## 10. Antipatrones de selección (errores que NO querés cometer en la defensa)

| Antipattern | Por qué está mal |
|---|---|
| "Usé MongoDB porque es lo que más conozco" | Decisión por familiaridad, no por análisis técnico |
| "Usé NoSQL porque es moderno" | Sin justificar el patrón de acceso ni la consistencia requerida |
| "Cassandra es siempre más rápido que Mongo" | Falso. Cassandra brilla en escrituras masivas, no en queries ad-hoc |
| "Neo4j escala como Cassandra" | Falso. Neo4j tiene escalabilidad horizontal limitada |
| "Eventual consistency es siempre inseguro" | Depende del dominio. Es perfectamente aceptable para likes, sesiones, contadores |

---

## 11. Casos reales que podés citar

| Empresa | Motor | Caso de uso |
|---|---|---|
| **Netflix** | Cassandra | Historial de reproducciones (200M+ usuarios, 30M+ writes/s) |
| **Instagram** | Cassandra | Timeline de feeds, posts e interacciones |
| **Uber** | Cassandra | Posición de conductores cada 4s |
| **Discord** | Cassandra | Migró de MongoDB a 100M mensajes/día |
| **LinkedIn** | Grafo interno (similar a Neo4j) | Red de conexiones profesionales (1B usuarios) |
| **Panama Papers** | Neo4j | 11.5M docs, 320K entidades offshore — encontrar caminos entre personas y empresas |
| **eBay, Amazon** | MongoDB | Catálogo de productos |

---

## 12. Frases listas para citar en la defensa

- *"There is no one-size-fits-all database."* — Harrison (2015)
- *"Cassandra modela alrededor de tus queries, no de tus datos."* — Apache Cassandra Docs
- *"Think in graphs, not in tables."* — Neo4j Docs
- *"Diseñá el esquema según cómo la aplicación accede a los datos, no según las relaciones abstractas entre entidades."* — MongoDB Documentation
- *"Polyglot persistence means using multiple databases, each for what they do best."* — Martin Fowler (2011)
