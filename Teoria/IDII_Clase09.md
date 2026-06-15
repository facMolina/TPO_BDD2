<!-- Slide number: 1 -->

CLASE 9

U2–U3
INGENIERÍA DE DATOS II
Bases de Datos Orientadas a Objetos · Multidimensionales · Modelado NoSQL · Comparativa y Criterios de Selección
Más Allá
de los
Documentos

Ing. Damián Arnaudo

### Notes:

<!-- Slide number: 2 -->

CLASE 9  Agenda de la clase
AGENDA

01
04
Bases de datos orientadas a objetos
Comparativa de modelos NoSQL

02
05
Bases de datos multidimensionales
Criterios de selección

03
06
Modelado NoSQL
Casos reales & cierre

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 3 -->

01
BLOQUE 1
Bases de Datos
Orientadas a Objetos
Cuando los datos son tan ricos como el dominio

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 4 -->

  BLOQUE 1 · Motivación
¿Por qué surgieron las OODB?

Los lenguajes OO (C++, Java, Smalltalk) modelan el mundo con objetos: atributos, métodos, herencia, polimorfismo.
El modelo relacional "aplana" esos objetos en tablas → Object-Relational Impedance Mismatch.
CAD/CAM, GIS, multimedia y sistemas de simulación requieren estructuras complejas difíciles de normalizar.
La OODB propone persistir directamente el modelo de objetos, sin traducción.
Años '80 – '90: Gemstone, ObjectStore, Versant. Hoy resurge en nichos con db4o, ObjectDB.

📌 Barry, D. K. (1996). The Object Database Handbook. John Wiley & Sons.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 5 -->

  BLOQUE 1 · Fundamentos
Conceptos clave de las OODB

Identidad de objeto (OID): cada objeto tiene un identificador único e inmutable, independiente de su estado.
Encapsulamiento: los datos solo son accesibles a través de los métodos del objeto.
Herencia: una subclase hereda estructura y comportamiento de su superclase.
Polimorfismo: el mismo mensaje puede producir comportamientos distintos según el receptor.
Tipos complejos nativos: colecciones, referencias a objetos, métodos almacenados junto al dato.

📌 Concepto central: el objeto persiste completo, con su identidad e historia.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 6 -->

  BLOQUE 1 · Comparativa
OODB vs Relacional

Modelo Relacional
Modelo Orientado a Objetos
Tablas, filas, columnas (tipos escalares).
Claves foráneas para relaciones → JOINs.
Normalización formal (1NF, 2NF, 3NF…).
SQL estándar + madurez de ecosistema.
Alta fricción para grafos o jerarquías profundas.
Objetos con atributos, métodos y OID.
Referencias directas → navegación sin JOIN.
Herencia de esquema (es-un, tiene-un).
Lenguaje de consulta: OQL (Object Query Language).
Ideal para dominios ricos: CAD, BIM, simulación.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 7 -->

  BLOQUE 1 · OQL
OQL: consultar un modelo de objetos

OQL

 1  // Definición de clase (esquema OO)
 2  class Empleado {
 3    string nombre;
 4    float salario;
 5    Departamento depto;  // referencia directa
 6    Set<Proyecto> proyectos;
 7  }
 8
 9  // Consulta OQL – sin JOIN explícito
10  SELECT e.nombre, e.depto.nombre
11  FROM   Empleados e
12  WHERE  e.salario > 80000
13  AND    e.depto.ciudad = 'Buenos Aires'

La navegación e.depto.nombre atraviesa la referencia directamente, sin JOIN. El esquema vive en el lenguaje, no solo en la BD.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 8 -->

  BLOQUE 1 · Trade-offs
Ventajas y limitaciones

Ventajas
Limitaciones
Elimina impedancia objeto-relacional.
Queries de navegación eficientes en grafos de objetos.
Versioning de objetos: historial nativo.
Apto para datos no estructurados y complejos.
Integración directa con lenguajes OO.
Menor madurez que RDBMS; ecosistema reducido.
OQL no alcanzó la estandarización de SQL.
Consultas ad-hoc y reporting son más complejos.
Herramientas de BI/ETL no leen OODB de forma nativa.
Escalabilidad horizontal no es punto fuerte.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 9 -->

  BLOQUE 1 · Presente
OODB en la actualidad: nicho y resurgimiento

El auge relacional + ORM (Hibernate, JPA) absorbió gran parte del mercado.
Las OODB persisten en dominios especializados: telecomunicaciones, CAD/BIM, simulaciones científicas.
ObjectDB: OODB nativa para Java; db4o (open source, discontinuado); Versant: enterprise.
Las bases de documentos (MongoDB) recuperan parte de la idea: estructuras anidadas, sin JOIN.
Los ORM modernos implementan lazy loading y caché de objetos como puente objeto-relacional.

📌 Harrison (2015) sitúa las OODB como precursoras del movimiento NoSQL en términos de flexibilidad de esquema.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 10 -->

?
PREGUNTA DISPARADORA
¿Cuándo elegiría una OODB sobre MongoDB para un sistema de diseño asistido por computadora?

Pensá en: herencia de clases, versionado de objetos, consultas de navegación, ecosistema disponible.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 11 -->

02
BLOQUE 2
Bases de Datos
Multidimensionales
El hipercubo de los datos analíticos

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 12 -->

  BLOQUE 2 · Motivación
¿Qué problema resuelven?

Los sistemas OLTP están optimizados para escritura transaccional, no para análisis agregado.
Una empresa necesita responder: '¿Cuánto vendimos por producto, región y mes en Q3-2024?'
En un RDBMS eso requiere JOINs complejos + GROUP BY + filtros → lento sobre millones de filas.
Las bases multidimensionales organizan el dato en cubos OLAP listos para agregación.
Soporte nativo de operaciones: Roll-up, Drill-down, Slice, Dice, Pivot.

📌 Origen: Ralph Kimball (Data Warehouse Toolkit) y Bill Inmon — paradigma dimensional para analítica.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 13 -->

  BLOQUE 2 · Conceptos
Dimensiones y medidas: los dos ejes del cubo

📐
📊
🔲
Dimensión
Medida (Hecho)
Cubo OLAP
Perspectiva de análisis.
Ejemplos: Tiempo, Producto, Región, Canal.
Forman los ejes del cubo.
Tienen jerarquías: Año → Trimestre → Mes → Día.
Valor numérico a analizar.
Ejemplos: Ventas, Cantidad, Costo.
Se agregan con SUM, AVG, MAX.
Viven en la intersección de las dimensiones.
Espacio n-dimensional formado por dimensiones.
Cada celda contiene una o más medidas.
Puede pre-calcularse (MOLAP) o consultarse on-the-fly (ROLAP/HOLAP).

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 14 -->

  BLOQUE 2 · OLAP Ops
Operaciones sobre el cubo

Roll-up (consolidar): sube en la jerarquía. Ej: de Mes → Trimestre → Año.
Drill-down (detallar): baja en la jerarquía. Ej: de País → Provincia → Ciudad.
Slice: fija una dimensión a un valor. Ej: ver solo Q1-2024 (corte en Tiempo).
Dice: aplica filtros en múltiples dimensiones simultáneamente (sub-cubo).
Pivot (rotate): intercambia filas y columnas para cambiar el punto de vista.

📌 Pivert (2018): estas operaciones definen la interfaz cognitiva del analista con el dato.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 15 -->

  BLOQUE 2 · MDX
MDX: consultar cubos OLAP

MDX

 1  -- ¿Ventas por producto y trimestre en 2024?
 2  SELECT
 3    {[Tiempo].[2024].[Q1], [Tiempo].[2024].[Q2],
 4     [Tiempo].[2024].[Q3], [Tiempo].[2024].[Q4]}
 5      ON COLUMNS,
 6    {[Producto].[Categoria].Members}
 7      ON ROWS
 8  FROM [CuboVentas]
 9  WHERE ([Medidas].[Importe_Total])

MDX (Multidimensional Expressions) es el lenguaje estándar para cubos OLAP. SQL Server Analysis Services, SAP BW y Mondrian lo implementan.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 16 -->

  BLOQUE 2 · Implementaciones
MOLAP · ROLAP · HOLAP

MOLAP (Multidimensional)
ROLAP (Relational)
Datos pre-agregados en estructuras multidimensionales propias.
Máxima performance de lectura.
Alta redundancia de almacenamiento.
Ej: Microsoft SSAS, IBM Cognos TM1.
Ideal cuando el cubo cabe en disco y los datos no cambian minuto a minuto.
El cubo se mapea sobre tablas relacionales (star schema, snowflake).
Sin redundancia extra; escala mejor en volumen.
Más lento que MOLAP sin agregados pre-calculados.
Ej: Redshift, BigQuery, Vertica.
Ideal para grandes volúmenes con baja latencia aceptable.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 17 -->

?
PREGUNTA DISPARADORA
¿Por qué un data warehouse usa un esquema en estrella y no el esquema 3NF del sistema transaccional?

Pensá en desnormalización intencional, velocidad de lectura y cardinalidad de los JOINs.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 18 -->

03
BLOQUE 3
Modelado
NoSQL
Diseñar para el acceso, no para la normalización

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 19 -->

  BLOQUE 3 · Filosofía
El cambio de paradigma en modelado

En SQL: modelar entidades y relaciones primero → las consultas vienen después.
En NoSQL: las consultas definen el modelo → el esquema sirve al acceso.
Regla de oro: 'Un documento/registro debe responder a exactamente una consulta crítica.'
Desnormalización controlada: duplicar datos es válido si reduce latencia de lectura.
La consistencia eventual cambia el contrato: diseñar para divergencia transitoria.

📌 Pivert (2018): el diseñador NoSQL piensa primero en el patrón de acceso, luego en la estructura.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 20 -->

  BLOQUE 3 · Principios
Los 3 principios del modelado NoSQL

🎯
📦
⚖️
Query-Driven Design
Embed vs Reference
Read vs Write Trade-off
Identificar primero las consultas críticas (los 'access patterns'). El esquema se construye para servirlas. Sin patrones claros, no hay modelado correcto.
¿Incluir datos relacionados dentro del documento (embed) o referenciarlos por ID? Depende de cardinalidad, frecuencia de acceso y tamaño del sub-documento.
Optimizar lectura (desnormalizar, embed) aumenta coste de escritura. Optimizar escritura (normalizar, reference) agrega latencia de lectura.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 21 -->

  BLOQUE 3 · MongoDB
Modelado documental: embed vs reference

MongoDB

 1  // ✅ EMBED: pedido con ítems (acceso frecuente, dueño claro)
 2  {
 3    _id: ObjectId('...'),
 4    cliente: 'Ana García',
 5    items: [
 6      { producto: 'Laptop', precio: 1200, qty: 1 },
 7      { producto: 'Mouse',  precio: 25,   qty: 2 }
 8    ],
 9    total: 1250
10  }
11
12  // ✅ REFERENCE: producto (dato compartido, mutable)
13  { _id: ObjectId('p1'), nombre: 'Laptop', stock: 42 }

Embed cuando la sub-entidad es 'propiedad exclusiva'. Reference cuando es compartida o muy grande.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 22 -->

  BLOQUE 3 · Neo4j
Modelado en grafos (Neo4j): pensar en relaciones

El dato central es la relación, no la entidad: '¿quién conoce a quién?' importa más que '¿quién es?'
Los nodos representan entidades; las aristas, relaciones con dirección y propiedades.
Regla: si la consulta navega relaciones encadenadas → grafo. Si solo lee propiedades → documental.
Antipatrón: modelar en grafo cuando las relaciones son simples y no se navegan.
Ejemplo: Red social (AMIGO_DE, SIGUE, COMPARTE) → grafo natural. Catálogo de productos → documental.

📌 Neo4j Docs: 'Think in graphs, not tables.'

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 23 -->

  BLOQUE 3 · Cypher
Cypher: modelado y consulta en grafo

Cypher

 1  // Crear nodos y relación
 2  CREATE (ana:Usuario {nombre:'Ana', edad:28})
 3  CREATE (bia:Usuario {nombre:'Bia', edad:31})
 4  CREATE (ana)-[:SIGUE {desde:'2023-01'}]->(bia)
 5
 6  // Amigos de amigos (2 saltos)
 7  MATCH (u:Usuario {nombre:'Ana'})
 8        -[:SIGUE*2]->(recomendado:Usuario)
 9  WHERE NOT (u)-[:SIGUE]->(recomendado)
10  RETURN recomendado.nombre

[:SIGUE*2] navega exactamente 2 aristas. En SQL equivaldría a un doble self-JOIN con subquery.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 24 -->

  BLOQUE 3 · Redis
Modelado clave/valor (Redis): simplicidad extrema

El modelo más simple: una clave única mapea a un valor (string, hash, list, set, sorted set).
El 'modelado' es diseño de keyspace: prefijos, separadores, TTL, tipos de dato.
Convención de claves: <entidad>:<id>:<campo> → Ej: session:u123:token
Hash para datos de usuario, Sorted Set para rankings, List para colas de eventos.
Regla: si la consulta es siempre por clave exacta → Redis. Si necesita filtrar por valor → otra herramienta.

📌 Redis Docs: 'Redis is a data structure server.' Pensar en estructuras, no en tablas.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 25 -->

  BLOQUE 3 · Redis
Modelado en Redis: keyspace y estructuras

Redis CLI

 1  # Hash: perfil de usuario
 2  HSET user:1001 nombre 'Carlos' email 'c@mail.com' plan 'pro'
 3  HGET user:1001 plan   →  'pro'
 4
 5  # Sorted Set: top 5 productos más vendidos
 6  ZADD ranking:ventas 9820 'laptop' 7310 'mouse' 4200 'teclado'
 7  ZREVRANGE ranking:ventas 0 4 WITHSCORES
 8
 9  # Session con TTL (expira en 30 min)
10  SET session:abc123 '{uid:1001,role:admin}'
11  EXPIRE session:abc123 1800

Cada tipo de dato Redis está optimizado para un patrón de acceso específico.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 26 -->

  BLOQUE 3 · Cassandra
Modelado tabular (Cassandra): diseñar para la partición

Cassandra organiza datos en tablas pero sin JOINs ni subqueries: todo debe estar en una tabla.
Partition Key: determina en qué nodo físico vive la fila. Elección crítica para distribución.
Clustering Key: ordena las filas dentro de la partición → permite range queries eficientes.
Regla principal: una tabla por query pattern. Si hay 3 queries distintas → 3 tablas (desnormalizadas).
Antipatrón: allow filtering (ALLOW FILTERING) → escaneo full partition, nunca en producción.

📌 Apache Cassandra Docs: 'Model around your queries, not your data.'

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 27 -->

  BLOQUE 3 · CQL
CQL: modelado para un patrón de acceso

CQL

 1  -- Query objetivo: 'Mensajes de un chat, ordenados por tiempo'
 2
 3  CREATE TABLE mensajes_por_chat (
 4    chat_id   UUID,
 5    timestamp TIMESTAMP,
 6    autor     TEXT,
 7    contenido TEXT,
 8    PRIMARY KEY (chat_id, timestamp)
 9  ) WITH CLUSTERING ORDER BY (timestamp DESC);
10
11  -- Consulta eficiente (usa partition key + clustering)
12  SELECT * FROM mensajes_por_chat
13  WHERE chat_id = ? AND timestamp > ?
14  LIMIT 50;

chat_id es la partition key (todos los mensajes del chat en el mismo nodo). timestamp es la clustering key (orden garantizado).

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 28 -->

  BLOQUE 3 · Errores
Errores frecuentes en modelado NoSQL

✗  Diseñar el esquema NoSQL igual que en SQL, con entidades separadas y JOINs 'manuales' en la aplicación.
✓  Diseñar partiendo de los access patterns: ¿qué queries voy a ejecutar? El modelo sirve a las queries, no al revés.

✗  Usar ALLOW FILTERING en Cassandra o $where en MongoDB para consultas de producción frecuentes.
✓  Crear una tabla/índice específico para cada patrón de acceso. El filtrado full-scan nunca escala.

✗  Embeber documentos sin límite en MongoDB, generando documentos de >16MB o arrays con miles de elementos.
✓  Usar reference cuando la sub-entidad crece sin límite o es compartida por múltiples padres.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 29 -->

04
BLOQUE 4
Comparativa
de Modelos NoSQL
Cuatro paradigmas, cuatro mundos diferentes

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 30 -->

  BLOQUE 4 · Tabla
Comparativa general de modelos NoSQL
| Característica | Documental | Grafo | Clave/Valor | Tabular |
| --- | --- | --- | --- | --- |
| Modelo de dato | JSON/BSON anidado | Nodos + Aristas | Clave → Valor | Filas + Columnas dinámicas |
| Caso ideal | Contenido, catálogos, CMS | Redes, recomendaciones | Caché, sesiones, rankings | Series temporales, IoT, logs |
| Ejemplo | MongoDB | Neo4j | Redis | Cassandra |
| Esquema | Flexible (schema-less) | Flexible | Sin esquema | Parcialmente flexible |
| Lenguaje de query | MQL / Aggregation | Cypher / Gremlin | Comandos simples | CQL (similar a SQL) |
| Escalado horizontal | ✓ Sharding nativo | ✓ (limitado en grafos) | ✓ Clustering | ✓ Diseñado para ello |
| Consistencia | Configurable | ACID (Neo4j single) | Eventual / Config. | Eventual / Quorum |
| Fortaleza clave | Flexibilidad de esquema | Traversal de relaciones | Latencia sub-ms | Escritura masiva |

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 31 -->

  BLOQUE 4 · Latencia
Rendimiento por modelo: latencia típica

<1ms
~5ms
~10ms
~15ms
Redis: lectura/escritura de clave con estructura en memoria
Cassandra: escritura masiva distribuida con replicación
MongoDB: lectura de documento con índice sobre SSD
Neo4j: traversal de grafo de 3 saltos en grafo local

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 32 -->

  BLOQUE 4 · CAP
Consistencia vs Disponibilidad

Alta Disponibilidad
(Eventual Consistency)
Consistencia Fuerte
(Strong Consistency)
Redis Cluster, Cassandra, DynamoDB.
Escrituras siempre aceptadas → lectura puede ver datos desactualizados.
Ideal para sistemas que toleran divergencia breve: feeds, sesiones, contadores.
CAP: AP (Availability + Partition Tolerance).
Modelos de consistencia: eventual, quorum, por sesión.
Neo4j (modo standalone), MongoDB con w:majority.
La escritura no confirma hasta que todos los réplicas la aceptaron.
Ideal para datos financieros, inventario, reservas.
CAP: CP (Consistency + Partition Tolerance).
Costo: mayor latencia de escritura, menor disponibilidad bajo partición.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 33 -->

  BLOQUE 4 · Índices
Índices en NoSQL: similitudes y diferencias

MongoDB: índices B-tree por campo, compuestos, geoespaciales, de texto completo (Atlas Search).
Cassandra: índice secundario existe pero es costoso; preferir tablas desnormalizadas adicionales.
Neo4j: índices de propiedades sobre nodos (B-tree, full-text, vector desde 5.x).
Redis: los Sorted Sets son el índice nativo para rankings; RediSearch añade índices secundarios.
Principio común: el índice no reemplaza al buen modelado; es el último recurso, no el primero.

📌 Antipatrón universal: crear un índice por cada campo 'por las dudas'. Cada índice cuesta en escritura.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 34 -->

?
PREGUNTA DISPARADORA
¿En qué escenario usarías MongoDB Y Redis en la misma aplicación?

Ejemplo: e-commerce. ¿Cuál maneja el catálogo y cuál el carrito de compras? ¿Por qué?

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 35 -->

05
BLOQUE 5
Criterios de
Selección
El mejor motor es el que resuelve tu problema

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 36 -->

  BLOQUE 5 · Framework
Framework de selección NoSQL

1. Estructura del dato: ¿plana, jerárquica, en red, tabular de alta cardinalidad?
2. Patrón de acceso: ¿por clave exacta, por rango, por navegación de relaciones, por agregación?
3. Volumen y velocidad: ¿miles de lecturas/s? ¿escrituras masivas? ¿latencia sub-ms?
4. Consistencia necesaria: ¿transacciones ACID? ¿tolerancia a eventual consistency?
5. Escalabilidad: ¿escala vertical (más potente) o horizontal (más nodos)?

📌 Harrison (2015): 'There is no one-size-fits-all database.' Cada motor optimiza un subconjunto del espacio de trade-offs.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 37 -->

  BLOQUE 5 · Antipatrones
Señales de alerta por modelo
| Situación | Motor erróneo | Por qué es un problema | Alternativa correcta |
| --- | --- | --- | --- |
| Consultas ad-hoc por campos arbitrarios | Cassandra | Requiere ALLOW FILTERING → full scan | MongoDB |
| Grafo de alta profundidad (6+ saltos) | MongoDB | Múltiples queries encadenadas en app | Neo4j |
| Sesiones de usuario (millones) | Neo4j | Overhead de grafo para dato simple | Redis |
| Series temporales de IoT (millones/día) | MongoDB | Documentos pequeños → overhead BSON | Cassandra / InfluxDB |
| Transacciones bancarias ACID estrictas | Redis (solo) | Sin persistencia duradera por defecto | PostgreSQL / CockroachDB |

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 38 -->

  BLOQUE 5 · Políglota
Persistencia polimórfica: la solución real

Las aplicaciones modernas no usan un solo motor: usan el correcto para cada problema.
Polyglot Persistence (Martin Fowler, 2011): cada servicio/dominio elige su propio motor.
Ejemplo e-commerce: PostgreSQL (órdenes), MongoDB (catálogo), Redis (sesiones/carrito), Neo4j (recomendaciones), Elasticsearch (búsqueda).
El desafío no es técnico sino organizacional: consistencia eventual entre motores, sincronia de datos.
Event sourcing y mensajería asíncrona (Kafka) son el pegamento que sincroniza motores distintos.

📌 Este concepto será central en la segunda entrega del TP Integrador.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 39 -->

  BLOQUE 5 · Decisión
¿Relacional o NoSQL? La pregunta correcta

🏦
🚀
🔀
Elegir Relacional cuando...
Elegir NoSQL cuando...
Elegir Políglota cuando...
Relaciones complejas y consultas ad-hoc. Transacciones ACID estrictas. Esquema estable y bien comprendido. Reporting y BI con SQL estándar. Equipo con expertise SQL consolidado.
Escala horizontal masiva desde el inicio. Esquema flexible o en evolución rápida. Acceso predecible y alta velocidad. Dato semiestructurado o sin esquema fijo. Baja latencia crítica (sub-ms).
Múltiples dominios con naturalezas distintas. Microservicios independientes por bounded context. Diferentes SLAs de consistencia por módulo. Complejidad organizacional que lo justifica.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 40 -->

  BLOQUE 5 · Errores
Errores frecuentes en selección de motor

✗  Elegir NoSQL porque 'es moderno' o 'escala mejor', sin analizar el patrón de acceso ni la consistencia requerida.
✓  Seleccionar el motor basándose en estructura del dato, acceso esperado, consistencia y volumen. La moda no es un criterio técnico.

✗  Asumir que NoSQL es siempre más rápido que SQL. En muchos casos un RDBMS con índices correctos supera a un NoSQL mal modelado.
✓  Comparar sobre el caso de uso específico. Un MongoDB sin índice es más lento que PostgreSQL con índice. El modelo importa más que el paradigma.

✗  Usar un solo motor NoSQL para todos los dominios de la aplicación, forzando el modelo donde no encaja.
✓  Aplicar persistencia polimórfica: cada dominio usa el motor que mejor sirve a sus access patterns.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 41 -->

06
BLOQUE 6
Casos Reales
& Cierre
De la teoría al sistema productivo

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 42 -->

  BLOQUE 6 · Caso Netflix
Caso: arquitectura de datos de Netflix

Cassandra: historial de reproducciones y recomendaciones → escritura masiva distribuida globalmente.
Redis: caché de sesión de usuario y configuración de A/B testing → latencia sub-ms.
MySQL: facturación y suscripciones → ACID estricto.
Elasticsearch: búsqueda de contenido → full-text search eficiente.
EVCache (Redis-based): invalidación de caché distribuida en múltiples regiones.

📌 Fuente: Netflix Tech Blog. Cada motor resuelve un problema específico; ninguno reemplaza a los otros.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 43 -->

  BLOQUE 6 · Caso LinkedIn
Caso: LinkedIn y el grafo de conexiones

El grafo 'conocés a alguien' tiene 800M+ nodos y miles de millones de aristas.
Consulta típica: '¿Hay alguna conexión de 2do grado entre X e Y?' → traversal de grafo.
Solución: motor de grafo interno (Espresso + índices de conexión propios), no Neo4j a esa escala.
Kafka como bus de eventos para propagar actualizaciones del grafo a otros sistemas.
Enseñanza: a escala extrema, los motores genéricos ceden ante soluciones especializadas. Neo4j sí funciona a escala empresarial media.

📌 LinkedIn como ejemplo de que la decisión de motor es contextual al volumen y al equipo disponible.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 44 -->

  BLOQUE 6 · Caso E-Commerce
Caso: sistema de e-commerce – diseño políglota

PostgreSQL: órdenes, pagos, facturación (ACID, transacciones, consistencia fuerte).
MongoDB: catálogo de productos (esquema variable por categoría, búsqueda flexible).
Redis: carrito de compras (TTL, baja latencia), sesiones, rate limiting.
Neo4j: motor de recomendaciones 'compraste esto, quizás te guste...' (traversal de grafo).
Kafka: conecta los sistemas → un pago confirmado actualiza stock en PostgreSQL y dispara recomendaciones en Neo4j.

📌 Este es el patrón arquitectónico que trabajarán en la 2da entrega del TP Integrador.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 45 -->

  BLOQUE 6 · CAP
Teorema CAP: recordatorio aplicado

CP: Consistencia + Partición
AP: Disponibilidad + Partición
Prioriza que todos los nodos vean el mismo dato.
Si hay partición de red → el sistema se vuelve no disponible antes que responder con dato viejo.
Ej: MongoDB con w:majority, HBase, ZooKeeper.
Caso de uso: saldos bancarios, inventario crítico, reservas de vuelo.
Siempre responde, incluso bajo partición de red.
Los datos pueden ser temporalmente inconsistentes entre nodos.
Ej: Cassandra, DynamoDB, CouchDB.
Caso de uso: feeds sociales, analytics, sesiones, contadores de likes.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 46 -->

  BLOQUE 6 · Repaso
Resumen de modelos NoSQL vistos en el curso

MongoDB (Clase 3-4): modelo documental, MQL, Aggregation Pipeline, índices, atlas.
Neo4j (Clase 5): modelo de grafo, Cypher, LPG, traversal, casos de red.
Redis (Clase 6): clave/valor, tipos de dato, TTL, pub/sub, persistencia RDB/AOF.
Cassandra (Clase 7): tabular, CQL, partition/clustering key, consistencia configurable.
Hoy: OODB, Multidimensional, Modelado NoSQL, Comparativa y Criterios.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 47 -->

?
PREGUNTA DISPARADORA
Para el TP Integrador: ¿qué motor usarían para el componente de búsqueda de su dominio? ¿Por qué no sería MongoDB solo?

Considerá: búsqueda full-text, filtros combinados, relevancia, volumen de queries.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 48 -->

  BLOQUE 6 · Bibliografía
Recursos para profundizar

Harrison, G. (2015). Cap. 4: Object & Object-Relational Databases. Cap. 11: Selecting the Right Database. Apress.
Pivert, O. (2018). Cap. 1: NoSQL Data Models – Trends & Challenges. ISTE.
Deka, G. C. (2017). Cap. 3: NoSQL Models Compared. CRC Press.
Barry, D. K. (1996). The Object Database Handbook – caps. 1-3. John Wiley & Sons.
Documentación oficial: docs.mongodb.com · neo4j.com/docs · redis.io/docs · cassandra.apache.org/doc

📌 Para el modelado NoSQL: blog.mongodb.com/schema-design y neo4j.com/blog/data-modeling-pitfalls

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes:

<!-- Slide number: 49 -->

RESUMEN
3 ideas que deben quedar claras hoy

1
OODB y bases multidimensionales resuelven problemas que el modelo relacional aborda con fricciones: datos complejos y análisis multidimensional.

2
El modelado NoSQL es query-driven: el acceso esperado define la estructura, no la normalización clásica.

3
No existe un modelo NoSQL universal. La selección correcta requiere analizar acceso, consistencia, escala y complejidad del dominio.

📚  Para la próxima clase: Leer cap. 8 de Harrison (2015) sobre acceso desde aplicaciones. Pensar cómo integrarías un modelo polimórfico con los dominios del TP integrador.

Ingeniería de Datos II · Ing. Damián Arnaudo
UADE · 2026

### Notes: