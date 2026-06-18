# 01 — Conexión de los 3 Motores y Cómo Funciona la App

⭐⭐⭐ **Este archivo es el más importante.** El profe te va a pedir explicar **CÓMO funciona la conexión** entre los motores. Lo que viene es exactamente lo que tenés que poder explicar de memoria.

---

## 🧭 Mini-recordatorio: Teorema CAP (lo vas a leer mucho)

> Antes de empezar — en este documento aparecen mucho las siglas **CP** y **AP**. Es el **Teorema CAP** (Eric Brewer, 2000), que se aplica a sistemas distribuidos:
>
> - **C** (Consistency) → todos los nodos ven el mismo dato al mismo tiempo.
> - **A** (Availability) → el sistema siempre responde, aunque sea con dato viejo.
> - **P** (Partition Tolerance) → el sistema sigue funcionando aunque se corte la comunicación entre nodos.
>
> **La regla**: bajo partición de red, no podés tener C y A simultáneamente. Tenés que elegir.
>
> - **CP** = prioriza Consistency (Mongo con `w:majority`, Neo4j). Bajo partición → rechaza escrituras antes de devolver datos inconsistentes.
> - **AP** = prioriza Availability (Cassandra). Bajo partición → sigue aceptando escrituras, los datos convergen después.
>
> 👉 Para detalles completos, ver `06_CAP_Performance.md`.

---

## 1. Resumen ejecutivo (lo que decís primero)

> "Nuestro sistema es una **plataforma de streaming musical** que usa **3 motores NoSQL** en una arquitectura de **persistencia poliglota**. Cada motor cubre un caso de uso que los otros dos no podrían resolver eficientemente:
>
> - **MongoDB** → catálogo maestro (artistas, álbumes, canciones, playlists). Es la **fuente de verdad** del catálogo.
> - **Neo4j** → red de colaboraciones entre artistas y motor de recomendación por proximidad en el grafo.
> - **Cassandra** → eventos de reproducción masivos, métricas horarias y charts diarios.
>
> La app está hecha en **Node.js** y expone un **menú interactivo** que invoca 5 operaciones de negocio (OP-1 a OP-5). Cada operación coordina varios motores según el caso de uso."

---

## 2. ¿Por qué 3 motores y no uno solo?

⭐ **Esta es la pregunta teórica más probable. Memorizá la respuesta.**

| Naturaleza del dato | Motor elegido | Por qué no los otros |
|---|---|---|
| Datos maestros estructurados (catálogo) | **MongoDB** | Cassandra no soporta queries ad-hoc por campos arbitrarios; Neo4j está optimizado para traversals, no para almacenar documentos densos |
| Red de colaboraciones, recomendaciones | **Neo4j** | Mongo necesitaría múltiples `$lookup` recursivos (no escala en profundidad); Cassandra no soporta JOINs |
| 400M reproducciones/día, alta escritura | **Cassandra** | Mongo es CP → latencia en escrituras masivas concurrentes; Neo4j no está pensado para ingestión de eventos a esa velocidad |

**Tagline**: "Cassandra absorbe el volumen; MongoDB es la fuente de verdad; Neo4j navega relaciones."

---

## 3. Arquitectura de la app — Capas

```
┌─────────────────────────────────────────────────────────────┐
│  CAPA DE PRESENTACIÓN (CLI)                                 │
│  app/index.js — menú interactivo con readline               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  CAPA DE OPERACIONES DE NEGOCIO                             │
│  app/ops/op1_homepage.js                                    │
│  app/ops/op2_play_event.js                                  │
│  app/ops/op3_artist_page.js                                 │
│  app/ops/op4_chart.js                                       │
│  app/ops/op5_report.js                                      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  CAPA DE PERSISTENCIA (DRIVERS + HELPERS)                   │
│  app/db/cassandra.js   app/db/mongodb.js   app/db/neo4j.js  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  CAPA DE CONFIGURACIÓN                                      │
│  app/config.js — lee .env, instancia los 3 clientes         │
└─────────────────────────────────────────────────────────────┘
                          │
                ┌─────────┼──────────┐
                ▼         ▼          ▼
        ┌─────────┐ ┌─────────┐ ┌──────────┐
        │ MongoDB │ │ Neo4j   │ │ Cassandra│
        │ Atlas   │ │ AuraDB  │ │ Astra DB │
        └─────────┘ └─────────┘ └──────────┘
```

**Detalles que conviene mencionar**:
- Todas las credenciales vienen de `.env` (no están hardcodeadas).
- `app/config.js` valida que estén todas las variables, falla con mensaje claro si falta alguna.
- Cada motor tiene su propio driver oficial: `mongodb` v6, `neo4j-driver` v6, `cassandra-driver` v4.
- Las conexiones se establecen **una sola vez** al arrancar la app (no por request) — esto es **connection pooling**.

---

## 4. Las 5 Operaciones de Negocio

### 🎯 OP-1 — Homepage personalizada (3 motores)

**Caso de uso**: Cuando un usuario entra a la plataforma, ve su homepage.

**Flujo SECUENCIAL** (cada paso depende del anterior):

```
1. Cassandra → últimas 10 reproducciones del usuario
                + top 10 del chart del país hoy
        │
        ▼
2. Neo4j   → recibe artistas escuchados → busca artistas
              relacionados por colaboraciones (1 salto)
        │
        ▼
3. MongoDB → enriquece los candidatos con datos maestros
              (nombre, género, followers)
```

**Resultado**: 3 secciones de la homepage (seguís escuchando + trending país + recomendados).

**Por qué este orden**: Cada paso necesita la salida del anterior. No se puede paralelizar.

---

### 🎯 OP-2 — Registro de reproducción (3 motores escritos, pero Neo4j NO escribe)

**Caso de uso**: Un usuario reproduce una canción. El sistema registra el evento.

**Flujo**:

```
1. Cassandra (ESCRITURA PRINCIPAL) — escribe en 5 tablas:
   • reproducciones_usuario       (INSERT)
   • reproducciones_cancion       (INSERT)
   • historial_artista             (INSERT)
   • metricas_horarias             (UPDATE COUNTER +1)
   • chart_counters                (UPDATE COUNTER +1)

   Si esto falla → abortar.
        │
        ▼
2. MongoDB (ESCRITURA CONDICIONAL):
   Si la canción superó el umbral de 10 reproducciones en 24h
   → actualizar popularidad. Si no → no hacer nada.
   Si esto falla → no abortar (best-effort).

3. Neo4j → NO PARTICIPA en este flujo.
```

**Por qué Neo4j no escribe en OP-2**:
> "Neo4j modela **relaciones estructurales estables** entre artistas (colaboraciones). Un evento individual de reproducción no modifica esas relaciones. Si escribiéramos en Neo4j por cada uno de los 400M eventos diarios, saturaríamos el motor sin beneficio."

**Por qué MongoDB se actualiza con umbral y no por evento**:
> "MongoDB es la fuente de verdad del catálogo (poco volumen de escritura). Si actualizáramos popularidad por cada evento, generaríamos 400M escrituras/día sobre documentos — exactamente lo que Cassandra está hecho para evitar. Por eso usamos un **umbral** (`UMBRAL_POPULARIDAD = 10`) y solo actualizamos cuando vale la pena."

---

### 🎯 OP-3 — Perfil de artista (2 motores, en paralelo)

**Caso de uso**: Ver la página de un artista con su discografía y red de colaboraciones.

**Flujo PARALELO** (independientes):

```
        ┌─→ MongoDB → perfil + discografía completa
        │
fork ───┤
        │
        └─→ Neo4j   → colaboradores directos + grado de
                       centralidad en la red
```

Cuando ambas terminan → la app ensambla un único objeto.

**Por qué Cassandra NO participa**:
> "Calcular estadísticas de reproducciones del artista en tiempo real desde `historial_artista` para una vista de perfil sería costoso — habría que leer y agregar miles de filas por cada carga. Esas métricas se calculan en el reporte mensual OP-5 donde el costo está justificado."

---

### 🎯 OP-4 — Chart diario por país (2 motores, secuencial)

**Caso de uso**: Ver el top 50 de canciones de un país en una fecha.

**Flujo**:

```
1. Cassandra → leer chart_counters por (pais, fecha)
                → ordenar en app por reproducciones DESC
                → tomar top 50
        │
        ▼
2. MongoDB  → enriquecer cada cancion_id con datos maestros
              (nombre, artista, género, duración, popularidad)
```

**Por qué Cassandra primero**: Mongo necesita saber qué canciones están en el ranking antes de buscarlas. Es una dependencia obligatoria.

**Detalle técnico clave (chart_counters vs charts_diarios)**:
- `charts_diarios` → snapshot pre-calculado, partition key `(pais, fecha)`, **clustering key `reproducciones DESC`** → ordenamiento nativo.
- `chart_counters` → tabla COUNTER, se incrementa en tiempo real en OP-2.
- Las **tablas COUNTER no pueden mezclarse con columnas regulares** en Cassandra → por eso hay 2 tablas separadas.

---

### 🎯 OP-5 — Reporte mensual de artista (3 motores, en paralelo)

**Caso de uso**: Generar el reporte mensual de un artista para su sello discográfico.

**Flujo PARALELO** (las 3 consultas son independientes):

```
        ┌─→ Cassandra → historial_artista del mes → calcular
        │                en app: total repros, tasa skip,
        │                revenue ($0.004 × completadas)
        │
fork ───┼─→ MongoDB   → discografía del artista
        │
        └─→ Neo4j     → colaboradores directos + centralidad
```

Una vez que las 3 terminan → reporte con 4 secciones (resumen, métricas por canción, discografía, red).

**Por qué paralelo**: A diferencia de OP-1 donde el orden es obligatorio, acá las 3 consultas son independientes. Paralelizando, el tiempo total = el de la consulta más lenta, no la suma.

---

## 5. Resumen de motores por operación

| Op | MongoDB | Neo4j | Cassandra | Orden |
|---|---|---|---|---|
| OP-1 | ✓ (enriquecer) | ✓ (recomendar) | ✓ (historial+chart) | Secuencial: C→N→M |
| OP-2 | ✓ (escritura condicional) | ✗ | ✓ (5 tablas) | C primero, M after |
| OP-3 | ✓ (perfil+discografía) | ✓ (red+centralidad) | ✗ | Paralelo M ‖ N |
| OP-4 | ✓ (datos maestros) | ✗ | ✓ (chart_counters) | Secuencial: C→M |
| OP-5 | ✓ (discografía) | ✓ (red+centralidad) | ✓ (historial mes) | Paralelo C ‖ M ‖ N |

---

## 6. Coherencia entre motores

⭐⭐ **Pregunta muy probable: "¿Qué pasa si falla una escritura en un motor pero no en el otro?"**

### Garantías que ofrece el sistema

- **Cassandra**: consistencia eventual dentro de su clúster (RF=3, las escrituras eventualmente convergen entre réplicas).
- **MongoDB**: consistencia en operaciones individuales sobre un documento.
- **Neo4j**: ACID dentro de su propio motor.

### Lo que NO garantiza el sistema

- **No hay atomicidad entre motores**. No existe un "rollback distribuido" entre MongoDB, Neo4j y Cassandra.

### Estrategia adoptada

1. **Orden por criticidad**: en OP-2, primero Cassandra (el evento es el dato más crítico e irrecuperable), después MongoDB (best-effort).
2. **Escrituras condicionales**: MongoDB solo se actualiza si la canción superó umbral → reduce drásticamente la superficie de inconsistencia.
3. **Neo4j fuera del flujo de escritura**: no participa en OP-2, por lo que no hay riesgo de inconsistencia en la operación más frecuente.
4. **Mensajes de error descriptivos**: si falla un motor, la app devuelve un objeto con `status: 'ok'` para los que funcionaron y `errors: [...]` para los que fallaron — el cliente decide qué hacer.

### Frase para defensa

> "El sistema acepta **consistencia eventual entre motores** como trade-off consciente a cambio de disponibilidad y rendimiento. Para el dominio de streaming, una divergencia temporal entre Cassandra y MongoDB no afecta la experiencia del usuario."

---

## 7. Errores parciales — patrón concreto en OP-2

```javascript
const resultado = { cassandra: null, mongodb: null, errors: [] };

// Cassandra obligatoria
try {
  await cass.registrarReproduccion({...});
  resultado.cassandra = { status: 'ok', timestamp };
} catch (err) {
  resultado.errors.push({ motor: 'cassandra', message: err.message });
  // si falla, NO se intenta Mongo
}

// MongoDB best-effort
try {
  const repros24h = await cass.totalReproduccionesCancion24h(cancion_id);
  if (repros24h >= UMBRAL_POPULARIDAD) {
    await mongo.updatePopularidadCancion(song_title, 1);
    resultado.mongodb = { status: 'ok', actualizado: true };
  } else {
    resultado.mongodb = { status: 'ok', actualizado: false };
  }
} catch (err) {
  // No se aborta: el evento ya está en Cassandra
  resultado.errors.push({ motor: 'mongodb', message: err.message });
}

return resultado;
```

---

## 8. ¿Por qué Node.js? ¿Por qué menú interactivo?

⭐ **El PDF de la consigna pide justificar la modalidad de interfaz elegida.**

**Por qué Node.js**:
- Drivers oficiales para los 3 motores.
- I/O asíncrono nativo → ideal para paralelizar consultas multi-motor (Promise.all).
- Mismo lenguaje en toda la stack.

**Por qué menú interactivo (y no REST API o CLI con argumentos)**:
1. **Demostración pedagógica**: en un contexto académico, un menú numerado permite invocar cualquiera de las 5 operaciones sin conocer sintaxis de comandos.
2. **Sin servidor HTTP permanente**: ejecutar `node app/index.js` y listo, no hay que levantar un servidor.
3. **Inspección directa**: se ve el flujo de los 3 motores en una única sesión de consola, perfecto para la defensa oral.

---

## 9. Posibles preguntas trampa

### 🎯 "¿Por qué no usaron solo MongoDB con sharding?"

> "Sharding en MongoDB permite distribuir, pero MongoDB es CP — prioriza consistencia sobre disponibilidad ante particiones. Para 400M escrituras/día sostenidas necesitamos AP. Además, MongoDB no escala a la velocidad de escritura de Cassandra porque tiene que coordinar entre shards. Cassandra peer-to-peer no tiene coordinador."

### 🎯 "¿Por qué Neo4j y no MongoDB con $lookup recursivo?"

> "El `$lookup` en MongoDB hace JOIN entre colecciones, pero no soporta recursión nativa. Para 'amigos de amigos de amigos' (3 saltos), habría que hacer múltiples `$lookup` encadenados — la performance degrada exponencialmente con la profundidad. Neo4j usa **index-free adjacency**: cada nodo tiene puntero directo a sus relaciones, traversal O(1) por salto independientemente del tamaño total del grafo."

### 🎯 "¿Qué pasa si Cassandra cae?"

> "El sistema deja de aceptar reproducciones nuevas (OP-2 falla). OP-4 y OP-5 también fallan porque dependen de Cassandra. OP-1 falla porque empieza por Cassandra. Solo OP-3 sigue funcionando porque usa MongoDB + Neo4j. En producción real configuraríamos RF=3 con 3 datacenters para tolerar la caída de un DC entero."

### 🎯 "¿Por qué Cassandra tiene 5 tablas para reproducciones?"

> "Por **query-first design**: cada tabla resuelve una pregunta específica. Cassandra no soporta JOINs ni queries ad-hoc, entonces si tengo 5 preguntas distintas tengo 5 tablas. Es desnormalización consciente: duplicar el dato es aceptable, lo que se prioriza es la latencia de lectura O(1) por partición."

| Pregunta | Tabla |
|---|---|
| ¿Qué escuchó este usuario? | `reproducciones_usuario` (PK: `usuario_id`) |
| ¿Quién escuchó esta canción? | `reproducciones_cancion` (PK: `cancion_id`) |
| ¿Qué se escuchó de este artista en X mes? | `historial_artista` (PK: `(artista_id, anio_mes)`) |
| Curva horaria de una canción | `metricas_horarias` (PK: `(cancion_id, fecha)`, COUNTER) |
| Top live por país | `chart_counters` (PK: `(pais, fecha)`, COUNTER) |

---

## 10. Frases de cierre que suenan bien

- "El sistema **no** intenta reemplazar SQL — lo extiende: cada motor resuelve un caso donde un RDBMS solo no podría sin diseño extra."
- "La complejidad arquitectural que introducimos (3 conexiones, 3 esquemas) está **justificada** por la naturaleza heterogénea del dominio."
- "Si el TP fuera solo 'guardar canciones', con Mongo bastaba. Con 400M eventos/día + recomendaciones + catálogo, ya **no alcanza**."
