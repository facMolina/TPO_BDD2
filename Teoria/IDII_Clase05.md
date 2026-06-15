| N   | I N G E | N I E R Í A   | D E   D AT | O S   I I |     |
| --- | ------- | ------------- | ---------- | --------- | --- |
Clase 5  ·  Unidad II
Neo4j en Profundidad
y Cypher Avanzado
| Internals |     | ACID/Raft | CAP | Cypher Medio | Cypher Avanzado |
| --------- | --- | --------- | --- | ------------ | --------------- |
Ing. Damián Arnaudo  ·  1er Cuatrimestre 2026
Facultad de Ingeniería y Ciencias Exactas — UADE
Ingeniería de Datos II  ·  UADE  ·  Ing. Damián Arnaudo

Agenda
00 Repaso exprés Clase 4
01 Neo4j bajo el capó: almacenamiento · ACID · WAL · MVCC · Raft · CAP
02 Cypher Nivel Medio: WHERE · Agregaciones · WITH · MERGE · Índices
03 Cypher Nivel Avanzado: paths · APOC · GDS · Algoritmos
04 Modelado en grafos y casos reales (LinkedIn · Netflix · Fraude)
05 Caso integrador tipo parcial · Errores frecuentes · Cierre
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

Repaso exprés — Clase 4: lo que necesitás saber hoy
Conceptos base que usaremos durante toda la clase:
| ○ Nodo | → Relación | {} Property Graph |
| ------ | ---------- | ----------------- |
Entidad del dominio. Labels +  Puntero físico. Tipo obligatorio. O(1) por
Nodos y relaciones con pares clave:valor.
| propiedades. | traversal. |                  |
| ------------ | ---------- | ---------------- |
| ⟳ Traversal  | N Neo4j    | () Cypher básico |
CREATE · MATCH · RETURN · SET ·
Seguir punteros. Sin escanear índices. ACID · Cypher · Native Graph Storage.
DELETE
Ingeniería de Datos II  ·  UADE  ·  Ing. Damián Arnaudo

Teoría profunda
01
Neo4j bajo el capó
Almacenamiento nativo · ACID · WAL · MVCC · Raft · Consistencia causal · CAP
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

Almacenamiento nativo de grafos — Native Graph Storage
Dos filosofías radicalmente distintas para guardar relaciones entre datos:
BD Relacional / Documental Neo4j — Native Graph Storage
• Relaciones = JOIN calculado en cada query • Relaciones = punteros físicos almacenados
• Escanea tablas/índices buscando coincidencias • Traversal = seguir puntero: O(1) por salto
• Costo crece con el volumen total: O(n) vs • Costo independiente del volumen total
• Más datos → más lento, aunque sean ajenos • 10M de nodos ajenos no afectan tu traversal
• Traversal profundo: degradación exponencial • Traversal profundo: costo constante
• Relación es un número (FK), no una estructura • Relación ES una estructura con punteros
📖 Regla de Harrison (2015): si las relaciones son tan importantes como los datos, usá grafos. Si los datos son lo central, usá SQL.
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

Estructura interna: Node Store y Relationship Store
Registros de tamaño fijo → acceso por ID = offset directo en disco. Sin índice, sin búsqueda. O(1) puro.
Node Record  (15 bytes fijos) Relationship Record  (34 bytes fijos)
| 1     |               | 1     |                   |
| ----- | ------------- | ----- | ----------------- |
| inUse | ¿Nodo activo? | inUse | ¿Relación activa? |
byte byte
| 4         |                    | 4           |               |
| --------- | ------------------ | ----------- | ------------- |
| nextRelId | → Primera relación | firstNodeId | → Nodo origen |
bytes bytes
| 4          |                     | 4            |                |
| ---------- | ------------------- | ------------ | -------------- |
| nextPropId | → Primera propiedad | secondNodeId | → Nodo destino |
bytes bytes
| 5   |     | 4   |     |
| --- | --- | --- | --- |
labelField → Labels del nodo relationTypeId → Tipo de relación
bytes bytes
| 1     |                | 4              |                        |
| ----- | -------------- | -------------- | ---------------------- |
| extra | Flags internos | firstPrevRelId | ← Rel. anterior nodo 1 |
byte bytes
4
|     |     | firstNextRelId | → Rel. siguiente nodo 1 |
| --- | --- | -------------- | ----------------------- |
bytes
💡  Tamaño fijo → offset = ID × tamaño_registro. Neo4j calcula la posición exacta en disco sin ningún índice. Eso es O(1) puro.
Ingeniería de Datos II  ·  UADE  ·  Ing. Damián Arnaudo

Index-free adjacency — La ventaja central de Neo4j
Index-free adjacency
Cada nodo almacena un puntero directo a su lista de relaciones. Para navegar al vecino no se consulta ningún índice —
simplemente se sigue el puntero. El costo del traversal es independiente del tamaño total del grafo.
SQL — JOIN lookup Neo4j — Pointer follow
SQL Neo4j
SELECT * // Nodo 42 → puntero → rel-list
FROM friends f // Rel-list → puntero → nodo vecino
JOIN users u ON f.friend_id=u.id // Sin índice, sin escaneo
WHERE f.user_id = 42 // O(1) por salto
-- Busca en B-tree: O(log n) // Igual costo con 10 o con
-- n = tamaño de la tabla amigos // 100 millones de nodos ajenos
-- 100M amigos → más lento vs
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

Property Store · Label Store · String Store
El almacenamiento de Neo4j está dividido en stores especializados. Cada uno optimiza un tipo de dato.
Property Store Label Store
Cadena enlazada de bloques de propiedad. IDs de labels por nodo.
Cada bloque: clave (4B) + tipo (4 bits) + valor (24B). Token Store: nombre ↔ ID entero.
Propiedades largas → Dynamic Store. Filtrado eficiente por label sin escanear todos.
String / Array Store Index Store (Schema)
Almacenamiento para strings > 24 chars y arrays. Índices B-tree y Full-text sobre propiedades.
Referenciado desde Property Store. Lookup inicial por propiedad → nodo ID.
No rompe el tamaño fijo del bloque principal. Una vez en el nodo: traversal por punteros.
💡 Propiedades numéricas o booleanas son más eficientes que strings (sin indirección al Dynamic Store). Preferir edad:28 sobre edad:'28'.
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

ACID en Neo4j — Parte 1: Atomicidad y Consistencia
Neo4j garantiza transacciones ACID completas. Vemos cada propiedad con ejemplos concretos.
Atomicidad
A Todo o nada. Si cualquier operación dentro de la TX falla, el grafo vuelve al estado anterior.
TX
// Si este bloque falla a mitad → ROLLBACK total
BEGIN // en driver: session.beginTransaction()
CREATE (ana:Person {name:'Ana'})
CREATE (luis:Person {name:'Luis'})
CREATE (ana)-[:AMIGA_DE]->(luis) // si falla aquí → ningún nodo queda
COMMIT
Consistencia
C El grafo pasa de un estado válido a otro estado válido. Los constraints se verifican al COMMIT.
Constraint
// Constraint de unicidad: viola → TX rechazada
CREATE CONSTRAINT person_email
FOR (p:Person) REQUIRE p.email IS UNIQUE
// Intento de duplicar: TX rechazada, grafo intacto
CREATE (dup:Person {email:'ana@uade.edu.ar'}) // ERROR
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

ACID en Neo4j — Parte 2: Aislamiento (MVCC) y Durabilidad (WAL)
Aislamiento — MVCC (Multi-Version Concurrency Control)
I
Las transacciones concurrentes trabajan sobre versiones independientes del dato.
TX-A lee una versión consistente del nodo aunque TX-B lo esté modificando simultáneamente.
Neo4j usa locks optimistas: detecta conflictos al COMMIT, no al inicio.
TX-A (lectura) — ve v1.0 TX-B (escritura) — ve v1.1 TX-C (lectura) — ve v1.0
Durabilidad — Write-Ahead Log (WAL)
D TODA transacción se escribe en el log ANTES de aplicarse al store físico.
Si el servidor crashea a mitad de un write: el log permite reconstruir el estado al reiniciar.
El log es append-only → muy rápido (escritura secuencial en disco).
1 TX COMMIT 2 Escribe en WAL 3 ACK al cliente 4 Aplica al Store
💡 Si el servidor se apaga luego del paso 2 pero antes del 4, el WAL permite re-aplicar la TX al reiniciar. Los datos NO se pierden.
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

Ciclo de vida de una transacción en Neo4j
Seguimos un UPDATE de propiedad desde el driver hasta el disco, paso a paso.
Driver abre TX
1 session.beginTransaction() — Neo4j reserva un ID de TX y abre snapshot MVCC
Cypher ejecuta
2 Query planner optimiza. Runtime modifica el nodo en memoria (buffer pool, no en disco aún)
Verificar constraints
3 Se comprueban todos los constraints activos. Si falla → ROLLBACK automático
WAL append
4 Los cambios se serializan y escriben en el log secuencial. Operación rápida (append-only)
ACK al cliente
5 Una vez que el log es fsync'd, se confirma al cliente que la TX fue committed
Checkpoint async
6 El buffer pool eventualmente persiste los cambios al Node/Rel Store. Puede ser posterior
⚠ El cliente recibe ACK en el paso 5, no en el 6. Esto significa que un crash DESPUÉS del ACK pero ANTES del checkpoint NO pierde datos — el
WAL los reescribe al reiniciar.
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

MVCC en profundidad — Concurrencia sin bloqueos de lectura
Multi-Version Concurrency Control: múltiples transacciones ven versiones diferentes y consistentes del mismo dato.
T=0 T=1 T=2 T=3 T=4
TX-A (READ) — ve versión v1 todo el tiempo
TX-A: lee nodo.edad = 28 (snapshot T=1)
TX-B (WRITE) → v2
TX-B: escribe edad = 29, commit T=3
TX-C (READ) — ve versión v2 (post-commit)
TX-A: sigue leyendo edad = 28 (su snapshot) TX-C: lee edad = 29 (versión actualizada)
🔑 Resultado: TX-A y TX-C ven versiones distintas del mismo nodo, ambas consistentes. Sin bloquear lecturas. Sin dirty reads.
💡 Conflicto: si TX-A y TX-B modifican el MISMO nodo, Neo4j detecta el conflicto al COMMIT con un DeadlockDetectedException y hace
rollback de la TX perdedora.
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

Clustering Neo4j — Protocolo Raft
Neo4j Enterprise usa Raft para distribuir escrituras. Fórmula de tolerancia: N = 2F + 1 (N nodos para tolerar F fallas).
Core Servers (escritura + Raft) Read Replicas (lectura)
R R
N N N
RR-1 RR-2
LEADER FOLLOWER FOLLOWER
• Escrituras → leader → propaga a followers • Solo lectura — escalan horizontalmente
• Commit cuando mayoría confirma (quorum) • Sincronizan desde Core (asíncrono)
• 3 nodos → tolera 1 falla | 5 nodos → tolera 2 fallas • No votan en Raft
• Elección de nuevo leader si el actual falla • Para analytics y lecturas masivas
📌 Producción recomendada: 3 o 5 Core Servers. Agregar Read Replicas según demanda de lectura sin impactar escritura.
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

Raft en detalle — Elección de leader y replicación de log
Raft garantiza que siempre hay UN único leader y que los logs de los followers son idénticos al del leader.
Elección de leader Replicación de log (escritura)
Raft
1 Leader heartbeat falla (timeout) // Secuencia de replicación Raft:
1. Cliente → AppendEntry → Leader
2. Leader agrega al log local (term+index)
2 Follower se convierte en Candidate
3. Leader envía AppendEntries a followers
4. Followers confirman (ACK) al leader
5. Mayoría ACK → Leader commits
3 Envía RequestVote a todos los peers
6. Leader notifica commit a followers
7. Cliente recibe confirmación
4 Mayoría responde VoteGranted
5 Candidate se convierte en Leader
🔑 'Term' = número de mandato del leader. Cada elección incrementa el term. Permite detectar mensajes de leaders obsoletos.
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

Consistencia causal — Bookmarks y read-your-writes
En un cluster, una escritura en Core puede tardar en propagarse a las Read Replicas. ¿Cómo garantizamos que leemos lo que
acabamos de escribir?
Cliente escribe en Core Server (leader)
1 Crea (ana:Person {name:'Ana'}) — TX committed
Core devuelve un Bookmark
2 Token = número de secuencia en el WAL: ej. bookmark:tx-1234
Cliente envía read query + Bookmark a Read Replica
3 'Dame todos los :Person' + bookmark:tx-1234
Read Replica verifica su posición en el log
4 Si su log < tx-1234 → espera catch-up antes de responder
Read Replica responde garantizando el dato
5 Su log alcanzó tx-1234 → incluye a Ana en la respuesta
💡 El Bookmark es transparente para el desarrollador si usa el driver oficial de Neo4j. El driver lo maneja automáticamente en una misma
sesión.
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

CAP y Neo4j — Análisis crítico
El teorema CAP (Brewer, 2000): en presencia de una Partición de red, solo se puede garantizar Consistencia O Disponibilidad,
no ambas.
Neo4j y CAP
Consistencia
C
Standalone:
→ Sin partición
→ CP trivialmente
Cluster (Raft):
→ Partición de red
N → Core Servers
rechazan escrituras
sin quorum
CP → Prioriza C sobre A
→ Posición: CP
Read Replicas:
→ Pueden ser AP
A P durante partición
Disponibilidad Part. Red
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

CAP en la práctica — ¿Qué pasa durante una partición?
Caso concreto: 5 Core Servers. La red se divide: 3 nodos en grupo A, 2 en grupo B.
Grupo A (3 nodos — mayoría) Grupo B (2 nodos — minoría)
✓ Tiene quorum → puede elegir leader ✗ Sin quorum → NO puede elegir leader
✓ Acepta escrituras y lecturas ✗ Rechaza escrituras (DeadlockException)
✓ Mantiene Consistencia ✓ Puede servir lecturas stale (R. Replicas)
→ Sacrifica disponibilidad del cluster completo → Disponible para lectura, no para escritura
⚠ Durante la partición, el Grupo B rechaza escrituras con ConstraintViolationException o TransactionFailureException. La aplicación DEBE
manejar este caso.
Comparativa CAP:
Neo4j = CP · MongoDB (default) = CP · Cassandra = AP · CouchDB = AP · Redis Cluster = CP
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

Tipos de consistencia — ¿Cuándo importa para tu sistema?
No siempre se necesita consistencia fuerte. Entender los requisitos del negocio es clave para elegir el modelo correcto.
Consistencia Fuerte (Neo4j standalone / cluster con quorum)
Casos:
Toda lectura siempre ve el último write commiteado.
Banca, compliance, KYC, gestión de
Ideal para: datos financieros, auditoría, grafos de identidad.
permisos
Consistencia Causal (Neo4j cluster con bookmarks)
Casos:
Garantizás read-your-writes dentro de una sesión.
Redes sociales, plataformas de cursos, e-
Otras sesiones pueden tener lag breve pero causal.
commerce
Consistencia Eventual (Read Replicas sin bookmark)
Casos:
Las réplicas pueden estar levemente desactualizadas.
Dashboards, reportes, recomendaciones
Aceptable cuando los datos cambian lento y las lecturas son analíticas.
batch
💡 Regla práctica: si el usuario espera ver inmediatamente lo que acaba de hacer → consistencia causal mínima. Si escribe y se va → eventual
puede ser suficiente.
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

Performance Neo4j — Benchmarks y escenarios críticos
¿Cuándo Neo4j realmente gana y cuándo no? Datos concretos para argumentar en el parcial y en la vida real.
| Operación | Neo4j | PostgreSQL | Ganador |
| --------- | ----- | ---------- | ------- |
Traversal profundo (6 niveles) ~5 ms ~minutos / timeout Neo4j x10,000+
| Lookup por ID de nodo       | ~1 ms      | ~1 ms         | Empate          |
| --------------------------- | ---------- | ------------- | --------------- |
| JOIN simple (2 tablas)      | ~3 ms      | ~2 ms         | PostgreSQL gana |
| Aggregation (COUNT/SUM/AVG) | ~20 ms     | ~5 ms         | PostgreSQL gana |
| Inserción masiva (1M filas) | ~12 s      | ~8 s          | PostgreSQL gana |
| Shortest path (1B nodos)    | ~200 ms    | Impracticable | Neo4j x500+     |
| Community detection         | ~2 s (GDS) | No nativo     | Neo4j gana      |
⚠  Benchmarks son indicativos. Los resultados reales dependen del volumen de datos, el hardware, los índices y el modelo de datos
específico.
Ingeniería de Datos II  ·  UADE  ·  Ing. Damián Arnaudo

Resumen Bloque 01 — Neo4j bajo el capó
7 conceptos que deben estar claros antes de continuar con Cypher avanzado:
Native Graph Storage
1 Relaciones = punteros físicos. Traversal O(1) por salto. Independiente del volumen total.
Node Store / Rel Store
2 Registros de tamaño fijo. Acceso por ID = offset calculado. Sin índice en el traversal.
Index-free adjacency
3 Cada nodo tiene puntero directo a su lista de relaciones. SQL usa índice. Neo4j usa puntero.
ACID completo
4 Atomicidad + Consistencia + Aislamiento (MVCC) + Durabilidad (WAL). Sin excepciones.
WAL — Write-Ahead Log
5 Log secuencial. Escribe antes de aplicar al store. Recuperación tras crash garantizada.
Clustering Raft N=2F+1. Core Servers (quorum/escritura) + Read Replicas (escala/lectura). Bookmarks =
6
causal.
CAP — posición CP
7 Frente a partición: prioriza Consistencia. Cluster rechaza escrituras sin quorum.
? Pregunta de reflexión: ¿En qué escenario concreto el WAL NO puede prevenir pérdida de datos? (Pista: pensar en el storage físico)
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

Nivel Medio
02
Cypher Nivel Medio
WHERE avanzado · Agregaciones · WITH · MERGE · Índices
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

WHERE avanzado — Filtros ricos en Cypher
WHERE en Cypher es mucho más expresivo que SQL: soporta pattern matching, operadores de texto y predicados existenciales.
Cypher
// Comparación y lógica
MATCH (p:Person)
WHERE p.edad >= 25 AND p.ciudad = 'Buenos Aires' RETURN p.name
// Operadores de texto
MATCH (p:Person) WHERE p.name CONTAINS 'Ana' RETURN p
MATCH (p:Person) WHERE p.email ENDS WITH '@uade.edu.ar' RETURN p
MATCH (p:Person) WHERE p.name STARTS WITH 'Mar' RETURN p
// IS NULL / IS NOT NULL
MATCH (p:Person) WHERE p.email IS NOT NULL RETURN p.name, p.email
// Pattern predicate: filtra por existencia de relación
MATCH (p:Person)
WHERE (p)-[:AMIGO_DE]->(:Person {name:'Ana'})
RETURN p.name
// NOT existencial
MATCH (p:Person)
WHERE NOT (p)-[:BLOQUEADO_POR]->() RETURN p
// Regex nativo (básico)
MATCH (p:Person) WHERE p.name =~ 'A.*' RETURN p.name
💡 Los pattern predicates en WHERE son muy poderosos: filtran por existencia de conexiones sin añadir esas conexiones al MATCH principal
Inge(nsieinría c doel Duamtons aII s · eUxAtDrEa )· . Ing. Damián Arnaudo

Agregaciones y WITH — GROUP BY implícito + HAVING
Cypher
// Contar amigos por persona
MATCH (p:Person)-[:AMIGO_DE]->(a)
RETURN p.name AS Persona, COUNT(a) AS Amigos
ORDER BY Amigos DESC
// WITH como HAVING: filtrar después de agregar
MATCH (p:Person)-[:AMIGO_DE]->(a)
WITH p, COUNT(a) AS cant
WHERE cant > 5 // ← esto es el HAVING
RETURN p.name, cant ORDER BY cant DESC
// collect(): lista de valores agrupados
MATCH (e:Company)<-[:TRABAJA_EN]-(p:Person)
RETURN e.name AS Empresa,
collect(p.name) AS Equipo,
COUNT(p) AS TotalEmpleados
// Estadísticas por ciudad
MATCH (p:Person)
RETURN p.ciudad,
COUNT(p) AS cantidad,
AVG(p.edad) AS edadPromedio,
MIN(p.edad) AS minima,
MAX(p.edad) AS maxima
ORDER BY cantidad DESC
⚠ No existe GROUP BY explícito en Cypher: el agrupamiento es automático por las variables NO-agregadas del RETURN/WITH. Si no entendés
por qué agrupó así, revisá qué variables no llevan función de agregación.
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

OPTIONAL MATCH · UNWIND · MERGE — Tres cláusulas clave
|     | OPTIONAL |     | UNWIND |     | MERGE |
| --- | -------- | --- | ------ | --- | ----- |
// OPTIONAL MATCH = LEFT JOIN // UNWIND: lista → filas // MERGE = upsert
MATCH (p:Person) UNWIND ['Ana','Luis','Pedro'] MERGE (p:Person {name:'Ana'})
| OPTIONAL MATCH |     |   AS nombre |     |   ON CREATE SET |     |
| -------------- | --- | ----------- | --- | --------------- | --- |
  (p)-[:TRABAJA_EN]- MERGE (p:Person {name:      p.creado = datetime(),
| >(e:Company)            |     | nombre})      |     |     p.visitas = 1             |     |
| ----------------------- | --- | ------------- | --- | ----------------------------- | --- |
| RETURN p.name,          |     | RETURN p.name |     |   ON MATCH SET                |     |
|   coalesce(e.name,'Sin  |     |               |     |     p.visitas = p.visitas + 1 |     |
trabajo') // Bulk insert desde lista RETURN p.name, p.visitas
  AS Empresa WITH [{n:'BsAs',p:'ARG'},
      {n:'Lima', p:'PER'}] AS  // MERGE relación (nodos
cs separados)
UNWIND cs AS c MERGE (a:Person {name:'Ana'})
MERGE (city:City {name:c.n}) MERGE (b:Person
SET city.pais = c.p {name:'Luis'})
MERGE (a)-[:AMIGA_DE]->(b)
| Cláusula       | SQL equivalente |                           | Cuándo usarla              |     |     |
| -------------- | --------------- | ------------------------- | -------------------------- | --- | --- |
| OPTIONAL MATCH |                 | LEFT OUTER JOIN           | Incluir nodos sin relación |     |     |
| UNWIND         |                 | UNNEST / lateral          | Explotar listas en filas   |     |     |
| MERGE          |                 | UPSERT / INSERT OR UPDATE | Crear solo si no existe    |     |     |
⚠  MERGE nodo + relación en un solo MERGE puede crear duplicados. Siempre: MERGE nodo A, MERGE nodo B, MERGE relación.
Ingeniería de Datos II  ·  UADE  ·  Ing. Damián Arnaudo

Índices y Constraints — Performance y unicidad
DDL B-tree
// Crear índice B-tree (default)
CREATE INDEX person_name FOR (p:Person) ON
(p.name) Default. Exacto, rangos, orden. Para mayoría de propiedades.
// Índice compuesto
CREATE INDEX person_loc FOR (p:Person) ON
Full-text
(p.ciudad, p.edad)
// Constraint UNIQUE (crea índice Texto libre (Lucene). Para CONTAINS masivo y búsqueda
automáticamente) semántica.
CREATE CONSTRAINT person_email
FOR (p:Person) REQUIRE p.email IS UNIQUE
Point
// Constraint NOT NULL
CREATE CONSTRAINT person_name_nn
FOR (p:Person) REQUIRE p.name IS NOT NULL Geoespacial. Para distancia/área (gds.alpha.distance).
// Ver índices y constraints activos
SHOW INDEXES
Composite
SHOW CONSTRAINTS
// Eliminar índice
Múltiples propiedades. Solo útil si la query usa TODAS las props.
DROP INDEX person_name
💡 Un índice solo acelera el PUNTO DE ENTRADA al grafo (lookup inicial por propiedad → nodo ID). Una vez en el nodo, el traversal usa
punteros — el índice ya no interviene.
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

✏ EJERCICIO PRÁCTICO — Nivel Medio: Sistema de Películas (Neo4j Movie Graph)
:Movie {title,released,tagline} · :Person {name,born}
[:ACTED_IN {roles:[]}] · [:DIRECTED] · [:REVIEWED {rating,summary}] · [:PRODUCED]
1 Películas del año 2000 en adelante, ordenadas por released DESC, mostrando título y año.
2 Actores en más de 3 películas. Mostrar nombre y cantidad, ORDER BY cantidad DESC.
3 Películas con 3+ actores: título + lista de actores (collect). Usar WITH + WHERE.
4 Actores que NO dirigieron ninguna película. (Pista: NOT + pattern predicate)
5 Mejor valorada: título, AVG(rating) redondeado, cantidad de reviews. Solo con 2+ reviews.
6 [DIFÍCIL] Actores que trabajaron en una película dirigida por Tom Hanks (sin importar si Tom actúa).
Ingeniería de Datos II · UDAaDtEa s· e Int:g .N Deaom4iáj ns aAnrndabudoox 'Movie Graph' (:play movie-graph) · Tiempo: 20 min · Entregar screenshot + consultas comentadas

Nivel Avanzado
03
Cypher Nivel Avanzado
Paths · shortestPath · CALL · APOC · GDS · Algoritmos
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

Pattern matching avanzado — Relaciones variables y paths
Cypher permite traversal de profundidad variable en una sola línea. Potencia que SQL no puede igualar.
Cypher
// Profundidad exacta
MATCH (a:Person)-[:CONOCE*2]->(b:Person)
RETURN a.name, b.name
// Rango variable
MATCH (a:Person)-[:CONOCE*1..4]->(b:Person)
RETURN a.name, b.name
// Capturar path como variable
MATCH p=(a:Person {name:'Ana'})-[:CONOCE*1..3]->(b:Person)
RETURN p, length(p) AS profundidad
// Predicados sobre el path (ALL, ANY, NONE)
MATCH p=(a:Person)-[rels*1..3]->(b:Person)
WHERE ALL(r IN rels WHERE r.since >= 2020)
RETURN a.name, b.name, length(p)
// Bidireccional (sin dirección)
MATCH (a:Person)-[:CONOCE*1..3]-(b:Person)
RETURN DISTINCT a.name, b.name
// Sin límite ⚠ evitar en producción
MATCH (a:Person)-[:TRABAJA_EN*]->(b) RETURN a.name, b
⚠ Relaciones sin límite superior (*) pueden recorrer todo el grafo y agotar la memoria. Siempre usar rango explícito: *1..5 o *1..10.
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

shortestPath() y allShortestPaths() — Caminos mínimos
Cypher
// Camino más corto entre dos nodos
MATCH (ana:Person {name:'Ana'}), (pedro:Person {name:'Pedro'})
MATCH p = shortestPath((ana)-[:CONOCE*]-(pedro))
RETURN p, length(p) AS saltos
// Extraer nodos del path
MATCH p = shortestPath((a:Person {name:'Ana'})-[:CONOCE*]-(b:Person {name:'María'}))
RETURN [n IN nodes(p) | n.name] AS personas,
length(p) AS grados
// Con filtro sobre el path
MATCH (ana:Person {name:'Ana'}), (pedro:Person {name:'Pedro'})
MATCH p = shortestPath((ana)-[:CONOCE*]-(pedro))
WHERE NONE(n IN nodes(p) WHERE n.ciudad = 'Córdoba')
RETURN p, length(p)
// allShortestPaths: todos los caminos de misma longitud mínima
MATCH (ana:Person {name:'Ana'}), (pedro:Person {name:'Pedro'})
MATCH p = allShortestPaths((ana)-[:CONOCE*]-(pedro))
RETURN p
// 6 grados de separación
MATCH (yo:Person {name:'Ana'}), (otro:Person) WHERE yo <> otro
MATCH p = shortestPath((yo)-[:CONOCE*..6]-(otro))
RETURN otro.name, length(p) AS grados
ORDER BY grados LIMIT 10
shortestPath() allShortestPaths()
BFS — un único camino mínimo Todos los caminos de misma longitud mínima
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

CALL subqueries y APOC — Potencia extendida
Cypher APOC — Importación
// CALL correlacionado: subconsulta por fila
MATCH (p:Person)
CALL { apoc.load.json/csv
WITH p apoc.import.graphml
MATCH (p)-[:AMIGO_DE]->(a:Person)
RETURN COUNT(a) AS cantAmigos
}
APOC — Texto
RETURN p.name, cantAmigos
// CALL IN TRANSACTIONS: batch processing
levenshtein
MATCH (p:Person)
slug, join, split
CALL {
WITH p SET p.procesado = true
} IN TRANSACTIONS OF 1000 ROWS
APOC — Colecciones
// APOC: importar JSON desde URL
CALL apoc.load.json('https://api.example.com/people')
YIELD value intersection
UNWIND value.people AS person union, sortMaps
MERGE (p:Person {id: person.id})
SET p.name = person.name
APOC — Algoritmos
// APOC: texto y colecciones
RETURN apoc.text.levenshteinDistance('Ana','Anna') AS distancia
RETURN apoc.coll.intersection([1,2,3],[2,3,4]) AS comunes subgraphAll
spanningTree
📌 CALL { } IN TRANSACTIONS es la forma recomendada para bulk updates. Una TX gigante puede agotar la heap. Lotes de 1000-10000
rows son el sweet spot.
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

Graph Data Science — Algoritmos de grafos con GDS
GDS Library incluye +65 algoritmos production-ready. Workflow: proyectar → ejecutar → escribir resultados.
GDS PageRank
// PASO 1: Proyectar grafo en memoria
CALL gds.graph.project('grafoPersonas', 'Person',
{CONOCE: {orientation:'UNDIRECTED'}}) Importancia por vecinos importantes.
Influencers, hubs.
// PASO 2a: PageRank — stream (solo ver)
CALL gds.pageRank.stream('grafoPersonas')
YIELD nodeId, score Betweenness
RETURN gds.util.asNode(nodeId).name, score
ORDER BY score DESC LIMIT 10
Nodos 'puente'. Cuellos de botella, personas
// PASO 2b: PageRank — write (persistir en nodo) clave.
CALL gds.pageRank.write('grafoPersonas',
{writeProperty:'pageRank'})
Louvain
// PASO 3: Louvain — detección de comunidades
CALL gds.louvain.stream('grafoPersonas')
YIELD nodeId, communityId Comunidades por densidad. Segmentación de
RETURN gds.util.asNode(nodeId).name, communityId usuarios.
ORDER BY communityId
// PASO 4: Node Similarity — para recomendaciones Node Sim.
CALL gds.nodeSimilarity.stream('grafoPersonas')
YIELD node1, node2, similarity
RETURN gds.util.asNode(node1).name AS p1, Similitud por vecinos. Base del filtrado
gds.util.asNode(node2).name AS p2, colaborativo.
similarity ORDER BY similarity DESC LIMIT 10
// Cleanup
CALL gds.graph.drop('grafoPersonas')
⚠ GDS opera en memoria sobre una proyección inmutable. Los cambios solo se persisten con .write() o .mutate(). La proyección NO afecta los
datos originales.
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

⚑ EJERCICIOS AVANZADOS — Detección de Fraude + Recomendaciones
Parte A — Detección de Fraude Bancario [:Cliente]-[:TIENE_CUENTA]->[:Cuenta]-[:REALIZO {monto,fecha}]->[:Transaccion]
1 Clientes que comparten IP con 2+ otros. Listar nombre, IP y cantidad de clientes en esa IP.
2 'Mulas': cuentas que reciben de 3+ cuentas distintas en el mismo día (usar fecha).
3 Cadenas: A→B→C→... donde la suma de montos supera $50K en 24hs. Usar reduce().
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

⚑ EJERCICIOS AVANZADOS — Detección de Fraude + Recomendaciones
Parte B — Motor de Recomendaciones [:User]-[:LIKED]->[:Track] [:User]-[:FOLLOWS]->[:User]
4 Filtrado colaborativo: canciones que gustaron a usuarios que siguieron a los mismos artistas que yo.
5 Usuarios similares: personas con 5+ likes en común conmigo (sin ser yo). Usar Jaccard manual.
6 [GDS] Node Similarity sobre el grafo de likes. Top 5 usuarios más similares + sus canciones favoritas.
Pista
// Pista ej.3: reduce() en path
MATCH path=(o:Cuenta)-[:REALIZO*1..5]->(d:Cuenta)
WHERE ALL(r IN relationships(path) WHERE r.fecha >= datetime()-duration({hours:24}))
WITH path, reduce(tot=0,r IN relationships(path)|tot+r.monto) AS total
WHERE total > 50000
RETURN [n IN nodes(path)|n.numero] AS cadena, total
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

Modelado
04
Modelado en Grafos y Casos Reales
Principios · Anti-patrones · LinkedIn · Netflix · Panama Papers
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

Principios de modelado en grafos
El modelado en grafos es diferente al relacional. La clave: pensar en CONEXIONES antes que en tablas.
Sustantivos → Nodos, Verbos → Relaciones
1
Una PERSONA TRABAJA_EN una EMPRESA. No 'tabla empleos'.
Modelar desde las preguntas del negocio
2
¿Qué consultas necesito responder? Diseñar el grafo para optimizarlas.
Evitar propiedades de relación como nodos
3
'since:2020' es propiedad de la relación. Nodo nuevo solo si necesitás navegar por ese dato.
Labels son categorías, no tablas
4
Un nodo puede tener múltiples labels: :Person:Employee:Manager es válido.
Las relaciones siempre tienen dirección
5
(a)-[:AMIGO_DE]->(b) ≠ (b)-[:AMIGO_DE]->(a). Modelar según semántica real.
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

Anti-patrones — Errores de modelado y Cypher que crashean PowerPoint
Los 6 errores más comunes en examen y en producción:
✗ Labels genéricos (:Entidad {tipo:'persona'})
Labels genéricos fuerzan WHERE; labels son el filtro O(1) de Neo4j.
✓ Labels específicos: :Person, :Company
✗ IDs de amigos como lista p.amigosIds=[1,2,3]
Las listas requieren UNWIND+lookup. Las relaciones son O(1).
✓ Relaciones explícitas (p)-[:AMIGO_DE]->(otro)
✗ MATCH (a),(b) RETURN a,b sin relación
Producto cartesiano O(n×m). Siempre relacionar en el MATCH.
✓ MATCH (a)-[:REL]->(b) RETURN a,b
✗ MATCH (a)-[:REL*]->(b) sin límite
Sin límite puede recorrer todo el grafo y agotar memoria.
✓ MATCH (a)-[:REL*1..6]->(b)
✗ DELETE p (nodo con relaciones)
DELETE sin DETACH falla si el nodo tiene relaciones activas.
✓ DETACH DELETE p
✗ CREATE siempre en vez de MERGE
CREATE siempre crea nodo nuevo aunque exista otro idéntico.
✓ MERGE cuando el nodo puede existir
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

Caso real — LinkedIn: grafos de conexiones profesionales
1B+ 3.5° 18K
usuarios grados prom. queries/seg
Modelo simplificado
:Comp
any
:Person name
WORKED_AT
name HAS_SKILL :Skill
name
Cypher
// "Personas que quizás conozcas"
MATCH (yo:Person {name:'Ana Pérez'})
-[:CONNECTED_TO]->(contacto)
-[:CONNECTED_TO]->(sugerido)
WHERE NOT (yo)-[:CONNECTED_TO]-(sugerido)
AND yo <> sugerido
RETURN sugerido.name,
COUNT(contacto) AS conexComunes
ORDER BY conexComunes DESC LIMIT 10
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

Casos reales — Netflix y Panama Papers
Netflix: 75% del consumo viene de recomendaciones basadas en grafos de comportamiento
Netflix Panama Papers — ICIJ + Neo4j (2016)
// Recomendación por tags compartidos
MATCH (yo:User {id:'user123'})
-[:WATCHED]->(t:Title) 11.5M documentos · 320K entidades offshore
-[:TAGGED_AS]->(tag:Tag)
<-[:TAGGED_AS]-(rec:Title) Modelo:
WHERE NOT (yo)-[:WATCHED]->(rec) • :Officer (personas/empresas reales)
WITH rec, COUNT(tag) AS relevancia • :Entity (empresas offshore)
WHERE relevancia >= 3 • :Intermediary (estudios jurídicos)
RETURN rec.name, relevancia
• [:officer_of] [:intermediary_of]
ORDER BY relevancia DESC LIMIT 10
Consulta clave:
¿Quiénes están conectados a entidades
offshore a través de 4+ intermediarios?
¿Por qué Neo4j en estos casos?
Netflix: el comportamiento del usuario (qué viste, cuánto, cuántas veces pausaste) forma un grafo de señales que SQL no puede
navegar eficientemente.
Panama Papers: encontrar que una persona está conectada a una empresa offshore a través de 4 intermediarios = traversal de 4
saltos. O(1) en Neo4j, impracticable en SQL.
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

Parcial
05
Integración y Evaluación
Caso integrador tipo parcial · Errores frecuentes · Cierre
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

CASO INTEGRADOR TIPO PARCIAL — Plataforma de Cursos Online

:Student {name,age} :Course {title,level,price} :Instructor {name,rating} :Topic {name} :Certificate
{id,date}
[:ENROLLED {date,progress}] [:TEACHES] [:COVERS] [:COMPLETED] [:EARNED] [:REVIEWED {stars}]
Parte A — Consultas básicas (20 min) [25 pts]
1. Cursos de nivel 'avanzado' con precio < $5000, ordenados por precio DESC.
2. Estudiantes que completaron 'Neo4j para Principiantes'. Mostrar nombre y fecha.
3. Instructores con OPTIONAL MATCH — mostrar nombre y cantidad de cursos (incluir sin cursos).
Parte B — Agregaciones y WITH (20 min) [25 pts]
4. Estudiantes con más de 3 cursos: nombre, cantidad y collect(título).
5. Cursos con rating promedio > 4.0 y 2+ reviews. Mostrar título, round(prom,1), cantidad.
6. Top 3 instructores por cantidad de estudiantes únicos en todos sus cursos.
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

CASO INTEGRADOR — Partes C y D

Parte C — Paths y consultas avanzadas (25 min) [25 pts]
7. Cursos no cursados por Ana, pero sí por estudiantes que comparten 2+ cursos con ella (recomendación).
8. shortestPath entre dos cursos dados a través de :Topic en común. Mostrar path y longitud.
9. Cadena de influencia: si un instructor tomó cursos de otro, modelarlo y encontrar cadenas de longitud 3+.
Parte D — Modelado y argumentación (15 min) [25 pts]
10. [MODELADO] Una app de streaming quiere usuarios que sigan playlists de otros. Diseñar el grafo.
11. [CRÍTICA] El equipo propone guardar IDs de cursos como lista en :Student. ¿Qué problema tiene? ¿Cómo mejorar?
12. [COMPARATIVA] ¿En qué caso concreto sería mejor PostgreSQL que Neo4j para este sistema? Justificar.
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

Errores frecuentes en examen — Los 6 más comunes
MATCH sin OPTIONAL cuando se necesita incluir nodos sin relación
1
→ OPTIONAL MATCH. Siempre que el resultado deba incluir nodos aunque no cumplan el patrón.
WHERE sobre agregado en RETURN en vez de WITH
2
→ MATCH → WITH p, COUNT(a) AS cant WHERE cant > N → RETURN. Nunca filtrar agregados en RETURN.
CREATE en lugar de MERGE cuando el nodo puede existir
3
→ MERGE busca o crea. CREATE siempre crea, aunque exista uno idéntico.
DELETE nodo con relaciones (sin DETACH)
4
→ DETACH DELETE elimina nodo Y todas sus relaciones. DELETE sola falla.
Producto cartesiano: MATCH (a),(b) sin relación
5
→ Siempre conectar los nodos en el MATCH o usar WHERE EXISTS.
Relación de profundidad ilimitada: [:REL*]
6
→ Siempre poner límite: [:REL*1..6]. Sin límite puede agotar la memoria.
Ingeniería de Datos II · UADE · Ing. Damián Arnaudo

Resumen — Clase 5
N
Neo4j internals Native Graph Storage, Index-free adjacency, Node/Rel/Property Store, tamaño fijo →
1
O(1).
ACID completo
2 Atomicidad, Consistencia, Aislamiento (MVCC), Durabilidad (WAL). Sin excepciones.
Clustering Raft
3 N=2F+1. Core Servers (quorum) + Read Replicas. Bookmarks = causal consistency.
CAP — posición CP
4 Frente a partición: prioriza Consistencia. Cluster rechaza escrituras sin quorum.
Cypher medio
5 WHERE, agregaciones, OPTIONAL MATCH, WITH (HAVING), UNWIND, MERGE, índices.
Cypher avanzado
6 Paths variables, shortestPath, CALL, APOC, GDS y algoritmos de grafos.
Ingeniería de Datos II · UADE · I📌ng. D aPmrióánx iAmrnaau cdloase: Bases de datos Clave/Valor — Redis · Tarea: completar ejercicios avanzados 1 y 2