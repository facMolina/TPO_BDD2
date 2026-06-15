<!-- Slide number: 1 -->

CLASE 10

Teorema CAP

Replicación · Particionamiento · Consistencia

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE

### Notes:

<!-- Slide number: 2 -->
Agenda de hoy

01
Repaso rápido & conexión con lo visto

02
Teorema CAP — profundidad y debate

03
Replicación: modelos y trade-offs reales

04
Particionamiento (Sharding): estrategias

05
Tipos de consistencia en sistemas distribuidos

06
Casos reales: Netflix, Cassandra, MongoDB Atlas

07
Taller práctico de diseño / debate

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 3 -->

01 — Repaso & Contexto

¿Dónde estamos parados?

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 4 -->
El camino recorrido hasta aquí

Cl. 1–2
Cl. 3–4
Cl. 5
Cl. 6
Cl. 7
Cl. 10
Relacional
vs NoSQL
MongoDB
documental
Neo4j
grafos
Redis
clave/valor
Cassandra
tabular
CAP · Replic.
Consistencia

← AQUÍ
Hoy cerramos la visión técnica con los fundamentos que conectan todos los motores.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 5 -->
💬

Si tu aplicación debe seguir funcionando
cuando la red entre dos datacenters cae…
¿qué sacrificás?
¿Consistencia?    ·    ¿Disponibilidad?    ·    ¿Ninguna?    ·    ¿Depende?

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 6 -->

02 — Teorema CAP

Eric Brewer, 2000 · Gilbert & Lynch, 2002

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 7 -->
Teorema CAP — Lo que dice y lo que NO dice

C

A

P
Consistency
Availability
Partition
Tolerance
Todos los nodos devuelven
el mismo dato al mismo tiempo.
Una lectura siempre ve
la escritura más reciente.
Toda solicitud recibe
una respuesta (sin error),
pero no necesariamente
con el dato más reciente.
El sistema sigue operando
aun si mensajes entre
nodos se pierden
o se retrasan.
⚠  P es casi obligatoria en sistemas distribuidos reales. La elección real es C vs A.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 8 -->
¿Dónde se posiciona cada motor?

CP — Consistency + Partition
AP — Availability + Partition

▸  MongoDB (write concern: majority)
Cassandra
Eventual / Tunable
▸  HBase
DynamoDB
Eventual (default)
▸  Zookeeper
CouchDB
Eventual
▸  Redis (Sentinel/Cluster)
Riak
Eventual
▸  etcd
MongoDB (w:1)
Best-effort
CA (sin P) = bases de datos relacionales en un solo nodo. Irrelevante en sistemas distribuidos.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 9 -->
Más allá de CAP — El modelo PACELC

Limitaciones de CAP
PACELC (Daniel Abadi, 2012)
✗  Solo habla de qué pasa durante una partición
Si hay Partición (P):
→ elegís Availability o Consistency

En otro caso (E = Else):
→ elegís Latency o Consistency
✗  ¿Y cuando la red funciona bien?
✗  No modela la latencia
✗  Consistencia es binaria en CAP (no real)
| Motor | P choice | E choice |
| --- | --- | --- |
| DynamoDB | Availability | Latency |
| Cassandra | Availability | Latency |
| MongoDB | Consistency | Consistency |
| Spanner | Consistency | Consistency |

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 10 -->

🔥  Debate de diseño

Caso A: Banco digital
→ Consistencia fuerte. Los bancos no pueden tolerar fondos duplicados.
Una transferencia bancaria falla si dos nodos no se sincronizan.
¿Preferís rechazar la operación o procesarla y reconciliar después?

Caso B: Red social global
→ Disponibilidad + eventual consistency. Un 'like' desactualizado es tolerable.
Un usuario publica una foto desde Buenos Aires.
¿Es crítico que un usuario en Tokio la vea en < 100ms?

Caso C: E-commerce en Black Friday
→ Tradeoff crítico. Amazon resuelve con reserva optimista + compensación.
Stock = 1 unidad. Dos usuarios compran al mismo tiempo en datacenters distintos.
¿Cómo evitás overselling sin sacrificar performance?

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 11 -->

03 — Replicación

Copias, roles y sincronización en sistemas distribuidos

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 12 -->
¿Por qué replicar datos?

🛡️  Alta disponibilidad
⚡  Reducción de latencia
Si un nodo cae, otro responde. Uptime > 99.9%.
Réplicas en múltiples regiones → el usuario lee del nodo más cercano.

📈  Escalabilidad de lectura
💾  Tolerancia a fallos
Múltiples réplicas sirven reads en paralelo.
Protección ante fallas de hardware, red o datacenter completo.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 13 -->
Replicación Master–Slave (Single-Primary)

MASTER
(Primary)
READS → desde cualquier Slave

WRITES → solo al Master

SLAVE 1
(Replica)

SLAVE 2
(Replica)

SLAVE 3
(Replica)
Replication lag →
Ventajas y limitaciones:
✅ Simple de configurar
❌ Master = Single Point of Failure
✅ Reads escalables horizontalmente
❌ Escrituras no escalan (solo master)
✅ Backups sin impacto en master
❌ Lag en réplicas → lecturas stale

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 14 -->
Replicación Multi-Master (Multi-Primary)

MASTER
Región A
(BsAs)

MASTER
Región B
(Miami)

MASTER
Región C
(Frankfurt)
⟷  SYNC  ⟷
⟷  SYNC  ⟷

⚠  El problema central: Conflictos de escritura concurrente
Si dos masters reciben escrituras distintas sobre el mismo registro simultáneamente,
¿cuál gana? → Estrategias: Last-Write-Wins (LWW) · Vector Clocks · CRDTs · Manual resolution
Casos de uso ideales:
▸  Aplicaciones globales con usuarios en múltiples regiones
▸  Baja latencia de escritura por geolocalización
▸  Alta disponibilidad de escritura (no hay SPOF en writes)

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 15 -->
Replicación Peer-to-Peer — El modelo de Cassandra

N1

N6

N2

Cassandra
Keyspace config
CREATE KEYSPACE store
WITH replication = {
    'class’: 'NetworkTopology Strategy’,
    'dc1': 3,
    'dc2’: 2
};
Ring /
Consistent
Hashing

N3

N5

N4

Sin master · Sin SPOF · Replication Factor (RF) configurable · Cada nodo sabe de todos (Gossip Protocol)

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 16 -->
Comparativa de modelos de replicación
| Modelo | Writes | SPOF | Conflictos | Ejemplo |
| --- | --- | --- | --- | --- |
| Master–Slave | Solo master | Sí (master) | No | MySQL, MongoDB (RS) |
| Multi-Master | Cualquier nodo | No | Posibles | CouchDB, Galera Cluster |
| Peer-to-Peer | Cualquier nodo | No | Resueltos (LWW/CRDT) | Cassandra, Riak, DynamoDB |

🔍  MongoDB Replica Set en profundidad:
Primary + 2 Secondaries (mínimo). Elección automática (Raft-like). writeConcern controla cuántas réplicas confirman antes de ACK.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 17 -->
Caso real — Failover automático en MongoDB Replica Set

T+0s
Primary cae (falla hardware)

T+2s
Secondaries detectan ausencia (heartbeat timeout)

T+10s
Elección: Secondary con optime más reciente gana

T+12s
Nuevo Primary acepta escrituras

T+15s
Driver reconnects automáticamente

// Driver string con todos los miembros del RS
mongoose.connect("mongodb://n1:27017,n2:27017,n3:27017/mydb?replicaSet=rs0&w=majority")

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 18 -->

04 — Particionamiento (Sharding)

Distribuir para escalar escrituras

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 19 -->
Sharding — Dividir para escalar

📚  Analogía: Una biblioteca con millones de libros en un solo estante es lenta de buscar.
Sharding es dividir la colección en estantes independientes, cada uno gestionado por un librario distinto.
COLECCIÓN COMPLETA

Shard A
Shard B
Shard C

Keys:
A–H
Keys:
I–Q
Keys:
R–Z

→  Shard Key
    divide

Cada shard puede tener su propia réplica interna (Shard + Replica Set).

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 20 -->
Estrategias de Shard Key

📊  Rango (Range)

{ age: { $gte: 18, $lte: 30 } }
→ Datos temporales, analytics
✅ Consultas de rango eficientes
❌ Hot spots si los datos no están distribuidos

🔀  Hash

shardKey: { userId: 'hashed' }
→ Cargas de escritura masiva uniforme
✅ Distribución uniforme garantizada
❌ Queries de rango ineficientes (scatter-gather)

🗺️  Zona (Zone / Tag)

sh.addTagRange('db.col', {region:'eu'}, ...)
→ GDPR, multi-tenancy, geo-distribución
✅ Datos por región o tenant
❌ Complejo de configurar

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 21 -->
El problema del Hot Spot — Elegir mal el Shard Key

### Chart: Distribución con timestamp como Shard Key

| Category | Requests/sec |
|---|---|
| Shard 1 | 12000.0 |
| Shard 2 | 850.0 |
| Shard 3 | 720.0 |
| Shard 4 | 930.0 |
¿Por qué sucede?
Un timestamp creciente siempre inserta en el mismo rango → mismo shard.

Todos los writes van al Shard 1 mientras los demás están ociosos.
Solución:
Combinar {userId: 1, timestamp: 1}
o usar hash del timestamp.

📌  Regla de oro para el Shard Key:
Alta cardinalidad  ·  Distribución uniforme de writes  ·  Que evite scatter-gather en las queries más frecuentes

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 22 -->
Sharding en MongoDB — Arquitectura

App

Config Servers
(Metadata)

mongos
(Router)

Shard 1
(RS: P+2S)

Shard 2
(RS: P+2S)

Shard 3
(RS: P+2S)

sh.enableSharding('ecommerce')
sh.shardCollection('ecommerce.orders', { customerId: 'hashed' })

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 23 -->

05 — Modelos de Consistencia

Del eventual al fuerte — el espectro real

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 24 -->
El espectro de consistencia

← CONSISTENCIA FUERTE
EVENTUAL CONSISTENCY →

Consistencia Fuerte
(Strong/Linearizable)

Consistencia
Secuencial

Consistencia
de Sesión

Eventual
Consistency
Toda lectura refleja la escritura más reciente. Sistema se comporta como uno solo.
Operaciones en cada nodo en orden, pero no hay clock global.
El mismo cliente siempre ve sus propias escrituras (read-your-writes).
Con el tiempo todos los nodos convergen. Lecturas pueden ver datos stale.

MongoDB w:majority + readConcern:linearizable
Google Spanner
Zookeeper
Multi-core CPUs
MongoDB causal consistency
DynamoDB (mismo cliente)
Cassandra (default)
DynamoDB (default)
DNS

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 25 -->
Consistencia por Quorum — R + W > N

R + W > N
R = nodos que confirman lectura  ·  W = nodos que confirman escritura  ·  N = total réplicas
| N | W | R | R+W > N? | Garantía | Trade-off |
| --- | --- | --- | --- | --- | --- |
| 3 | 3 | 1 | ✅ 4 > 3 | Fuerte | Latencia alta en writes |
| 3 | 1 | 3 | ✅ 4 > 3 | Fuerte | Latencia alta en reads |
| 3 | 2 | 2 | ✅ 4 > 3 | Fuerte (usual) | Balance óptimo |
| 3 | 1 | 1 | ❌ 2 ≤ 3 | Eventual | Máximo throughput |
| 5 | 3 | 3 | ✅ 6 > 5 | Fuerte | Alta disponibilidad |
Cassandra usa este modelo con QUORUM, LOCAL_QUORUM, ALL, ONE → nivel configurable por operación.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 26 -->
Niveles de consistencia en Cassandra
| Nivel | Descripción | Riesgo inconsistencia | Disponibilidad |
| --- | --- | --- | --- |
| ANY | Al menos 1 nodo (incluso un hinted handoff). Mínima latencia. | Alta | Máxima |
| ONE | El nodo más cercano confirma. Lecturas posiblemente stale. | Media | Alta |
| LOCAL\_ONE | El nodo más cercano en el datacenter local. | Media | Alta |
| QUORUM | Mayoría de nodos del cluster. Garantía fuerte global. | Baja | Media |
| LOCAL\_QUORUM | Mayoría en el datacenter local. Recomendado en multi-DC. | Baja | Media |
| EACH\_QUORUM | Mayoría en CADA datacenter. Máxima consistencia global. | Mínima | Media |
| ALL | Todos los nodos responden. Más lento; si uno falla → error. | Mínima | Baja |
💡  Regla: LOCAL_QUORUM es el balance recomendado en producción multi-datacenter.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 27 -->
Write Concern & Read Concern en MongoDB

Write Concern
Read Concern
¿Cuántas réplicas deben confirmar antes del ACK?
¿Qué tan 'fresco' debe ser el dato leído?
w: 0
Fire & forget. Sin ACK.
local
Lee del Primary o Secondary sin importar lag.
w: 1
Solo el Primary confirma.
available
Como local, pero para sharded clusters.
w: majority
Mayoría del RS. Más seguro.
majority
Solo datos confirmados por la mayoría.
w: 'tagName'
Nodos con tag específico.
linearizable
Garantía más fuerte: sin datos stale.
j: true
Escribe en el journal antes del ACK.
snapshot
Vista consistente de un instante (transacciones).
wtimeout
Tiempo límite para el ACK.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 28 -->

06 — Casos Reales

Netflix · Cassandra · MongoDB Atlas · DynamoDB

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 29 -->

Caso Real — Netflix: Disponibilidad ante todo

238M+
99.99%
~15K
suscriptores globales
disponibilidad target
nodos Cassandra en prod

Decisión de diseño: AP sobre CP
Netflix eligió Cassandra para su servicio de watch history y recomendaciones.
Prefieren que un usuario vea recomendaciones levemente desactualizadas a que el servicio no responda.
Usan AP + Eventual Consistency + compensación asíncrona.

# Cassandra config Netflix (simplificado)
replication_factor: 3
consistency_level: LOCAL_ONE (reads)
consistency_level: LOCAL_QUORUM (writes)
# Permite reads ultra-rápidas, writes seguros en DC local
🐒  Simian Army & Chaos Engineering
Netflix destruye nodos en producción adrede (Chaos Monkey) para verificar que el sistema tolera particiones y se recupera automáticamente.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 30 -->
Caso Real — Amazon DynamoDB: Disponibilidad en Black Friday

El problema original (2004): La base de datos relacional de Amazon colapsaba en picos de tráfico.
Cada 100ms de latencia adicional = -1% en ventas. Resultado: Dynamo paper (2007) → DynamoDB.

⚡  Eventual Consistency por defecto
🔒  Strong Consistency opcional
Máximo throughput. Writes aceptados inmediatamente y propagados asíncronamente.
readConsistencyLevel: STRONG → paga latencia extra. Ideal para inventario crítico.

📦  Partition Key obligatoria
🔄  Vector Clocks → Last-Write-Wins
Todo dato tiene una partition key que determina el nodo. Diseño forzado desde el modelo.
Conflictos resueltos por timestamp. El cliente puede elegir estrategia personalizada.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 31 -->
Caso Real — MongoDB Atlas Global Clusters

Escenario: App global de e-commerce que necesita baja latencia en todas las regiones y cumplimiento de GDPR en Europa.

Zone: Americas
(shard: us-east-1)

Zone: Europe
(shard: eu-west-1)

Zone: APAC
(shard: ap-southeast-1)
Nodos:
N. Virginia
+ São Paulo
Nodos:
Frankfurt
(GDPR zone)
Nodos:
Singapur
+ Sydney

📋  GDPR Compliance con Zone Sharding:
Los datos de usuarios europeos nunca salen del shard eu-west-1. Zone tags garantizan esto a nivel de motor, no solo de política.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 32 -->

07 — Taller de Diseño

Aplicar, decidir, defender

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 33 -->

✏️  Taller — Problema 1: Sistema bancario crítico

Contexto:
Un banco tiene 5 millones de cuentas. Procesa 50.000 transacciones por segundo en horario pico.
Tiene datacenters en Buenos Aires, Santiago y San Pablo. La regulación exige consistencia fuerte en saldos.

1. ¿Qué motor NoSQL elegirías y por qué? ¿O mantendrías un RDBMS?

2. ¿Cómo configurarías la replicación? ¿Qué modelo?

3. ¿Qué nivel de consistencia usarías para: a) consulta de saldo, b) débito, c) crédito?

4. ¿Qué pasa si la red entre Buenos Aires y San Pablo cae 10 minutos?

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 34 -->

✏️  Taller — Problema 2: Red social de contenido

Contexto:
Una red social tiene 20M usuarios en Latam. Almacena posts, likes y follows.
Recibe 200.000 eventos/seg en picos. Los usuarios son de Argentina, México, Colombia y Brasil.

1. Definir el Shard Key para la colección de posts. Justificar la estrategia elegida.

2. ¿Cuántos shards proponen? ¿Cómo distribuirían la carga geográficamente?

3. ¿Qué nivel de consistencia para: a) leer el feed, b) publicar un post, c) contar likes?

4. Un datacenter en México cae. ¿Qué experiencia tiene el usuario mexicano?

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 35 -->
Hinted Handoff — Disponibilidad durante fallas temporales

🔧  Técnica usada en: Cassandra, DynamoDB, Riak
Cuando el nodo destino no está disponible, otro nodo guarda el write temporalmente ('hint') y se lo entrega cuando el original vuelve.

1

2

3

4

Nodo Bvuelve a la vida
Nodo A entrega el hint→ B se sincroniza
Client escribe en Nodo B (que está caído)
Nodo Aacepta el write + guarda hint de B

⚠  Consideraciones:
• El hint tiene un TTL. Si B no vuelve en tiempo, el hint se descarta.
• No reemplaza la reparación de entropía (anti-entropy repair).
• Permite consistencia de nivel ANY en Cassandra.

🔄  Read Repair (complementario):
Durante una lectura, el coordinador compara las versiones en múltiples réplicas. Si detecta divergencia, repara en background. Garantiza convergencia eventual.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 36 -->
Resolución de Conflictos — Vector Clocks y CRDTs

Vector Clocks
CRDTs
Cada objeto lleva un vector de versiones:
{nodo: contador}

[A:1, B:0] → [A:1, B:1] → conflicto
[A:2, B:0]
Conflict-free Replicated Data Types

Estructuras de datos matemáticamente
diseñadas para que los conflictos
siempre se resuelvan automáticamente.
Ejemplos:
• G-Counter (solo incrementa)
• PN-Counter (inc/dec)
• 2P-Set (add/remove sets)
• OR-Set (observed-remove)
• LWW-Register (last write wins)
El sistema detecta que A y B generaron versiones paralelas. El cliente decide cuál prevalece o cómo fusionarlas.
Usado en: Riak, DynamoDB (internamente)
Desventaja: el cliente debe resolver conflictos.
Usado en: Riak, Redis (parcial), Akka

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 37 -->
Gossip Protocol — Cómo los nodos se conocen entre sí

🗣️  Analogía: En un pueblo, si una persona le cuenta un secreto a 3 vecinos, y cada uno se lo cuenta a otros 3 en 1 segundo, en menos de 10 segundos todo el pueblo lo sabe.

🔁  Convergencia eventual
💪  Tolerancia a fallos
Cada nodo contacta a N vecinos aleatorios cada T segundos. El estado se propaga exponencialmente.
Si un nodo no responde, se marca como DOWN eventualmente. No hay maestro que tome la decisión.

📡  Descubrimiento de nodos
⚖️  Balance de carga implícito
Un nuevo nodo solo necesita conocer un Seed Node. El Gossip hace el resto.
La información sobre carga de cada nodo se propaga y los coordinadores la usan para enrutar.
Usado en: Cassandra, Consul, Serf, Redis Cluster · Complejidad O(log N) para propagación.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 38 -->
Consistent Hashing — Escalar sin redistribuir todo

❌  Problema con hashing simple:
✅  Consistent Hashing:
hash(key) % N

Si N cambia (agrego/quito un nodo),
casi TODOS los datos cambian de nodo.
→ Redistribución masiva = downtime.
Nodos Y datos se mapean en
un anillo (0 a 2³²).

Si agrego un nodo, solo los datos
entre su posición y el anterior
necesitan moverse.
→ Mínima redistribución.

Virtual Nodes (vnodes) en Cassandra:
En vez de 1 posición por nodo, cada nodo ocupa múltiples posiciones aleatorias en el anillo.
Ventajas: mejor balance natural, migración más pequeña al agregar nodos, sin manual token assignment.

# cassandra.yaml
num_tokens: 256  # 256 vnodes por nodo (default en Cassandra 4+)

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 39 -->
CAP en la práctica — Los límites del teorema

Mito: "Hay que elegir 2 de 3 siempre"
Realidad: P es obligatoria en sistemas distribuidos. La elección REAL es C vs A durante una partición. El 99.9% del tiempo sin partición podés tener ambas.

Mito: "Eventual consistency es inseguro"
Realidad: Depende del dominio. Para contadores de likes, vistas de video o sesiones de usuario, es perfectamente aceptable y mucho más performante.

Mito: "CAP define qué motor usar"
Realidad: Un mismo motor (ej: MongoDB o Cassandra) puede comportarse como CP o AP según su configuración. No es una propiedad fija del motor.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 40 -->
Cassandra vs MongoDB — Replicación y Consistencia
| Aspecto | Cassandra | MongoDB |
| --- | --- | --- |
| Modelo de replicación | Peer-to-Peer (leaderless) | Master-Slave (Replica Set) |
| Elección de líder | No hay líderes (Gossip) | Raft-like election (max ~10s) |
| Consistencia de escritura | Configurable (ANY..ALL) | WriteConcern (w:0..majority) |
| Consistencia de lectura | Configurable (ONE..ALL) | ReadConcern (local..linearizable) |
| Sharding | Consistent Hashing nativo | Shard Key + Config Servers |
| Cross-DC replication | NetworkTopologyStrategy | Global Clusters (Atlas) o manual |
| Transacciones | Lightweight Transactions (CAS) | ACID multi-doc (v4.0+) |
| Conflictos write | LWW (timestamp) | No hay (un solo primary) |

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 41 -->
Patrones de diseño para manejar consistencia

⛓️  Saga Pattern

Caso de uso:
E-commerce: order → payment → shipping
Transacciones largas divididas en pasos locales con compensaciones. Si falla el paso 3, se ejecutan compensaciones para deshacer pasos 1 y 2.

↔️  CQRS

Caso de uso:
Dashboards analytics + writes transaccionales
Command Query Responsibility Segregation. Separar el modelo de escritura (Commands) del de lectura (Queries). Read models eventualmente consistentes.

📋  Event Sourcing

Caso de uso:
Sistemas financieros, auditoría, replay
El estado se deriva de una secuencia de eventos inmutables. No se actualiza, solo se agrega. Permite reconstruir el estado en cualquier punto.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 42 -->
Transacciones en NoSQL — ¿ACID es posible?

Históricamente: NoSQL sacrificaba ACID por escala. Hoy: muchos motores agregaron soporte transaccional limitado.
| Motor | Tipo de TX | Alcance | Introducido |
| --- | --- | --- | --- |
| MongoDB | Multi-doc ACID | Cross-collection, cross-shard | v4.0 (2018) |
| Cassandra | Lightweight TX (CAS) | Single partition (IF conditions) | v2.0 (2013) |
| Redis | MULTI/EXEC | Secuencia atómica en 1 nodo | v1.2 |
| CockroachDB | Full ACID + MVCC | Distributed, cross-row | Nativo |
| Google Spanner | Full ACID + TrueTime | Global, cross-table | Nativo |

// MongoDB multi-document transaction
const session = client.startSession();
session.withTransaction(async () => {
  await orders.insertOne({...}, { session });
  await inventory.updateOne({...}, { session });
});

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 43 -->

❌  Anti-patterns en sistemas distribuidos

✗  Distributed Monolith
Microservicios que se llaman síncrona y secuencialmente. Si uno cae, todo cae. Peor que un monolito.

✗  2PC en sistemas NoSQL
Two-Phase Commit bloquea recursos. En sistemas AP, esto destruye la disponibilidad. Usar Sagas en su lugar.

✗  Ignorar el replication lag
Leer desde un Secondary sin readConcern adecuado puede devolver datos stale. Crítico en finanzas o inventario.

✗  Shard Key monótona
Usar timestamp o _id autogenerado como shard key crea hot spots. Todos los writes van al mismo shard.

✗  Over-sharding prematuro
Agregar shards antes de necesitarlos complejiza la operación sin beneficio. Empezar con Replica Set y escalar después.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 44 -->
Las 8 Falacias de la Computación Distribuida
Sun Microsystems, 1994 · Vigente más que nunca

1.
La red es confiable

5.
La topología no cambia

2.
La latencia es cero

6.
Hay un administrador de red

3.
El ancho de banda es infinito

7.
El costo de transporte es cero

4.
La red es segura

8.
La red es homogénea
Conocer estas falacias es la diferencia entre diseñar software distribuido real y software distribuido optimista.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 45 -->
Replication Lag — El problema invisible

Escenario: Read-Your-Writes violation
T0: Usuario actualiza su avatar → escribe en Primary.
T1 (100ms después): El usuario refresca la página → lee de Secondary.
T2: Secondary aún no sincronizó → el usuario ve su avatar anterior.
→ Experiencia confusa: "¿No guardé los cambios?"
Estrategias de mitigación:

▸  Sticky sessions
▸  readConcern: majority
El mismo cliente siempre lee del mismo Secondary. El lag no importa para ese cliente.
Solo lee datos confirmados por la mayoría → elimina lag visible pero paga latencia.

▸  Causal Consistency
▸  Cache-aside
MongoDB: el driver trackea operationTime y clusterTime para garantizar read-your-writes.
Post-write, el cliente tiene en memoria el dato reciente. Usa Redis + TTL.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 46 -->
Diseño Multi-Datacenter — Patrones probados

Active-Passive

Cuándo usarlo:
DR básico, sistemas que toleran downtime breve
Un DC activo, otro en standby. Failover manual o automático.
→ Más simple. Mayor RPO (data loss posible).

Active-Active

Cuándo usarlo:
Apps globales con latencia crítica
Ambos DCs sirven tráfico. Sincronización bidireccional.
→ Complejo: requiere resolver conflictos de escritura.

Active-Active-DR

Cuándo usarlo:
Finanzas, salud, infraestructura crítica
Dos DCs activos + uno pasivo para DR.
→ El patrón más costoso pero más resiliente.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 47 -->
CAP en Arquitecturas de Microservicios

En microservicios, cada servicio puede (y debería) elegir su propio trade-off CAP según sus necesidades específicas.
| Servicio | CAP | Justificación | Motor sugerido |
| --- | --- | --- | --- |
| Auth Service | CP | Sesión inválida = problema de seguridad | Redis Cluster |
| Product Catalog | AP | Precio desactualizado < no mostrar producto | Cassandra |
| Order Service | CP | Doble pedido = pérdida financiera | MongoDB (w:majority) |
| Recommendations | AP | Recomendación vieja es aceptable | Cassandra / DynamoDB |
| Inventory (critical) | CP | Oversell = problema logístico grave | MongoDB / RDBMS |
| Analytics / Metrics | AP | Datos levemente desactualizados son OK | Cassandra / InfluxDB |

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 48 -->
Ejercicio — Modelado en Cassandra para alta consistencia

Requerimiento: El historial de transacciones de un usuario debe ser consultable por rango de fechas.
Escribir el schema y justificar la partition key y clustering key.

CREATE TABLE transactions (
  user_id    UUID,
  tx_date    DATE,
  tx_id      TIMEUUID,
  amount     DECIMAL,
  type       TEXT,
  status     TEXT,
  PRIMARY KEY ((user_id, tx_date), tx_id)
) WITH CLUSTERING ORDER BY (tx_id DESC)
  AND compaction = {'class': 'TimeWindowCompactionStrategy',
                    'compaction_window_unit': 'DAYS',
                    'compaction_window_size': 1};

Partition key (user_id, tx_date): Agrupa transacciones por usuario y día → partition acotada + queries eficientes por rango.

Clustering key (tx_id TIMEUUID): TIMEUUID incluye timestamp → orden cronológico garantizado sin columna extra.

TWCS compaction: Optimizado para datos time-series: compacta ventanas de tiempo juntas, mejora read performance.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 49 -->
Monitoreo — Métricas clave en sistemas distribuidos

USE Method (Brendan Gregg)
Golden Signals (SRE Google)
Utilization: % tiempo que el recurso está ocupado
Latency: p50, p95, p99 de respuesta
Traffic: Requests/sec por operación
Saturation: Cola de trabajo pendiente
Errors: Tasa de errores 4xx/5xx
Errors: Tasa de errores del recurso
Saturation: % uso de CPU, RAM, disco
Métricas específicas de bases de datos distribuidas:

MongoDB:
replication lag (segunds_behind), opcounters, wiredTiger cache hit ratio

Cassandra:
read/write latency (p99), pending compactions, dropped messages, SSTable count

Redis:
memory usage, evicted_keys, connected_clients, repl_backlog_size

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 50 -->
Ejercicio de Análisis — ¿Es aceptable el dato stale?
Para cada caso, determiná: ¿el dato puede estar desactualizado? ¿Cuánto lag es tolerable?
| Escenario | ¿Stale OK? | Lag máximo | Justificación |
| --- | --- | --- | --- |
| Precio de un producto en e-commerce | Tolerable | < 5 min | Puede actualizarse antes de confirmar compra |
| Saldo disponible en cuenta bancaria | No tolerable | 0ms | Regulación y riesgo de fraude |
| Contador de likes en redes sociales | Muy tolerable | < 1 hs | No hay decisión crítica basada en él |
| Estado de un vuelo (cancelado/operativo) | Poco tolerable | < 30s | Pasajeros toman decisiones en base a esto |
| Posición GPS de un vehículo de delivery | Poco tolerable | < 10s | UX degradada, pero no crítico |
| Clave de acceso / token de sesión activo | No tolerable | 0ms | Riesgo de seguridad si token revocado no se propaga |

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 51 -->
Algoritmos de Consenso — Raft & Paxos

Problema: ¿Cómo hacer que un conjunto de nodos acuerde en un único valor, incluso si algunos fallan?
→ Lo necesita cualquier sistema que requiera elección de líder o replicación con consistencia fuerte.
Raft — Los 3 estados de un nodo:

Follower

Candidate

Leader
Estado inicial. Recibe updates del Leader. No propone nada.
Si no recibe heartbeat del Leader en timeout → inicia elección y se postula.
Gana si recibe votos de mayoría. Maneja todos los writes y envía logs a followers.

Usan Raft o variantes:
MongoDB Replica Set  ·  etcd (Kubernetes)  ·  CockroachDB  ·  TiKV  ·  Consul
Paxos (más complejo): Zookeeper · Google Chubby · Google Spanner

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 52 -->
Redis en sistemas distribuidos — Consistencia y roles

🖥️  Standalone
CAP: CA
Un solo nodo. Sin replicación ni failover.
Solo para desarrollo o datos no críticos.

🛡️  Sentinel
CAP: CP
Master + Replicas monitoreados por Sentinels.
Failover automático (~30s). Sin sharding.

🌐  Cluster
CAP: AP durante partición
Sharding nativo automático (hash slots 0-16383).
16384 slots divididos entre N masters, cada uno con réplicas.

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes:

<!-- Slide number: 53 -->
Bibliografía y recursos recomendados
📚  Libros
▸  Harrison (2015) · Next Generation Databases — Cap. 7: Consistency Models
▸  Pivert (2018) · NoSQL Data Models — Cap. 4: Replication & Partitioning
▸  Bradberry & Lubow (2013) · Practical Cassandra — Cap. 3: Replication
📄  Papers fundacionales
▸  Brewer (2000) · Towards Robust Distributed Systems (CAP conjecture)
▸  Gilbert & Lynch (2002) · Brewer's Conjecture and the Feasibility of CAP
▸  DeCandia et al. (2007) · Dynamo: Amazon's Highly Available Key-Value Store
▸  Abadi (2012) · Consistency Tradeoffs in Modern Distributed DB Design (PACELC)
🔗  Documentación oficial
▸  MongoDB Docs · Replication, Consistency, Sharding (mongodb.com/docs)
▸  Cassandra Docs · Architecture, Replication, Consistency (cassandra.apache.org/doc)
▸  Redis Docs · Replication, Cluster (redis.io/docs)

Ing. Damián Arnaudo  ·  Ingeniería de Datos II  ·  UADE
Clase 10  ·  CAP · Replicación · Consistencia

### Notes: