session:usr_42 "token":"abc123xYz"
cache:product:10 "price":85000,"stock":3
rate:192.168.1.1 "requests":47
lock:checkout "1"
Bases de Datos Clave / Valor
Redis — Arquitectura, Tipos de Datos y Operaciones Avanzadas
Ingeniería de Datos II · Clase 6 · Unidad II
Ing. Damián Arnaudo · Facultad de Ingeniería y Ciencias Exactas · UADE

Agenda — Clase 6
01 Modelo Clave/Valor — Fundamentos y posicionamiento NoSQL
02 Redis — Historia, arquitectura y modelo de datos
03 Persistencia, Replicación y Alta Disponibilidad
04 Tipos de Datos — Strings, Listas, Hashes, Sets, Sorted Sets
05 Estructuras Avanzadas — Bitmaps, HLL, Streams, Geoespacial
06 Transacciones, Scripting Lua y Pub/Sub
07 Patrones de diseño y casos de uso reales
08 Ejercicio integrador y cierre
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

01
Modelo Clave / Valor
El diccionario distribuido de alta velocidad

¿Qué es una Base de Datos Clave / Valor?
La abstracción más simple posible: un diccionario que escala.
Clave Valor (cualquier tipo, cualquier tamaño)
session:u001 {"user":"Ana","token":"abc123","exp":3600}
cache:prod:42 {"nombre":"Laptop","precio":85000,"stock":5}
lock:checkout "1" (mutex distribuido)
rate:ip:1.2.3 "47" (contador de requests)
Redis CLI:
SET session:u001 '{"user":"Ana","exp":3600}' EX 3600
GET session:u001 → O(1)
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

Características del Modelo Clave / Valor
| Acceso O(1) | Schema-free | Escalabilidad horizontal |
| ----------- | ----------- | ------------------------ |
La clave es el índice primario. Cualquier  El valor puede ser cualquier tipo de dato:  Distribución por hash de clave entre
valor es accesible en tiempo constante  string, JSON, blob binario, número. No  múltiples nodos. Sharding nativo. Sin
sin recorrer estructuras. hay esquema impuesto. joins ni constraints.
| TTL nativo | Atomicidad por clave | Consulta limitada |
| ---------- | -------------------- | ----------------- |
Cada clave puede tener un tiempo de  Las operaciones sobre una clave son  Solo se puede acceder por clave exacta (o
expiración automático (EXPIRE). Ideal  atómicas. INCR, SETEX, GETSET garantizan  rango si la estructura lo permite). No hay
| para caché y sesiones. | consistencia. | query by value. |
| ---------------------- | ------------- | --------------- |
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

Posicionamiento en la Taxonomía NoSQL
Cada modelo NoSQL está optimizado para un patrón de acceso predominante.
Modelo Ejemplos Casos de uso principales Fortaleza clave
Documental MongoDB, CouchDB Documentos semi-estructurados, APIs REST Consultas ricas por campos internos
Grafos Neo4j, ArangoDB Redes sociales, grafos de conocimiento Traversal de relaciones complejas
Clave / Valor Redis, DynamoDB Caché, sesiones, contadores, pub/sub Acceso O(1) por clave exacta
Tabular Cassandra, HBase Series temporales, IoT, escritura masiva Particionamiento por clave compuesta
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

¿Cuándo elegir un modelo Clave / Valor?
✅ Casos de uso ideales ❌ Cuándo NO es adecuado
• Caché de resultados de consultas costosas (DB,
• Consultas por valor, rango o múltiples campos —
APIs externas)
usar documental o tabular
• Gestión de sesiones de usuario con TTL automático
• Datos relacionales con integridad referencial — usar
• Contadores distribuidos atómicos (likes, views, rate
RDBMS
limiting)
• Grafos de conexiones complejas — usar Neo4j
• Gestión de colas y mensajería ligera (Pub/Sub,
• Conjuntos de datos que superan la RAM disponible
LPUSH/BRPOP)
sin hot/cold tiering
• Datos con acceso siempre por clave exacta y sin
• Reportes analíticos — usar columnar (Redshift,
joins
BigQuery)
• Feature flags, configuración distribuida dinámica
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

💬 DEBATE
¿En qué escenarios de su trabajo o proyecto
usarían una base de datos clave/valor
en lugar de su base de datos principal?
💡 Caché, sesiones, contadores, rate limiting, feature flags, pub/sub…

02
Redis
REmote DIctionary Server — Arquitectura y Modelo de Datos

¿Qué es Redis?
"Redis no es solo un caché. Es una plataforma de datos en memoria."
• Base de datos en memoria: todos los datos viven en RAM → latencias sub-milisegundo
• Modelo clave/valor con tipos de datos ricos: Strings, Listas, Hashes, Sets, Sorted Sets, Streams, Geo, HLL, Bitmaps
• Operaciones atómicas: cada comando es atómico (single-threaded event loop hasta v6, I/O multithreaded desde
v6)
• Persistencia opcional: RDB snapshots + AOF journal; no es solo un caché volátil
• Alta disponibilidad nativa: Replicación Maestro/Réplica + Redis Sentinel + Redis Cluster
• Pub/Sub y Streams: soporte para mensajería asíncrona y procesamiento de eventos
• Scripting server-side con Lua: transacciones atómicas complejas sin round-trips
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

Historia y Evolución de Redis
2009 Salvatore Sanfilippo crea Redis para escalar el análisis de logs de LLOOGG. Nombre: Remote Dictionary Server.
2010 VMware patrocina el desarrollo. Redis 2.0: Hashes, Sorted Sets, scripting Lua. Adopción masiva en Silicon Valley.
2013 Redis Labs (hoy Redis Inc.) es fundada. Redis 2.6 con Lua scripting integrado y Cluster en beta.
2015 Redis 3.0: Redis Cluster GA. Sharding nativo sin proxies. Hito de escalabilidad horizontal.
2018 Redis 5.0: Redis Streams — nueva estructura de datos para event sourcing. RESP3 protocol.
2020 Redis 6.0: Multi-threading para I/O, ACL (Access Control Lists), SSL/TLS nativo.
2024 Redis 7.4+: Redis Stack con módulos (Search, JSON, TimeSeries). Dual license (RSALv2 / SSPL).
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

Arquitectura Interna de Redis
Single-threaded event loop + multiplexing I/O = 100.000+ ops/seg con latencia < 1ms
| Event Loop | Command | In-Memory |
| ---------- | ------- | --------- |
Clientes
| (epoll/kqueue) | Processor | Data Store |
| -------------- | --------- | ---------- |
(TCP/RESP)
| Socket Multiplexing | (single thread) | (RAM) |
| ------------------- | --------------- | ----- |
Replication: Async replication → Replicas  |  Sentinel HA  |  Cluster Persistence: RDB Snapshots  |  AOF Journal  |  Hybrid (RDB+AOF)
¿Por qué single-thread? I/O multithreading (v6+) Protocolo RESP
Evita locks, context switches y race  El network I/O (read/write de sockets) se  Redis Serialization Protocol: binario,
conditions. CPU no es el bottleneck: la  paralelizó en v6.0, pero el procesamiento  simple, eficiente. RESP3 (v6+) agrega
red y el disco sí. de comandos sigue siendo single-thread. tipos como doubles, maps y sets nativos.
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

Tipos de Datos en Redis — Panorama General
Redis no almacena solo strings: es un servidor de estructuras de datos.
| String       | List              | Hash              |
| ------------ | ----------------- | ----------------- |
| SET/GET/INCR | LPUSH/RPUSH/BRPOP | HSET/HGET/HGETALL |
Caché, contadores, tokens Colas, feeds, historial Objetos/entidades
| Set                  | Sorted Set        | Bitmap          |
| -------------------- | ----------------- | --------------- |
| SADD/SMEMBERS/SINTER | ZADD/ZRANGE/ZRANK | SETBIT/BITCOUNT |
Tags, membership, unicidad Rankings, leaderboards, scoring Flags compactos, DAU tracking
| HLL           | Stream            | Geo            |
| ------------- | ----------------- | -------------- |
| PFADD/PFCOUNT | XADD/XREAD/XGROUP | GEOADD/GEODIST |
Cardinalidad aprox. (UV, unique) Event sourcing, log, IoT Puntos geoespaciales, cercanía
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

03
Persistencia, Replicación y Alta Disponibilidad
Durabilidad de datos y resiliencia ante fallos

Persistencia — RDB vs AOF
Redis es in-memory: ¿cómo sobrevive un reinicio o un crash?
RDB — Point-in-time Snapshot AOF — Append Only File
• Fork del proceso principal → escritura en background • Registra cada operación de escritura como log
• Archivo binario compacto (.rdb) → rápido de cargar • Modos: always | everysec | no (fsync policy)
• Configurable: SAVE 900 1 (cada 900s si ≥1 cambio) • AOF Rewrite: compacta el log periódicamente
• ✅ Backups compactos, carga rápida al reiniciar • ✅ Durabilidad alta (máx 1 seg de pérdida con everysec)
• ✅ Bajo impacto en rendimiento durante operación • ✅ Archivo legible, auditable, recuperable
• ❌ Pérdida de datos entre el último snapshot y el crash • ❌ Archivo más grande, carga más lenta que RDB
💡 Recomendación productiva: usar RDB + AOF (Hybrid) — mayor durabilidad con backup compacto.
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

Replicación en Redis
La replicación es asíncrona y unidireccional: Maestro → Réplicas.
🟢 MAESTRO
(acepta escrituras)
📋 Réplica 1 📋 Réplica 2 📋 Réplica 3
(solo lectura) (solo lectura) (solo lectura)
Alta disponibilidad Escalabilidad de lectura Backup en caliente
Si el Maestro falla, Sentinel promueve Las réplicas atienden lecturas, Se puede hacer BGSAVE sobre una
una Réplica automáticamente (failover). distribuyendo la carga sin tocar el Réplica sin afectar la performance del
Maestro. Maestro.
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

Alta Disponibilidad — Sentinel vs Cluster
Redis Sentinel Redis Cluster
HA sin sharding Sharding nativo + HA
• 3+ nodos Sentinel monitorizan al Maestro
• 16.384 hash slots distribuidos entre N maestros
• Failover automático: promueve una Réplica si el Maestro
cae • Cada maestro tiene 1+ réplicas para HA
• Service discovery: los clientes preguntan a Sentinel por el • Gossip protocol: los nodos se auto-descubren
Maestro actual
• Failover automático sin Sentinel externo
• Quórum configurable para evitar split-brain
• ✅ Escala escrituras y capacidad horizontalmente
• ✅ Simple, adecuado si los datos caben en un solo nodo
• ❌ Comandos multi-key requieren misma hash slot
• ❌ No distribuye datos — no escala escrituras
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

Redis y el Teorema CAP
¿Dónde vive Redis en el triángulo CAP? Depende de la configuración.
Modo CAP Comportamiento
Redis Standalone CP Consistencia + Partition Tolerance. Sin réplicas no hay trade-off de disponibilidad.
Redis Sentinel CP/AP Failover automático puede causar breve ventana de inconsistencia durante la elección.
Redis Cluster AP Replicación asíncrona. En un split-brain, réplicas pueden responder con datos stale.
WAIT command CP Permite esperar confirmación de N réplicas → consistency sync bajo demanda.
Caché (sin persist.) AP Máxima disponibilidad y performance. Tolerancia a datos desactualizados o perdidos.
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

04
Tipos de Datos — Profundidad
Strings · Listas · Hashes · Sets · Sorted Sets

Strings — El tipo más versátil
E# 6O5p1e0r0aciones básicas
> SET serie:1000 "Black Mirror" EX 3600 NX # crea si no existe, TTL 1h
> GET serie:1000
→ "Black Mirror"
# Contadores atómicos
> SET likes 10
> INCR likes → 11 (atómico, sin race conditions)
> INCRBY likes 10 → 21
# Operaciones masivas
> MSET serie:1001 "The OA" serie:1002 "Dark"
> MGET serie:1001 serie:1002
→ 1) "The OA"
→ 2) "Dark"
# Key-space commands
> EXISTS serie:1000 → 1
> TYPE serie:1000 → string
> TTL serie:1000 → 3541 (segundos restantes)
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

Listas — Cola, Stack y Feed
Las listas en Redis son listas enlazadas: LPUSH/RPUSH en O(1) independiente del tamaño.
LPUSH 4→ (último) 3 2 1 (primero) ← RPUSH
> LPUSH numeros 1 → [1]
> LPUSH numeros 2 3 → [3, 2, 1] # múltiples elementos
> RPUSH numeros 4 → [3, 2, 1, 4]
> LRANGE numeros 0 -1 → 1) "3" 2) "2" 3) "1" 4) "4"
> LPOP numeros → "3" # elimina y retorna
> LTRIM numeros 0 1 → OK (recorta a los 2 primeros)
> BRPOP tasks 5 → bloquea hasta 5s esperando elemento
Cola de tareas (Queue) Feed cronológico Stack (LIFO)
LPUSH + BRPOP → patrón LPUSH nuevos items + LTRIM → mantener LPUSH + LPOP → pila de operaciones,
productor/consumidor sin polling. Worker solo los últimos N. Ideal para timelines. historial de navegación, undo stack.
espera bloqueado.
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

Hashes — Representación de Objetos
E# 6H5a1s0h0 = objeto con campos → ideal para representar entidades
> HSET serie:1000 title "Black Mirror" season 1 episode 1 likes 22
→ (integer) 4 # 4 campos creados
> HGET serie:1000 title → "Black Mirror"
> HMGET serie:1000 title season → 1)"Black Mirror" 2)"1"
> HGETALL serie:1000
→ title / "Black Mirror" / season / "1" / episode / "1" / likes / "22"
> HINCRBY serie:1000 likes 5 → 27 # atómico
> HDEL serie:1000 episode
> HKEYS serie:1000 → title, season, likes
# ¿Hash o String JSON? Hash si necesitas acceso parcial a campos.
# String JSON si siempre lees/escribís el objeto completo.
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

Sets — Colecciones sin Duplicados y Operaciones de Conjuntos
Los Sets permiten modelar membresías, relaciones y tags con operaciones de conjuntos en O(1).
> SADD article:1000:tags ciencia it nosql → 3 SINTER SUNION
> SADD article:1001:tags it python → 2
> SMEMBERS article:1000:tags
→ ciencia, it, nosql
Intersección Unión
> SISMEMBER article:1000:tags python → 0
> SCARD article:1000:tags → 3
> SINTERSTORE common article:1000:tags article:1001:tags SDIFF SMOVE
> SMEMBERS common → it
Diferencia Mover atómico
Tags & etiquetas Amigos en común Usuarios únicos del día
Artículos, productos, usuarios con tags. SET de amigos por usuario. SADD visitantes:2024-01-15 userId →
Intersección para encontrar elementos SINTER(user:a:friends, user:b:friends) = unicidad garantizada. SCARD = total
comunes. amigos compartidos. único.
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

Sorted Sets — Rankings y Leaderboards
Igual que un Set pero cada elemento tiene un score (float) que define su orden. Los elementos siempre están ordenados.
> ZADD hackers 1940 "Alan Kay" 1957 "Sophie Wilson" Leaderboard en tiempo real
1953 "Richard Stallman" 1949 "Anita Borg"
ZADD scores userId puntos → ZREVRANGE scores 0 9
> ZRANGE hackers 0 -1 WITHSCORES # ascendente = Top 10 players
→ Alan Kay/1940, Anita Borg/1949, R.Stallman/1953...
> ZRANK hackers "Alan Kay" → 0 (posición)
> ZREVRANK hackers "Alan Kay" → 3 Ranking de popularidad
> ZRANGEBYSCORE hackers 1940 1950
Score = número de views/likes. ZINCRBY para
→ Alan Kay, Anita Borg
actualizar. Ordenado siempre.
> ZREMRANGEBYSCORE hackers 1960 +inf
Job scheduling
💡 ZRANGEBYLEX: cuando todos tienen el mismo score, el orden es lexicográfico. Útil para
rangos de strings. Score = timestamp de ejecución. ZRANGEBYSCORE 0
now → tareas pendientes.
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

⚡ DESAFÍO TÉCNICO
¿Qué estructura usarías para cada caso?
Para cada escenario, elegí el tipo de dato Redis más apropiado y justificá:
A) Guardar los últimos 5 pedidos de un usuario (con orden de llegada)
B) Saber si un usuario ya votó en una encuesta hoy
C) Ranking global de players en un juego online (actualizado en tiempo real)
D) Perfil de un producto con nombre, precio, stock y categoría
🔑 Pista: List, Set, Sorted Set, Hash — ¡hay una respuesta óptima para cada caso!

05
Estructuras Avanzadas
Bitmaps · HyperLogLog · Streams · Geoespacial

Bitmaps — Flags Compactos a Nivel de Bits
Un Bitmap es un String interpretado como array de bits. 512 MB → 4.000 millones de flags.
# ¿Qué usuarios se conectaron hoy? (user_id = posición de DAU / MAU tracking
bit)
> SETBIT logins:2024-01-15 42 1 # user 42 se conectó Bit = userId. BITCOUNT = usuarios únicos activos. 100M
> SETBIT logins:2024-01-15 99 1 # user 99 se conectó usuarios → solo 12.5 MB.
> GETBIT logins:2024-01-15 42 → 1
> GETBIT logins:2024-01-15 50 → 0 (no se conectó)
> BITCOUNT logins:2024-01-15 → 2 (DAU del día)
Feature flags
# Usuarios activos en AMBOS días (AND)
> BITOP AND activos logins:2024-01-14 logins:2024-01-15
Un bit por feature por usuario. GETBIT para saber si el
> BITCOUNT activos → n usuarios activos
feature está habilitado.
ambos días
BITPOS: encuentra el primer bit encendido o apagado en el rango especificado.
Retención de usuarios
BITOP AND: usuarios que usaron el producto N días
seguidos. Cohort analysis.
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

HyperLogLog — Cardinalidad Aproximada con Memoria Fija
¿Cuántos usuarios únicos visitaron el sitio hoy? Con millones de usuarios, ¿cómo calcularlo sin guardarlos todos?
SET — Exacto HyperLogLog — Aproximado (±0.81%)
✅ Conteo exacto ✅ Error máximo de 0.81%
❌ Memoria proporcional a elementos ✅ Máximo 12KB fijo independiente del volumen
❌ 1M usuarios = ~50MB mínimo ✅ Soporta MERGE de múltiples HLLs
❌ No escalable para big data ✅ Ideal para analytics de alto volumen
> PFADD busquedas:hoy "zapatillas" "laptop" "redis" "zapatillas" # dup ignorado
> PFCOUNT busquedas:hoy → 3
> PFADD busquedas:ayer "redis" "mongodb" "postgresql"
> PFMERGE busquedas:semana busquedas:hoy busquedas:ayer
> PFCOUNT busquedas:semana → ~5 (± 0.81%)
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

Redis Streams — Event Sourcing y Mensajería
Redis 5.0+: Streams es la estructura más sofisticada. Log append-only con consumer groups.
> XADD events * action "compra" userId 42 productId 100 monto 8500
→ "1705123456789-0" # ID = timestamp-secuencia
> XREAD COUNT 10 STREAMS events 0 # leer desde el inicio
> XREAD BLOCK 0 STREAMS events $ # bloquear hasta nuevo evento
> XGROUP CREATE events procesador $ # consumer group
> XREADGROUP GROUP procesador worker1 COUNT 5 STREAMS events >
> XACK events procesador "1705123456789-0" # confirmar procesamiento
vs Pub/Sub vs Kafka (light) Consumer Groups
Pub/Sub no persiste mensajes. Streams Streams es Kafka simplificado: sin cluster Múltiples workers procesan mensajes en
sí. Si el consumer falla, puede releer propio, sin particiones, pero sufficient paralelo. XACK confirma. XPENDING ve
desde donde quedó. para cargas medianas. mensajes sin ACK.
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

Comandos Geoespaciales en Redis
Redis almacena coordenadas como Sorted Sets con score = geohash codificado. Búsqueda por radio en O(N+log M).
> GEOADD locales -58.3816 -34.6037 "sucursal_palermo" Delivery y logística
-58.4000 -34.6200 "sucursal_caballito"
-58.3700 -34.5900 "sucursal_recoleta" Encontrar el repartidor o depósito más cercano al
domicilio del cliente en tiempo real.
> GEODIST locales sucursal_palermo sucursal_recoleta km
→ "1.43" # kilómetros
> GEOPOS locales sucursal_palermo
Aplicaciones de cercanía
→ -58.3816, -34.6037
Buscar comercios, usuarios o puntos de interés en
> GEOSEARCH locales FROMMEMBER sucursal_palermo
un radio configurable.
BYRADIUS 3 km ASC COUNT 5
→ sucursal_palermo, sucursal_recoleta
Geofencing
Detectar si un punto entra/sale de un área.
Combinable con TTL para eventos temporales.
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

06
Transacciones, Scripting Lua y Pub/Sub
Atomicidad, scripting server-side y mensajería asíncrona

Transacciones — MULTI / EXEC / DISCARD
Redis no hace rollback automático. Garantiza aislamiento (secuencialidad) y atomicidad de ejecución.
# Like en un post: actualizar set de usuarios y contador ✅ Aislamiento
> MULTI
> SADD post:100:likes:users "JonSnow" Los comandos de la TX se ejecutan secuencialmente sin
> INCR post:100:likes:counter intercalado de otros clientes.
> EXEC
→ 1) (integer) 1
✅ Atomicidad de ejecución
2) (integer) 1
O se ejecutan todos o ninguno (si DISCARD o error antes
# Descartar una transacción de EXEC).
> MULTI
> SET x 10
❌ Sin rollback automático
> DISCARD # cancela toda la transacción
Si un comando falla dentro de EXEC, el resto se ejecuta
igual. Error = bug de programación.
⚠ WATCH (Optimistic Lock)
WATCH clave → si la clave cambia antes de EXEC, la TX se
cancela (retorna nil).
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

Scripting Lua — Atomicidad sin Round-Trips
D--9 3S0c2r5ipt: transferencia atómica de saldo entre dos cuentas
-- redis.call() ejecuta comandos Redis desde Lua
local saldo = tonumber(redis.call('GET', KEYS[1]))
local monto = tonumber(ARGV[1])
if saldo >= monto then
redis.call('DECRBY', KEYS[1], monto)
redis.call('INCRBY', KEYS[2], monto)
return 1 -- éxito
else
return 0 -- saldo insuficiente
end
-- Ejecutar desde CLI: KEYS = cuentas, ARGV = monto
> EVAL "...script..." 2 cuenta:1001 cuenta:1002 5000
→ 1 (transferencia exitosa)
-- EVALSHA: cachear script por SHA1 (evitar re-envío del código)
> SCRIPT LOAD "...script..." → "sha1hash"
> EVALSHA sha1hash 2 cuenta:1001 cuenta:1002 5000
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

Pub/Sub — Mensajería Asíncrona
Pub/Sub implementa el patrón publicador/suscriptor sin persistencia de mensajes.
📤 App Pagos 📥 Worker Notif.
CANAL
📤 App Envíos 📥 Worker Audit
events:orders
📤 App Usuarios 📥 Worker Stats
# Suscriptor (cliente 1): SUBSCRIBE events:orders
# Patrón: PSUBSCRIBE events:* # todos los channels de eventos
# Publicador (cliente 2): PUBLISH events:orders '{"orderId":42,"status":"paid"}'
→ 3 # 3 suscriptores recibieron el mensaje
⚠ Pub/Sub no persiste mensajes. Si un suscriptor se desconecta, pierde los mensajes enviados durante su ausencia. Para durabilidad → usar
Streams.
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

07
Patrones de Diseño y Casos de Uso Reales
Cómo las empresas usan Redis en producción

Patrones de Diseño con Redis
Cache-Aside (Lazy Loading) Write-Through Write-Behind (Async)
GET → miss → DB → SET SET (Redis) → SET (DB) SET Redis → async → DB
El cliente lee Redis primero. Si miss,  Toda escritura va a Redis y DB  Escritura en Redis primero, persistencia
consulta DB y guarda en Redis. Patrón  simultáneamente. Datos siempre frescos  asíncrona a DB. Alto rendimiento pero
| más común.    | pero mayor latencia. | riesgo de pérdida. |
| ------------- | -------------------- | ------------------ |
| Rate Limiting | Session Store        | Distributed Lock   |
| INCR + EXPIRE | SET/GET + TTL        | SET NX PX          |
INCR contador por IP/user + EXPIRE  Token de sesión como clave, datos del  SET clave valor NX PX 30000 → lock
ventana temporal. Atómico, sin locks  usuario como valor. EXPIRE para  atómico con timeout. SETNX garantiza
externos necesarios. invalidación automática. exclusión mutua.
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

Caso Real — Twitter / X: Redis a Escala Masiva
Twitter usó Redis como backbone para servir timelines a 300M+ usuarios activos diarios.
Timeline (Home Feed) Rate Limiting y Trending Distributed Lock y Sesiones
• Sorted Set por usuario: ZADD
• INCR + EXPIRE para rate limiting de • SET sessionToken userId EX 86400
timeline:userId timestamp tweetId
la API por IP y por usuario → sesión con TTL de 24h
• Fanout on Write: al publicar, se
• Sorted Set para trending topics: • Locks distribuidos con SETNX para
pushea a los timelines de
ZINCRBY trends:hora hashtag count evitar procesamiento duplicado
seguidores
• ZREVRANGE trends:hora 0 9 → Top • Pub/Sub para notificaciones push
• ZREVRANGE timeline:userId 0 N →
10 trending en tiempo real entre nodos de la aplicación
los N tweets más recientes
• Contadores de likes/RTs con INCR • Bitmaps para tracking de
• Cache de los últimos 800 tweets
atómico sin contención notificaciones leídas/no leídas
por usuario en memoria
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

Redis vs Otras Bases Clave/Valor
El ecosistema KV es amplio. La elección depende del caso de uso, escala y modelo de consistencia requerido.
| Característica | Redis | Memcached | DynamoDB | etcd |
| -------------- | ----- | --------- | -------- | ---- |
Tipos de datos Ricos (10+) Solo string Tabla (items) String/JSON
| Persistencia | RDB + AOF | ❌ No | ✅ Managed | ✅ Raft log |
| ------------ | --------- | ---- | --------- | ---------- |
|              | ✅ Sí      | ✅ Sí | ✅ Global  | ✅ Sí       |
Cluster nativo
| Pub/Sub / Streams | ✅ Nativo | ❌ No   | DynamoDB Strm | Watch API |
| ----------------- | -------- | ------ | ------------- | --------- |
| Latencia típica   | < 1 ms   | < 1 ms | 1-10 ms       | 1-5 ms    |
Mejor caso de uso Caché + state Caché simple Cloud-native Config/coord.
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

💬 DEBATE
¿Cuándo elegirían DynamoDB sobre Redis?
¿Y Redis sobre DynamoDB?
💡 Serverless, vendor lock-in, modelo de pricing, tipos de datos, latencia, gestión operacional…

08
Ejercicio Integrador y Cierre
Aplicando Redis a un caso real completo

🏋 EJERCICIO INTEGRADOR
Sistema de E-commerce con Redis
Diseñá la capa Redis para un e-commerce con los siguientes requerimientos:
1) Sesiones de usuario: login con expiración en 2 horas
2) Carrito de compras: agregar/quitar productos con cantidad y precio
3) Ranking de productos más vendidos: Top 10 en tiempo real
4) Rate limiting: máximo 100 requests/minuto por usuario
5) Caché de catálogo: producto por ID con TTL de 5 minutos
6) Notificaciones en tiempo real: publicar eventos de compra
Para cada punto indicá: tipo de dato Redis, estructura de clave, comandos principales y justificación.
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

Ejercicio — Solución Orientativa
0# 013)D AS5esión: String con TTL
SET session:{token} '{"userId":42,"email":"ana@ej.com"}' EX 7200
# 2) Carrito: Hash (acceso parcial por campo)
HSET cart:{userId} prod:100 '{"qty":2,"price":8500}' prod:200 '{"qty":1,"price":3200}'
# 3) Ranking: Sorted Set (score = unidades vendidas)
ZINCRBY ranking:ventas 1 "prod:100" # cada venta
ZREVRANGE ranking:ventas 0 9 WITHSCORES # Top 10
# 4) Rate limiting: String + INCR + EXPIRE
SET rate:{userId}:{minuto} 0 EX 60 NX # inicializa ventana
INCR rate:{userId}:{minuto} # cuenta el request
# 5) Caché de producto: String JSON con TTL
SET cache:product:{id} '{...}' EX 300 # 5 minutos
# 6) Notificaciones: Pub/Sub
PUBLISH events:compras '{"orderId":99,"userId":42,"total":11700}'
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

Errores Conceptuales Frecuentes con Redis
❌ Redis es solo un caché
✅ Redis es una base de datos de estructuras de datos en memoria con persistencia, replicación, Pub/Sub y Streams. Usarlo solo
como caché es desperdiciar el 80% de su potencial.
❌ Redis garantiza durabilidad por defecto
✅ Por defecto Redis es in-memory sin persistencia habilitada. Si el proceso muere, los datos se pierden. Hay que configurar RDB
y/o AOF explícitamente.
❌ Las transacciones de Redis hacen rollback automático
✅ No. Si un comando dentro de MULTI/EXEC falla en ejecución, los demás continúan. El rollback automático no existe en Redis
por diseño (simplicidad y performance).
❌ Redis Cluster resuelve todo sin cambios en la aplicación
✅ En Cluster, comandos multi-key (MGET, SINTER, SUNION) solo funcionan si todas las claves están en el mismo hash slot. El
diseño de claves debe contemplarlo usando hash tags {tag}.
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

Cierre — Comparativa de Modelos NoSQL (Resumen de las Clases 3-6)
¿Qué base de datos NoSQL elegiría para cada escenario?
| Modelo | DB  | Fortaleza | Cuándo NO usarla |
| ------ | --- | --------- | ---------------- |
Documentos jerárquicos, queries ricas, esquema
Documental
|     | MongoDB |     | Datos muy relacionales o grafos |
| --- | ------- | --- | ------------------------------- |
flexible
Relaciones complejas, traversal, paths,
| Grafos | Neo4j |     | Sin relaciones o dataset tabular masivo |
| ------ | ----- | --- | --------------------------------------- |
recomendaciones
Clave/Valor Redis Caché, sesiones, contadores, pub/sub, rankings Queries por valor, relaciones, reporting
Escritura masiva, series temporales, IoT, alta
| Tabular | Cassandra |     | Joins, queries ad-hoc, baja cardinalidad |
| ------- | --------- | --- | ---------------------------------------- |
escala
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

Preguntas de Reflexión — Para Pensar en Casa
1. Diseño de clave y TTL 2. Consistencia en Cluster
Un sistema de reservas hoteleras necesita bloquear una En Redis Cluster, necesitás ejecutar SINTERSTORE sobre dos
habitación por 15 minutos mientras el usuario completa el Sets que podrían estar en distintos nodos. ¿Cómo resolvés
pago. ¿Cómo lo implementarías con Redis? ¿Qué pasa si el esto? ¿Qué son los hash tags y cómo los usarías?
usuario abandona sin completar la reserva?
3. RDB vs AOF en producción 4. Redis vs Kafka
Tu aplicación no puede tolerar más de 1 segundo de pérdida de Un arquitecto propone reemplazar Kafka por Redis Streams
datos ante un crash. ¿Qué configuración de persistencia elegís para el bus de eventos de la empresa. ¿Cuándo sería una
y por qué? ¿Cómo afecta esto al rendimiento? buena idea? ¿Cuándo definitivamente no?
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

Bibliografía y Recursos
Obligatoria
• Harrison, G. (2015). Next Generation Databases: NoSQL, NewSQL, and Big Data. Apress. — Cap. KV Stores
• Pivert, O. (Ed.). (2018). NoSQL Data Models: Trends and Challenges. ISTE. — Parte II: Key/Value Models
• Deka, G. C. (2017). NoSQL: Database for Storage and Retrieval of Data in Cloud. CRC Press.
Documentación Oficial
• Redis Documentation — redis.io/docs — Referencia de comandos, tipos de datos, persistencia y clustering
• Redis Commands Reference — redis.io/commands — Todos los comandos con complejidad algorítmica
• Redis University — university.redis.com — Cursos gratuitos certificados de Redis
Ing. Damián Arnaudo — Ingeniería de Datos II — Bases de Datos Clave/Valor: Redis

Resumen de la Clase
Modelo KV El más simple de NoSQL: O(1) por clave, schema-free, escalable horizontalmente por hash de clave.
Plataforma de datos en memoria: 10+ tipos de datos, persistencia configurable (RDB+AOF), HA
Redis
(Sentinel/Cluster).
Tipos de datos Cada tipo tiene su caso de uso: String→caché, List→colas, Hash→objetos, Set→membresía, ZSet→rankings.
Avanzado Bitmaps, HLL, Streams y Geo amplían Redis a analytics, event sourcing y geolocalización.
Transacciones MULTI/EXEC = aislamiento + atomicidad. Sin rollback automático. Lua para lógica server-side compleja.
Patrones Cache-Aside, Rate Limiting, Session Store, Distributed Lock, Pub/Sub son patrones estándar con Redis.
Próxima Clase — Clase 7: Bases de Datos Tabulares · Apache Cassandra · CQL y Modelo de Datos