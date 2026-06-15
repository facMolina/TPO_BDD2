# 06 — CAP, Replicación, Particionamiento, Performance

⭐⭐⭐ **Este archivo es el más importante para las preguntas teóricas.** Según los compañeros, todo el foco está en **CAP** y **performance**.

---

## 1. Teorema CAP — Lo que SÍ dice y lo que NO

### Definición (memorizá esta)

> "En un sistema distribuido en presencia de una **Partición de red**, solo se puede garantizar **Consistencia** O **Disponibilidad**, no ambas simultáneamente. — Eric Brewer (2000), formalizado por Gilbert & Lynch (2002)."

### Las tres letras

| Letra | Significado | Garantía |
|---|---|---|
| **C** — Consistency | Todos los nodos ven el mismo dato al mismo tiempo | Una lectura siempre ve la escritura más reciente |
| **A** — Availability | Toda solicitud recibe respuesta (sin error) | Pero no necesariamente con el dato más reciente |
| **P** — Partition Tolerance | El sistema sigue operando aunque haya pérdida de mensajes entre nodos | Crítico en sistemas distribuidos reales |

### Lo que NO dice CAP

⚠️ **CAP NO dice "elegí 2 de 3 siempre"**. Dice: en presencia de partición, no podés tener C y A simultáneamente. **El 99.9% del tiempo, sin partición, podés tener las dos**.

### Posición de cada motor del TP

| Motor | Posición CAP | Por qué |
|---|---|---|
| **MongoDB** (con `w:majority`) | **CP** | El Primary rechaza escrituras si no puede confirmar a la mayoría del replica set |
| **Neo4j** (cluster Raft) | **CP** | Los Core Servers sin quorum rechazan escrituras |
| **Cassandra** | **AP** | Cada nodo acepta escrituras independientemente; convergen eventualmente |

### Frase para defensa

> "MongoDB y Neo4j son CP — priorizan que los datos sean consistentes incluso si el sistema deja de aceptar escrituras. Cassandra es AP — prioriza estar disponible incluso si los datos divergen temporalmente. Nuestro TP combina los tres porque cada operación tiene un trade-off distinto: el catálogo necesita consistencia, los eventos necesitan disponibilidad."

---

## 2. Más allá de CAP — PACELC (mencionalo si querés ganar puntos)

Daniel Abadi (2012) propuso una extensión:

> "Si hay **P**artición, elegís entre **A**vailability o **C**onsistency. **E**n otro caso (sin partición, **Else**), elegís entre **L**atency o **C**onsistency."

| Motor | P choice | E choice |
|---|---|---|
| Cassandra | A | L |
| DynamoDB | A | L |
| **MongoDB** | C | C |
| Google Spanner | C | C |

> **Por qué importa**: CAP solo modela qué pasa **durante** la partición. PACELC modela también el comportamiento normal, donde la elección es Latencia vs. Consistencia.

---

## 3. Cassandra Tunable Consistency — La fórmula que tenés que saber

```
W + R > N
```

- **N** = Replication Factor (RF) — cuántas copias del dato.
- **W** = Consistency Level de escritura — cuántas réplicas confirman antes del ACK.
- **R** = Consistency Level de lectura — cuántas réplicas se consultan.

**Si W + R > N → consistencia fuerte garantizada por overlap.**
**Si W + R ≤ N → consistencia eventual.**

### Tabla de casos

| RF | Write CL | Read CL | W+R>N? | Garantía | Trade-off |
|---|---|---|---|---|---|
| 3 | ONE (1) | ONE (1) | 2 > 3 ❌ | Eventual | Máximo throughput, posible stale read |
| 3 | QUORUM (2) | QUORUM (2) | 4 > 3 ✅ | **Fuerte (balance recomendado)** | Bueno para 99% de casos |
| 3 | ALL (3) | ONE (1) | 4 > 3 ✅ | Fuerte | Writes lentos, si un nodo cae → error |
| 3 | ONE (1) | ALL (3) | 4 > 3 ✅ | Fuerte | Writes rápidos, reads lentos |
| 3 | QUORUM (2) | ONE (1) | 3 > 3 ❌ | No garantizado | Borde peligroso |

### Niveles de Cassandra (memorizá los más comunes)

| Nivel | Descripción |
|---|---|
| `ANY` | Al menos 1 nodo (incluso un hinted handoff). Mínima latencia, máximo riesgo. |
| `ONE` | El nodo más cercano confirma. Lecturas posiblemente stale. |
| `LOCAL_ONE` | Igual que ONE pero solo en el datacenter local. |
| `QUORUM` | Mayoría del cluster: `RF/2 + 1`. |
| **`LOCAL_QUORUM`** | **Mayoría en el DC local. Recomendado en multi-DC.** |
| `EACH_QUORUM` | Mayoría en CADA datacenter. Máxima consistencia global. |
| `ALL` | Todas las réplicas. Si una cae → error. |

---

## 4. MongoDB — Write Concern y Read Concern

### Write Concern (`w`)

| Valor | Significado |
|---|---|
| `w: 0` | Fire & forget. Sin ACK. |
| `w: 1` | Solo el Primary confirma (default). |
| `w: majority` | Mayoría del Replica Set. **Recomendado en producción.** |
| `j: true` | Escribe en el journal antes del ACK. Durabilidad. |
| `wtimeout` | Timeout para el ACK. |

### Read Concern

| Valor | Significado |
|---|---|
| `local` | Lee del Primary o Secondary sin importar lag. |
| `available` | Como local, en sharded clusters. |
| `majority` | Solo datos confirmados por la mayoría. |
| `linearizable` | Garantía más fuerte: sin datos stale. |
| `snapshot` | Vista consistente de un instante (transacciones). |

### Frase clave

> "MongoDB es CP solo si lo configurás como tal. Con `w: 1` se comporta como AP. Por eso decir 'MongoDB es CP' es una simplificación — depende de la configuración."

---

## 5. Replicación — Los 3 modelos

### 5.1 Master-Slave (Single-Primary)

> Un nodo recibe escrituras, los demás replican y sirven lecturas.

```
    MASTER ────► SLAVE 1
       │      ► SLAVE 2
       │      ► SLAVE 3
       │
     WRITES    READS (desde cualquier slave)
```

| Ventajas | Limitaciones |
|---|---|
| Simple de configurar | Master = SPOF (Single Point of Failure) |
| Reads escalables | Writes no escalan |
| Backups sin impacto | Lag en réplicas → lecturas stale |

**Ejemplos**: MySQL, MongoDB Replica Set.

### 5.2 Multi-Master (Multi-Primary)

> Múltiples nodos aceptan escrituras simultáneamente.

```
   MASTER A ◄──► MASTER B ◄──► MASTER C
   (BsAs)       (Miami)        (Frankfurt)
```

| Ventajas | Limitaciones |
|---|---|
| Baja latencia geográfica | **Conflictos de escritura concurrente** |
| Alta disponibilidad | Resolución: LWW, Vector Clocks, CRDTs |

**Ejemplos**: CouchDB, Galera Cluster.

### 5.3 Peer-to-Peer (Cassandra)

> Sin master, todos los nodos son iguales. Cada nodo conoce el estado del cluster vía Gossip.

```
        N1 ─── N2
        │ ╲  ╱ │
        │  ╳  │
        │ ╱  ╲ │
        N4 ─── N3
```

| Ventajas | Limitaciones |
|---|---|
| Sin SPOF | Resolución de conflictos: Last-Write-Wins (LWW) por timestamp |
| Escala writes linealmente | |
| RF configurable | |

**Ejemplos**: Cassandra, DynamoDB, Riak.

---

## 6. Particionamiento (Sharding)

### Definición

> "Distribuir una colección entre múltiples nodos para escalar escrituras y storage. Cada nodo guarda un subconjunto."

### Estrategias de shard key

| Estrategia | Cuándo usarla | Cuándo evitarla |
|---|---|---|
| **Rango** (Range) | Consultas de rango eficientes | Hot spots si los datos no están distribuidos |
| **Hash** | Distribución uniforme garantizada | Queries de rango se vuelven scatter-gather |
| **Zone / Tag** | GDPR, geo-distribución | Configuración compleja |

### El problema del Hot Spot

> "Si la shard key es **monótona** (ej: timestamp), todos los writes nuevos van al mismo shard mientras los otros están ociosos. **Solución**: hash de la shard key o composite (`userId + timestamp`)."

### Regla de oro de la shard key

1. **Alta cardinalidad** — muchos valores distintos.
2. **Distribución uniforme de writes** — sin valor dominante.
3. **Evitar scatter-gather** — que las queries frecuentes hiteen una sola shard.

---

## 7. Consistencia — El espectro completo

```
← CONSISTENCIA FUERTE                     EVENTUAL CONSISTENCY →

Strong/Linearizable        Causal/Session          Eventual
(Spanner, ZK)              (MongoDB causal,        (Cassandra default,
                            DynamoDB sesión)        DynamoDB default,
                                                    DNS)
```

| Nivel | Garantía | Ejemplo motor |
|---|---|---|
| **Strong / Linearizable** | Toda lectura ve la escritura más reciente | MongoDB con `linearizable`, Spanner |
| **Sequential** | Operaciones ordenadas en cada nodo, sin clock global | ZooKeeper |
| **Causal / Sesión** | Read-your-writes en la misma sesión | MongoDB causal consistency, Neo4j bookmarks |
| **Eventual** | Convergen con el tiempo | Cassandra (default), DNS |

---

## 8. Performance — Latencias típicas que tenés que recordar

| Operación | Motor | Latencia típica |
|---|---|---|
| GET/SET clave en memoria | **Redis** | **< 1ms** |
| Lectura documento con índice (SSD) | **MongoDB** | **~5ms** |
| Escritura distribuida con replicación | **Cassandra** | **~10ms** |
| Traversal de 3 saltos en grafo local | **Neo4j** | **~15ms** |
| JOIN simple (2 tablas) | PostgreSQL | ~2ms |
| Traversal profundo (6 niveles) | Neo4j | ~5ms |
| Traversal profundo (6 niveles) | PostgreSQL | minutos / timeout |
| Aggregation simple | Mongo/SQL | parecidos |
| Inserción masiva (1M filas) | PostgreSQL ~8s vs Neo4j ~12s | PostgreSQL gana |

⭐ **Frase para defensa**:
> "El performance depende del caso de uso. Para lookups por clave: Redis es imbatible. Para queries con filtros ricos: MongoDB con índices. Para traversals profundos: Neo4j gana por órdenes de magnitud sobre SQL. Para escrituras masivas concurrentes: Cassandra."

---

## 9. Patrones de tolerancia a fallos

### Hinted Handoff (Cassandra, DynamoDB)

> "Si el nodo destino está caído, el coordinador almacena un 'hint' temporalmente. Cuando el nodo vuelve, recibe los writes pendientes. Tiene TTL — si el nodo no vuelve a tiempo, el hint se descarta y se necesita `nodetool repair`."

### Read Repair (Cassandra)

> "Durante una lectura con CL > ONE, el coordinador compara versiones entre réplicas. Si hay divergencia → repara síncronamente o en background. Garantiza convergencia eventual."

### Gossip Protocol (Cassandra)

> "Cada nodo elige 1-3 vecinos al azar cada segundo y comparte su estado. En O(log N) rounds, todo el cluster conoce el estado de todos. Sin SPOF en el plano de control."

### Bookmarks (Neo4j)

> "Garantizan read-your-writes en cluster. El cliente recibe un bookmark tras un write → lo pasa al siguiente read → la Read Replica espera catch-up hasta esa posición antes de responder."

### Failover Replica Set (MongoDB)

```
T+0s:  Primary cae
T+2s:  Secondaries detectan ausencia
T+10s: Elección (Raft-like) — Secondary con optime más reciente gana
T+12s: Nuevo Primary acepta escrituras
T+15s: Driver reconnects
```

---

## 10. Las 8 falacias de la computación distribuida

(Si las mencionás, el profe se entusiasma)

> Sun Microsystems, 1994. Diseñadores asumen estas cosas como verdaderas y siempre se equivocan:

1. La red es confiable.
2. La latencia es cero.
3. El ancho de banda es infinito.
4. La red es segura.
5. La topología no cambia.
6. Hay un administrador de red.
7. El costo de transporte es cero.
8. La red es homogénea.

> "Conocer estas falacias es la diferencia entre software distribuido **real** y software distribuido **optimista**."

---

## 11. Preguntas tipo defensa sobre CAP

### ⭐ Q1: "Tu sistema está distribuido en 3 datacenters. ¿Qué pasa si se cae la red entre dos de ellos?"

**Respuesta** (depende del motor):
> "En Cassandra (AP): cada DC sigue aceptando escrituras y lecturas. Cuando la red vuelve, las réplicas convergen vía gossip y read repair. Aceptamos una ventana de inconsistencia.
>
> En MongoDB (CP) con `w:majority`: si el Primary queda del lado minoritario, se elige un nuevo Primary del lado mayoritario y el minoritario rechaza escrituras hasta que se restaure la red.
>
> En Neo4j (CP) con Raft: igual que MongoDB, el lado sin quorum rechaza escrituras."

### ⭐ Q2: "¿Por qué decís que MongoDB es CP y Cassandra AP si los dos pueden configurarse?"

**Respuesta**:
> "MongoDB es CP **por default** con `w:majority`. Cassandra es AP **por arquitectura** — no hay coordinador central, todos los nodos son iguales. La consistencia en Cassandra se logra **por operación** con la fórmula W+R>N, pero el sistema base prioriza disponibilidad."

### ⭐ Q3: "Si quiero consistencia fuerte en Cassandra, ¿cómo la consigo?"

**Respuesta**:
> "Configurar `RF=3` y usar `CL=QUORUM` tanto en writes como reads. Con W+R = 2+2 = 4 > 3 → garantía de overlap → consistencia fuerte por operación. Trade-off: si un nodo cae, las queries con QUORUM siguen funcionando (necesitan 2 de 3). Si usás ALL, una falla rompe todo."

### Q4: "¿Cuándo aceptás eventual consistency?"

**Respuesta**:
> "Cuando una divergencia temporal no afecta el negocio. Ejemplos: contador de likes (un like que tarda 5s en aparecer no es crítico), feed social, métricas analíticas. **No** acepto eventual consistency en saldos bancarios, inventario crítico, tokens de seguridad."

### Q5: "¿Qué es el replication lag?"

**Respuesta**:
> "Es el delay entre que un write se confirma en el Primary y se propaga a las Secondaries. Si una read va a una Secondary que aún no recibió el write → el usuario ve datos viejos (read-your-writes violation). Mitigación: sticky sessions, readConcern majority, causal consistency (bookmarks)."

---

## 12. Tabla comparativa final — Replicación y Consistencia

| Aspecto | MongoDB | Neo4j | Cassandra |
|---|---|---|---|
| Modelo replicación | Master-Slave (RS) | Master-Slave (Core+RR) | Peer-to-Peer |
| Elección líder | Raft-like (~10s) | Raft | No hay líder (Gossip) |
| Consistencia W | `w: 0..majority` | Default Strong | `ANY..ALL` |
| Consistencia R | `local..linearizable` | Default Strong | `ONE..ALL` |
| Sharding | Shard key + mongos | Limitado | Consistent Hashing nativo |
| Cross-DC | Atlas Global Clusters | NetworkTopologyStrategy | NetworkTopologyStrategy |
| Conflictos write | No hay (1 Primary) | No hay (1 Leader Raft) | LWW por timestamp |
| Posición CAP | CP | CP | AP |
