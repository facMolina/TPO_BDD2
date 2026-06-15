# 10 — Plan Semanal de Estudio (16/06 → 22/06)

**Defensa: Lunes 22/06/2026**
**6 días útiles de estudio** (martes a domingo).

---

## Filosofía del plan

- **Repetición espaciada**: cada tema se revisa más de una vez.
- **Estudio activo > pasivo**: leer no alcanza, hay que practicar queries y responder en voz alta.
- **Cassandra recibe el día más fuerte**: es el motor con más probabilidad de práctica (el ejemplo del compañero fue en CQL).
- **El último día es solo repaso**, no estudio nuevo. Bajar la ansiedad.
- **Carga decreciente**: arranco fuerte y voy bajando para llegar descansado al lunes.

---

## 📅 Calendario

| Día | Foco principal | Carga |
|---|---|---|
| **Mar 16/06** | 01 Conexión 3 motores + app funcionando | 🔵🔵🔵 Alta (3-4h) |
| **Mié 17/06** | 02 MongoDB + práctica mongosh | 🔵🔵 Media (2-3h) |
| **Jue 18/06** | 03 Neo4j + práctica Cypher | 🔵🔵 Media (2-3h) |
| **Vie 19/06** | 04 Cassandra + práctica CQL | 🔵🔵🔵 Alta (3-4h) |
| **Sáb 20/06** | 06 CAP + 07 Comparativa motores | 🔵🔵 Media (2-3h) |
| **Dom 21/06** | 05 Redis + 08 Teoría + 09 Cheat sheet + simulacro | 🔵🔵 Media (2h) |
| **Lun 22/06** | Solo cheat sheet antes de entrar | 🔵 Baja (30min) |

---

## 📌 Día 1 — Martes 16/06 · "Cómo funciona el TP"

### Objetivo del día
Saber explicar **de memoria** cómo funcionan los 3 motores juntos y el flujo de cada una de las 5 operaciones.

### Material a leer
- ✅ `00_INDICE.md` (5 min)
- ✅ `01_Conexion_3_motores.md` (45-60 min) — leerlo **dos veces**

### Práctica obligatoria
1. **Levantar la app y correr las 5 ops**:
   ```bash
   cd C:/Users/PC/Desktop/TPO_BDD2
   node app/index.js
   ```
   - Asegurarse de que Neo4j AuraDB esté **RUNNING** ([console.neo4j.io](https://console.neo4j.io))
   - Probar OP-1 con `User_1` / país `AR`
   - Probar OP-2 con un registro nuevo
   - Probar OP-3 con un artista (ej: `The Weeknd`)
   - Probar OP-4 con `AR` / fecha de hoy
   - Probar OP-5 con un artista y mes

2. **Mirar el código de cada `op.js`** (15 min cada uno) — entender qué hace cada función y por qué.

3. **Dibujar en papel** el flujo de OP-1, OP-2 y OP-5 (los más complejos).

### Mini simulacro al final del día (10 min)

Imaginá que el profe te pregunta:
- "¿Cómo funciona OP-2?"
- "¿Por qué Neo4j no participa en OP-2?"
- "¿Qué pasa si Cassandra falla en el medio de OP-1?"

**Responder en voz alta**. Si te trabás → volvé a leer la sección correspondiente del archivo 01.

### ✅ Checkpoint del día
- [ ] Puedo explicar las 5 operaciones sin mirar el archivo.
- [ ] La app me funciona localmente (los 3 motores conectan).
- [ ] Memoricé el diagrama de capas (config → ops → db → motores).

---

## 📌 Día 2 — Miércoles 17/06 · "MongoDB"

### Objetivo del día
Saber responder cualquier pregunta sobre MongoDB y escribir queries básicas de memoria.

### Material a leer
- ✅ `02_MongoDB.md` completo (45 min)

### Práctica obligatoria
1. **Abrir mongosh o MongoDB Compass conectado a Atlas**.

2. **Escribir estas queries SIN copiar** (15-20 min):
   ```javascript
   // Crear colección y insertar
   use practica
   db.productos.insertOne({nombre:"Laptop", precio:1200, stock:50})
   db.productos.insertMany([{nombre:"Mouse",precio:25},{nombre:"Teclado",precio:45}])

   // Buscar
   db.productos.find({precio: {$gt: 100}})
   db.productos.find({stock: {$gt:0}, precio: {$lt:200}})

   // Update
   db.productos.updateOne({nombre:"Laptop"}, {$set:{precio:1100}, $inc:{stock:-1}})

   // Pipeline básico
   db.plays.aggregate([
     { $match: { user_id: "User_1" } },
     { $group: { _id: "$song_id", total: { $sum: 1 } } },
     { $sort: { total: -1 } },
     { $limit: 10 }
   ])

   // Índice + explain
   db.productos.createIndex({nombre: 1})
   db.productos.find({nombre:"Laptop"}).explain("executionStats")  // verificar IXSCAN
   ```

3. **Recorrer las 12 preguntas del Q&A en voz alta**. Anotar cuáles te cuestan.

### Mini simulacro (10 min)

Respondé en voz alta:
- "¿Por qué MongoDB para el catálogo y no Cassandra?"
- "¿MongoDB es CP o AP?"
- "¿Qué es el aggregation pipeline?"
- "¿Qué hace tu query 4b corregida?"

### ✅ Checkpoint del día
- [ ] Puedo escribir un pipeline con `$match`, `$group`, `$sort`, `$limit` sin mirar.
- [ ] Memoricé los operadores principales (`$eq`, `$gt`, `$in`, `$and`, `$set`, `$inc`, `$push`).
- [ ] Sé explicar embedding vs referencing con un ejemplo.

---

## 📌 Día 3 — Jueves 18/06 · "Neo4j"

### Objetivo del día
Dominar Cypher básico + medio + saber explicar index-free adjacency.

### Material a leer
- ✅ `03_Neo4j.md` completo (45 min)

### Práctica obligatoria
1. **Abrir Neo4j Browser** ([browser.neo4j.io](https://browser.neo4j.io)) conectado a AuraDB del grupo.

2. **Practicar estas queries SIN copiar** (20 min):
   ```cypher
   // Crear nodos y relaciones
   CREATE (ana:Person {name:'Ana', edad:28})
   CREATE (luis:Person {name:'Luis', edad:35})
   MATCH (a:Person {name:'Ana'}), (b:Person {name:'Luis'})
   CREATE (a)-[:CONOCE {desde:2020}]->(b)

   // Buscar
   MATCH (p:Person) WHERE p.edad > 25 RETURN p
   MATCH (p:Person) WHERE p.name STARTS WITH 'A' RETURN p

   // Traversal
   MATCH (a:Person {name:'Ana'})-[:CONOCE]->(otro) RETURN otro.name

   // Agregación con WITH
   MATCH (p:Person)-[:CONOCE]->(o)
   WITH p, count(o) AS amigos
   WHERE amigos > 1
   RETURN p.name, amigos

   // Shortest path
   MATCH p = shortestPath((a:Person {name:'Ana'})-[:CONOCE*]-(b:Person {name:'X'}))
   RETURN p, length(p)

   // MERGE
   MERGE (c:Cliente {id: 5}) ON CREATE SET c.creado = datetime() RETURN c

   // DETACH DELETE
   MATCH (p:Person {name:'Ana'}) DETACH DELETE p
   ```

3. **Correr las 5 queries del Req 7** del TP (`queries_neo4j.cypher`) en Neo4j Browser. Verificá los resultados.

4. **Recorrer Q&A en voz alta**. Anotar las que cuesta.

### Mini simulacro (10 min)

Respondé en voz alta:
- "¿Qué es index-free adjacency?"
- "¿Por qué Neo4j y no MongoDB para colaboraciones?"
- "¿Neo4j es CP o AP?"
- "¿Qué hace tu query 7e corregida?"

### ✅ Checkpoint del día
- [ ] Puedo escribir un MATCH + WHERE + traversal de memoria.
- [ ] Sé explicar la diferencia entre `DELETE` y `DETACH DELETE`.
- [ ] Memoricé qué hace `MERGE` y cuándo usarlo en vez de `CREATE`.

---

## 📌 Día 4 — Viernes 19/06 · "Cassandra" ⭐⭐⭐

### Objetivo del día
**Dominar Cassandra**. Es el motor con más probabilidad de práctica en la defensa.

### Material a leer
- ✅ `04_Cassandra.md` **completo y dos veces** (60-90 min)

### Práctica obligatoria
1. **Abrir Astra CQL Console** o `cqlsh` localmente.

2. **El ejemplo del compañero — practicar EXACTAMENTE esto** (15 min):
   ```cql
   CREATE TABLE eventos (
     organismo_id  TEXT,
     evento_ts     TIMESTAMP,
     estado        TEXT,
     payload       TEXT,
     PRIMARY KEY ((organismo_id), evento_ts)
   ) WITH CLUSTERING ORDER BY (evento_ts DESC);

   INSERT INTO eventos (organismo_id, evento_ts, estado)
   VALUES ('municipio_001', toTimestamp(now()), 'activo');

   SELECT * FROM eventos WHERE organismo_id = 'municipio_001';
   ```

3. **Practicar variantes** (20 min):
   - INSERT con TTL
   - SELECT con rango de clustering
   - UPDATE COUNTER
   - LWT (`IF NOT EXISTS`)
   - DDL: CREATE / ALTER / DROP
   - Tabla con colecciones (SET, LIST, MAP)

4. **Correr las 11 queries del Req 3** (`queries_cassandra.cql`) en Astra.

5. **Recorrer Q&A** — son 14 preguntas, prestá especial atención a:
   - Partition key vs clustering key
   - Hot partition
   - ALLOW FILTERING
   - Tunable consistency (W+R>N)
   - COUNTER columns

### Mini simulacro (15 min)

⭐ Simulá EXACTAMENTE el ejemplo del profe:
> *"Insertá un registro en `eventos` con partition key `municipio_001`, timestamp ahora, campo `estado` con valor `activo`. Después consultá todos los registros de la partición `municipio_001`. Usá partition key `organismo_id` y clustering key `evento_ts`."*

Escribilo de memoria en cqlsh **sin mirar el archivo**. Si te trabás → leelo y volvé a intentar mañana.

Otras preguntas:
- "¿Cassandra es CP o AP? ¿Cómo lograrías consistencia fuerte?"
- "¿Qué es la partition key?"
- "¿Por qué query-first design?"
- "¿Qué pasa con un partition key monótona?"

### ✅ Checkpoint del día
- [ ] Puedo escribir CREATE TABLE + INSERT + SELECT de memoria con composite PK.
- [ ] Memoricé la fórmula W+R>N y los niveles de consistencia.
- [ ] Sé explicar hot partition y cómo prevenirlo (bucket pattern).
- [ ] Sé por qué `chart_counters` es tabla separada de `charts_diarios` en el TP.

---

## 📌 Día 5 — Sábado 20/06 · "CAP + Comparativa de motores"

### Objetivo del día
Tener clarísimo el CAP de cada motor y por qué se eligió cada uno para cada parte del TP.

### Material a leer
- ✅ `06_CAP_Performance.md` (45 min)
- ✅ `07_Comparativa_motores.md` (30 min)

### Práctica obligatoria
1. **Hacer un cuadro propio** en una hoja con:
   - CAP de cada motor
   - Latencia típica
   - Caso ideal vs anti-pattern

2. **Responder en voz alta las 5 preguntas teóricas más probables** del cheat sheet:
   - ¿Por qué Cassandra y no MongoDB para los eventos?
   - ¿Por qué MongoDB para el catálogo y no Cassandra?
   - ¿Por qué Neo4j para las colaboraciones?
   - ¿Por qué Neo4j NO participa en OP-2?
   - ¿Qué pasa si falla un motor?

3. **Memorizar la fórmula** `W + R > N` y todos los niveles de consistencia.

4. **Practicar la tabla maestra de comparación** — escribirla de memoria 2 veces.

### Mini simulacro (15 min)

Simulá una conversación con el profe:
- "Decime el CAP de los 3 motores."
- "¿Qué pasa con Cassandra si se cae un datacenter?"
- "¿Cuál es la diferencia entre w:1 y w:majority en MongoDB?"
- "Si quisieras consistencia fuerte en Cassandra con RF=3, ¿qué CL usarías?"

### ✅ Checkpoint del día
- [ ] Sé recitar la fórmula `W+R>N` y dar 2 ejemplos correctos.
- [ ] Memoricé el CAP de los 3 motores y por qué.
- [ ] Puedo justificar la elección de cada motor para cada parte del TP.

---

## 📌 Día 6 — Domingo 21/06 · "Repaso integral + simulacro final"

### Objetivo del día
**Consolidar todo**. No leer material nuevo en profundidad — solo repasar lo más conceptual.

### Material a leer
- ✅ `05_Redis_corto.md` (20 min) — por si pregunta comparativas
- ✅ `08_Teoria_general.md` (30 min) — ACID/BASE, polyglot, Saga
- ✅ `09_Cheat_sheet_final.md` **completo** (30 min) — leerlo entero

### Práctica obligatoria
1. **Probar la app por última vez** — confirmar que los 3 motores conectan y las 5 ops funcionan.

2. **Reactivar Neo4j AuraDB** si está pausada — ¡muy importante para mañana!

3. **Cargar credenciales en un lugar accesible** (.env, password manager).

4. **Repasar errores conceptuales** del cheat sheet — las cosas que NO querés decir.

### Simulacro completo (30 min)

⭐ **Sentate con alguien (o frente a un espejo)** y respondé en voz alta esta secuencia tipo defensa:

**Parte práctica:**
1. "Explicame cómo funciona tu app y la conexión de los 3 motores."
2. "Mostrame OP-2 en código y explicame el flujo."
3. "Escribime una query Cassandra que registre un evento e inserte un registro nuevo."
4. "Mostrame una query MongoDB que cuente las reproducciones del último día agrupadas por canción."

**Parte teórica:**
5. "¿Por qué MongoDB es mejor que Cassandra para esta parte de tu modelo?"
6. "¿Por qué necesitan que Cassandra sea AP y no CP?"
7. "¿Cómo gestionan la coherencia entre los 3 motores ante fallos?"

Si te trabás en alguna → volvé al archivo correspondiente, releé esa sección.

### ✅ Checkpoint del día
- [ ] Hice el simulacro completo en voz alta.
- [ ] Neo4j AuraDB está RUNNING para mañana.
- [ ] Tengo el cheat sheet impreso o en el celular.
- [ ] La app me funciona localmente y la probé hoy mismo.

### ⚠️ Antes de dormir

- **No estudies hasta tarde.** Descansar > saturarse.
- **Preparate la mochila**: laptop, cargador, cheat sheet, agua.
- **Confirmá la hora y lugar de la defensa**.

---

## 📌 Día D — Lunes 22/06 · DEFENSA

### Antes de salir de tu casa (30 min)

1. **Levantate descansado.** Desayuná bien.
2. **Verificá que Neo4j esté RUNNING** (lo más importante — se pausa por inactividad).
3. **Levantá la app una vez** y corré OP-1 con `User_1` — para confirmar que todo funciona.
4. **Leé el cheat sheet 09 una sola vez** — no necesitás más.

### En el lugar de la defensa

- Llegá **15 min antes**.
- **Respirá**. Tomate 30 segundos antes de responder cada pregunta.
- Si no sabés algo: **"En el TP no lo abordamos así, pero supongo que..."** y razoná en voz alta.
- **Mostrá criterio**, no solo conocimiento. Por qué tomaron las decisiones.

### Frases que te van a salvar

- "Aceptamos consistencia eventual entre motores como **trade-off consciente**..."
- "Cada motor está donde **estructuralmente brilla**..."
- "La complejidad de 3 motores es real, pero el **dominio la justifica**..."
- "No hay un motor universalmente superior — hay motores **adecuados para cada caso de uso**..."

---

## 🎯 Resumen del plan en una imagen mental

```
       ┌──── MAR 16 ─────┐  Conexión 3 motores + app
       │                 │
       ├──── MIÉ 17 ─────┤  MongoDB
       │                 │
       ├──── JUE 18 ─────┤  Neo4j
       │                 │
       ├──── VIE 19 ─────┤  Cassandra ⭐ (día más fuerte)
       │                 │
       ├──── SÁB 20 ─────┤  CAP + Comparativa
       │                 │
       ├──── DOM 21 ─────┤  Repaso + Cheat sheet + Simulacro
       │                 │
       └──── LUN 22 ─────┘  DEFENSA 🚀
```

---

## 💡 Consejos generales

1. **Estudiá en bloques de 25-30 min con descansos de 5 min** (técnica Pomodoro).
2. **Repaso espaciado**: cada tema se ve al menos 2 veces (el día principal + el domingo).
3. **Voz alta > leer en silencio**: explicar es la mejor forma de aprender.
4. **Si no entendés algo, marcalo y volvé al día siguiente**, no te trabes.
5. **Compartí el material con tus compañeros** — explicar a otro fija el conocimiento.
6. **El día antes, descansá**. No es momento de meter material nuevo.

---

## 📞 Si te olvidás de todo lo demás

> **Memoriá esto**:
>
> 1. **CAP: Mongo CP, Neo4j CP, Cassandra AP.**
> 2. **Cassandra: peer-to-peer, query-first, partition key + clustering key.**
> 3. **MongoDB: documento, schema-flexible, queries ad-hoc, `$lookup`.**
> 4. **Neo4j: index-free adjacency, traversal O(1) por salto, Cypher.**
> 5. **Polyglot: cada motor donde estructuralmente brilla. Aceptamos eventual consistency entre motores.**
>
> Con eso solo, ya respondés el 70% de las preguntas.
