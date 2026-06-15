# 05 — Redis (Repaso Mínimo)

⚠️ **Redis NO está en el TP**. Lo incluyo porque el profe puede preguntar comparativas tipo "¿y si hubieran usado Redis?". Necesitás saber lo justo para no quedar mal.

---

## 1. Qué es Redis (lo mínimo)

> "Redis es una base de datos **clave-valor en memoria**. Latencia sub-milisegundo. Se usa típicamente como **caché**, sesiones, contadores en vivo, leaderboards, pub/sub. Tiene persistencia opcional (RDB snapshots + AOF append-only file). **No** es un reemplazo de MongoDB — es complementario."

---

## 2. Tipos de datos (es lo que más se pregunta)

| Tipo | Comando ejemplo | Caso de uso |
|---|---|---|
| **String** | `SET key val EX 3600` | Sesiones con TTL, contadores |
| **Hash** | `HSET user:1 name Ana email a@x.com` | Objetos estructurados |
| **List** | `RPUSH cola item` / `LPOP cola` | Colas, pilas |
| **Set** | `SADD tags electronica` | Conjuntos sin duplicados |
| **Sorted Set** | `ZADD ranking 100 user1` | Leaderboards, rankings |
| **Bitmap / HLL / Stream** | — | Avanzados, no es probable que pregunte |

---

## 3. Comandos básicos que tenés que conocer

```redis
PING                          # → PONG
SET clave valor EX 3600       # SET con TTL de 1 hora
GET clave
INCR contador                 # +1 atómico
DECR contador                 # -1 atómico
EXPIRE clave 300              # TTL de 5 min a clave existente
TTL clave                     # ver segundos restantes
DEL clave

HSET user:1 name Ana email a@x.com
HGET user:1 name
HGETALL user:1

RPUSH cola pedido1 pedido2    # agregar al final (cola)
LPOP cola                     # extraer del inicio
LRANGE cola 0 -1              # ver todo

SADD tags tech laptop
SMEMBERS tags
SISMEMBER tags tech           # ¿pertenece?

ZADD leaderboard 100 ana 200 luis
ZREVRANGE leaderboard 0 4 WITHSCORES   # top 5

# Pub/Sub
SUBSCRIBE canal
PUBLISH canal "mensaje"

# Transacciones
MULTI
HINCRBY producto:101 stock -1
ZADD ventas timestamp venta:1
EXEC
```

---

## 4. ¿Y si nos pregunta "por qué no usaron Redis en su TP"?

⭐ **Respuesta lista para defender**:

> "Redis es para **datos operativos en memoria**: sesiones, caché, contadores en vivo, rate limiting. **No** es persistente por default y no soporta queries ricas. En nuestro TP los datos necesitan persistir y consultarse con filtros complejos (catálogo de canciones, métricas históricas). Redis podría agregarse en una capa adicional como caché de los resultados de OP-1 o como rate limiter para OP-2, pero no como motor principal. **Es complementario, no sustituto**."

---

## 5. ¿Cuándo SÍ se elegiría Redis?

- **Sesiones de usuario**: token en hash con TTL.
- **Carrito de compras**: hash + TTL (descarta si abandonan).
- **Leaderboards**: sorted set.
- **Rate limiting**: `INCR` con TTL.
- **Caché de queries pesadas**: store del resultado por unos minutos.
- **Pub/Sub entre microservicios** (sin garantía de durabilidad).
- **Locks distribuidos**: `SET key val NX EX 30`.

En nuestro TP, **el chart en tiempo real podría haberse hecho con un sorted set de Redis** en lugar de la tabla COUNTER de Cassandra. Trade-off:
- Redis: latencia sub-ms, pero los datos viven en memoria → más caro a escala.
- Cassandra (lo que elegimos): persistente, distribuido, ya viene con el cluster.

---

## 6. CAP de Redis

- **Standalone**: CA (sin partición, un solo nodo).
- **Sentinel**: CP. Failover automático (~30s).
- **Cluster**: AP durante partición. Sharding nativo con 16384 hash slots.

---

## 7. Comparativa de los 4 motores NoSQL

| | MongoDB | Neo4j | Cassandra | **Redis** |
|---|---|---|---|---|
| Modelo | Documento | Grafo | Wide Column | **K/V + estructuras** |
| Latencia | ~5ms | ~15ms (3 saltos) | ~10ms (write) | **<1ms** |
| Persistencia | ✅ default | ✅ default | ✅ default | **Opcional (RDB/AOF)** |
| Queries ricas | ✅ | ✅ Cypher | ❌ | ❌ |
| CAP | CP | CP | AP | CA/CP/AP según modo |
| Caso ideal | Catálogos | Redes | Time-series | **Caché, sesiones, rankings** |

---

## 8. Si el profe insiste en Redis (preguntas que pueden caer)

### "¿Por qué Redis es tan rápido?"
> "Porque vive en RAM y todas las operaciones son single-threaded (no hay locks). Latencia sub-ms."

### "¿Es persistente?"
> "Por default sí, con **RDB** (snapshots periódicos) y/o **AOF** (append-only file por cada comando). Pero su fortaleza es la memoria, no la durabilidad."

### "¿Reemplaza a MongoDB?"
> "No. Redis es para datos operacionales en tiempo real (sesiones, caché, contadores). MongoDB es para datos persistentes con queries ricas. Son **complementarios**."

### "Diferencia entre Redis SET y Redis Sorted Set"
> "SET es un conjunto sin duplicados, sin orden. Sorted Set asigna un score a cada miembro y los ordena por ese score — ideal para rankings o leaderboards."
