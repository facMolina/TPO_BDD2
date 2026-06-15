# 08 — Teoría General NoSQL

⭐ **Lo básico de cada tema "por si pregunta una vez"**. No vas tan profundo como en los archivos por motor — solo lo justo para no quedar mal si el profe te tira algo conceptual.

---

## 1. ACID — Las 4 propiedades

⭐ Pregunta clásica. Memorizalas con un ejemplo.

| Letra | Significado | Ejemplo |
|---|---|---|
| **A** — Atomicidad | Todo o nada | Transferencia bancaria: falla el débito → no hay crédito |
| **C** — Consistencia | Estado válido → estado válido | Venta con stock = 0 → rollback automático |
| **I** — Aislamiento | Cada tx trabaja sola | TX A y TX B leen el mismo saldo → ven el original |
| **D** — Durabilidad | COMMIT persiste | Server cae después del COMMIT → datos intactos |

**Pregunta clásica que cae**:
> *"Un sistema bancario ejecuta una transferencia de $5.000. El servidor se cae a mitad. Al reiniciar, ninguna cuenta fue afectada. ¿Qué propiedad ACID garantiza esto?"*
> **Respuesta: Atomicidad** — todo o nada, la tx no se completó → rollback.

---

## 2. BASE — La alternativa NoSQL

| Letra | Significado |
|---|---|
| **BA** — Basically Available | Disponibilidad garantizada aunque algunos nodos fallen |
| **S** — Soft State | El estado puede cambiar sin nuevas entradas (propagación) |
| **E** — Eventually Consistent | Converge a un estado consistente en algún momento futuro |

### ACID vs BASE — La frase clave

> "**No son opuestos**. ACID = corrección estricta (banca, pagos). BASE = escala y velocidad (redes sociales, IoT). La elección es **arquitectural**, depende del caso de uso."

---

## 3. Las 7 V's de Big Data

(Conviene mencionarlas para impresionar)

1. **Volumen** — TB → PB generados constantemente
2. **Velocidad** — tiempo real (IoT, redes, finanzas)
3. **Variedad** — JSON + XML + audio + video + texto libre
4. **Veracidad** — calidad y confiabilidad de los datos
5. **Valor** — qué se extrae que sea útil
6. **Variabilidad** — los datos cambian de significado
7. **Visualización** — cómo se presentan

Las **3 V's clásicas** son: Volumen, Velocidad, Variedad.

---

## 4. Historia de NoSQL (mini timeline)

```
2004  →  Google publica BigTable paper
2006  →  HBase (open-source de BigTable)
2007  →  Amazon publica Dynamo paper
2008  →  Facebook libera Cassandra
2009  →  MongoDB primera versión
2011  →  Neo4j despega
2018  →  MongoDB v4.0 — transacciones ACID multi-doc
```

> "**Quiénes lo impulsaron**: Google (Bigtable), Amazon (Dynamo), Facebook (Cassandra), LinkedIn (Voldemort)."

---

## 5. Los 4 modelos NoSQL

| Modelo | Estructura | Ejemplo | Caso ideal |
|---|---|---|---|
| **Documental** | JSON/BSON anidado | MongoDB, CouchDB | Catálogos, perfiles, CMS |
| **Grafos** | Nodos + Aristas | Neo4j, Neptune | Redes, recomendaciones, fraude |
| **Clave-Valor** | K → V (escalar/estructura) | Redis, DynamoDB | Caché, sesiones |
| **Tabular (Wide Column)** | Filas particionadas + columnas dinámicas | Cassandra, HBase | Series temporales, eventos |

**Otros modelos** (menos comunes):
- **OODB** (Orientadas a Objetos): db4o, ObjectDB — para CAD/BIM.
- **Multidimensionales** (OLAP): cubos para analytics — SSAS, Cognos.

---

## 6. Modelado NoSQL — Los 3 principios

⭐ **Si pregunta "¿cómo modelan en NoSQL?"**:

1. **Query-Driven Design**: identificar primero las consultas críticas. El esquema sirve a las queries.
2. **Embed vs Reference**: incluir datos relacionados dentro del documento o referenciarlos por ID, según cardinalidad y frecuencia de acceso.
3. **Read vs Write Trade-off**: optimizar lectura (desnormalizar) aumenta el costo de escritura, y viceversa.

**Frase clave**:
> "En SQL: modelar entidades y relaciones primero → las consultas vienen después. En NoSQL: las consultas definen el modelo → el esquema sirve al acceso."

---

## 7. Persistencia Poliglota — Definición

⭐ **Probable pregunta general**.

### Definición

> "Es una decisión arquitectural: **distintos motores de base de datos gestionan distintas partes del dominio según sus fortalezas**. No es simplemente 'usar tres bases'. Implica diseñar explícitamente qué datos viven en cada motor, cómo fluyen entre ellos, cómo se mantiene la coherencia."

### Origen del término

> Martin Fowler, 2011: *"Polyglot Persistence means using multiple databases, each for what they do best."*

### Caso E-commerce típico (mencionalo si querés ganar puntos)

| Componente | Motor |
|---|---|
| Catálogo | MongoDB |
| Sesiones / Carrito | Redis (TTL) |
| Recomendaciones | Neo4j |
| Eventos / Analytics | Cassandra |
| Pagos / Órdenes | PostgreSQL (ACID estricto) |
| Búsqueda | Elasticsearch |

> "Cada motor resuelve el problema para el que fue diseñado. Ninguno reemplaza a los otros."

---

## 8. Patrones para sistemas distribuidos

### Saga Pattern

> Transacciones distribuidas SIN two-phase commit. Cada paso es una tx local; si falla → ejecuta **transacciones compensatorias** que deshacen los pasos anteriores.

**Coreografiada** vs **Orquestada**:
- Coreografiada: servicios escuchan eventos, descentralizado.
- Orquestada: un orquestador central coordina y compensa.

**Aplicación en TP**: en OP-2, si MongoDB falla después de Cassandra, no hacemos rollback (aceptamos divergencia eventual). En OP-1, si Cassandra falla, abortamos.

### CQRS — Command Query Responsibility Segregation

> Separar el modelo de **escritura** (Commands) del modelo de **lectura** (Queries). La escritura va a un motor optimizado para writes; la lectura va a otro motor optimizado para reads. Sincronización asíncrona.

### Event Sourcing

> El estado se deriva de una secuencia de eventos inmutables. No se actualiza, solo se agrega. Permite reconstruir el estado en cualquier punto del tiempo.

### Anti-pattern: Distributed Monolith

> Microservicios que se llaman síncronamente y en cadena. Si uno falla, todo cae. **Peor que un monolito** — toda la complejidad operativa sin ningún beneficio.

---

## 9. Acceso desde Aplicaciones

### Capas

```
Lógica de negocio
    ↓
ORM / ODM / Framework de persistencia
    ↓
Driver / Connector nativo
    ↓
Connection Pool
    ↓
Capa de red (TCP/TLS)
    ↓
Motor de Base de Datos
```

### Drivers oficiales (los del TP)

| Motor | Driver Node.js |
|---|---|
| MongoDB | `mongodb` (oficial) |
| Neo4j | `neo4j-driver` (oficial) |
| Cassandra | `cassandra-driver` (DataStax oficial) |

### Protocolos de comunicación

| Motor | Protocolo |
|---|---|
| MongoDB | Wire Protocol (binario, BSON sobre TCP) |
| Neo4j | Bolt Protocol (binario eficiente) |
| Cassandra | CQL Binary Protocol (v4/v5) |
| Redis | RESP (Redis Serialization Protocol) |

### Connection Pooling — Por qué importa

> "Sin pooling: cada request abre y cierra una conexión TCP → overhead de auth, latencia extra (20-100ms), bajo carga = agotamiento. Con pooling: conexiones pre-calentadas y reutilizadas. Parámetros: `maxPoolSize`, `minPoolSize`, `maxIdleTimeMS`, `connectTimeoutMS`."

### ORM vs ODM vs Driver puro

| Nivel | Ejemplo Node.js | Pro | Contra |
|---|---|---|---|
| Driver puro | `mongodb` | Máximo control | Más código |
| ODM | Mongoose | Validación, schema, middleware | Overhead |
| ORM | Prisma, TypeORM | Type-safe, multi-store | Más abstracción |

### Anti-pattern N+1

> "El error más común en ORMs. Ejemplo: `Order.find()` (1 query) → loop iterando con `order.customer.name` (N queries). Solución: usar `populate('customer')` o `select_related` en la query inicial."

---

## 10. Errores conceptuales — Top 10 que NO querés cometer

⚠️ **NO decir**: "NoSQL reemplaza a SQL"
✅ **Correcto**: "NoSQL **complementa**. Coexisten en arquitecturas modernas."

⚠️ **NO decir**: "NoSQL siempre es más rápido"
✅ **Correcto**: "Depende del caso de uso. Un RDBMS con índices puede superar a un NoSQL mal modelado."

⚠️ **NO decir**: "BASE = sin consistencia"
✅ **Correcto**: "BASE garantiza **consistencia eventual**. Los datos convergen."

⚠️ **NO decir**: "NoSQL no usa índices"
✅ **Correcto**: "Todos los motores NoSQL usan índices. La diferencia está en su estructura."

⚠️ **NO decir**: "Schema-less = sin estructura"
✅ **Correcto**: "Schema-less = esquema implícito gestionado por la aplicación."

⚠️ **NO decir**: "El JOIN es siempre malo"
✅ **Correcto**: "El JOIN es eficiente para datos tabulares. Para grafos profundos no escala — ahí brilla Neo4j."

⚠️ **NO decir**: "CAP dice que solo hay 2 de 3"
✅ **Correcto**: "CAP dice que en presencia de **partición**, no podés tener C y A simultáneamente. Sin partición, podés tener las dos."

⚠️ **NO decir**: "Cassandra es como MongoDB pero distribuido"
✅ **Correcto**: "Cassandra es **wide-column**, modelado **query-first**, sin JOINs. Es un paradigma distinto."

⚠️ **NO decir**: "Eventual consistency es inseguro"
✅ **Correcto**: "Depende del dominio. Para contadores de likes o sesiones, es perfectamente aceptable y más performante."

⚠️ **NO decir**: "Microservicios siempre son mejores"
✅ **Correcto**: "Microservicios resuelven problemas de escala organizacional. Si no los tenés, suman complejidad sin beneficio (distributed monolith)."

---

## 11. Cita autores que el profe valora

| Autor | Libro / Concepto |
|---|---|
| **Eric Brewer** (2000) | Teorema CAP |
| **Gilbert & Lynch** (2002) | Formalización de CAP |
| **Daniel Abadi** (2012) | PACELC |
| **Guy Harrison** (2015) | *Next Generation Databases* — bibliografía obligatoria |
| **Olivier Pivert** (2018) | *NoSQL Data Models* — bibliografía obligatoria |
| **Bradberry & Lubow** (2013) | *Practical Cassandra* — bibliografía complementaria |
| **Martin Fowler** (2011) | Acuñó "Polyglot Persistence" |
| **Sun Microsystems** (1994) | Las 8 falacias de la computación distribuida |

---

## 12. Frases de oro (memorizá 3-4)

- *"No hay un motor universalmente superior, sino motores adecuados para cada tipo de problema."* — Harrison
- *"Diseñá el esquema según cómo la aplicación accede a los datos, no según las relaciones abstractas."* — MongoDB Docs
- *"There is no one-size-fits-all database."* — Harrison
- *"Model around your queries, not your data."* — Apache Cassandra Docs
- *"Think in graphs, not in tables."* — Neo4j Docs
- *"En sistemas distribuidos, la red es el último problema en el que pensás y el primero que falla."* (paráfrasis de las falacias)
- *"Eventual consistency es una elección consciente, no un defecto."*
- *"Persistencia poliglota: cada motor donde estructuralmente brilla."*
