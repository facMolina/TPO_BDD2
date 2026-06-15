C L A S E 2
Modelos de Bases
de Datos NoSQL
Contexto histórico · Características · Taxonomía · Modelos fundamentales
Ing. Damián Arnaudo · 1er Cuatrimestre 2026 · Facultad de Ingeniería y Ciencias Exactas — UADE

UADE Ingeniería de Datos II Clase 2
Agenda de la clase
El contexto histórico
01
Dominio del modelo relacional · El quiebre de 2005 · Línea temporal
Big Data — el fenómeno
02
Definición · Crecimiento exponencial DataReportal 2026 · 7 V's · Impulsores
Características de NoSQL
03
Consistencia eventual · Tipos de consistencia · Sin esquema · Velocidad · Distribución · Escalabilidad
Teorema CAP y ACID/BASE
04
Consistencia vs Disponibilidad vs Tolerancia · Modelos de consistencia
Taxonomía NoSQL
05
Documental · Grafos · Clave/Valor · Tabular · Objetos · Multidimensional
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

Contexto Histórico
El modelo relacional · El quiebre de 2005 · Big Data · El surgimiento de NoSQL
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

| UADE | Ingeniería de Datos II |     |     |     |     | Contexto histórico |
| ---- | ---------------------- | --- | --- | --- | --- | ------------------ |
De las bases relacionales a NoSQL
| 1970 |     | 1995 |     | 2007 |     | 2010+ |
| ---- | --- | ---- | --- | ---- | --- | ----- |
Codd propone el modelo  La Web explota: datos no  Amazon presenta Dynamo  MongoDB, Cassandra,
relacional estructurados (clave/valor) Neo4j: ecosistema maduro
|     | 1979 |     | 2004 |     | 2009 |     |
| --- | ---- | --- | ---- | --- | ---- | --- |
Oracle lanza el primer  Google publica Bigtable &  Eric Evans acuña 'NoSQL'
|     | RDBMS comercial |     | MapReduce |     | en su forma actual |     |
| --- | --------------- | --- | --------- | --- | ------------------ | --- |
Ingeniería de Datos II  ·  Facultad de Ingeniería y Ciencias Exactas  ·  UADE  ·  Ing. Damián Arnaudo

| UADE | Ingeniería de Datos II |     |     | El quiebre |
| ---- | ---------------------- | --- | --- | ---------- |
A mediados de la década de 2000...
...la base de datos relacional
parecía completamente arraigada.
Pero a partir de 2005, la era de la supremacía total de las bases de datos relacionales
estaba a punto de llegar a su fin.
|     | Google          | Amazon        | Facebook         |     |
| --- | --------------- | ------------- | ---------------- | --- |
|     | Bigtable — 2004 | Dynamo — 2007 | Cassandra — 2008 |     |
Ingeniería de Datos II  ·  Facultad de Ingeniería y Ciencias Exactas  ·  UADE  ·  Ing. Damián Arnaudo

Big Data
El fenómeno que cambió todo — y que hizo necesario a NoSQL
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

💬 Pregunta disparadora
¿Cuántos datos creen que genera una persona
promedio en un solo día en 2025?
Mensajes, fotos, ubicación, compras, streaming, búsquedas, sensores de dispositivos…
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo Debate

| UADE | Ingeniería de Datos II |     |     | Contexto histórico |
| ---- | ---------------------- | --- | --- | ------------------ |
La era de la información
Estos son los números del mundo digital hoy — fuente: DataReportal Digital 2026 (oct. 2025)
| 8.250 M |             | 6.040 M     | 5.660 M          | 5.780 M         |
| ------- | ----------- | ----------- | ---------------- | --------------- |
|         | personas en | usuarios de | usuarios activos | usuarios únicos |
el planeta Internet (73,2%) en redes sociales de telefonía móvil
294 millones de nuevos usuarios de Internet se sumaron en el último año (+5,1%)  ·  Un nuevo usuario cada 1,8 segundos
Fuente: DataReportal — Digital 2026 Global Overview Report (octubre 2025)
Ingeniería de Datos II  ·  Facultad de Ingeniería y Ciencias Exactas  ·  UADE  ·  Ing. Damián Arnaudo

| UADE | Ingeniería de Datos II |     |     | Big Data |
| ---- | ---------------------- | --- | --- | -------- |
El crecimiento de los datos se disparó
La era de Internet no solo conectó personas — multiplicó exponencialmente los datos generados cada segundo.
| 📦  Volumen global |     | ⚡  Velocidad de adopción | 📱  Escala social |     |
| ----------------- | --- | ------------------------ | ---------------- | --- |
| 328 M             |     | 6.040 M                  | 5.660 M          |     |
TB creados por día en 2025 usuarios de Internet — 73,2% de la población usuarios activos en redes sociales
| 175 ZB |     | +294 M | +259 M |     |
| ------ | --- | ------ | ------ | --- |
proyección datos globales acumulados 2025 nuevos usuarios en el último año nuevas identidades en redes en 12 meses
| ×5  |     | 6 hs 38' | +1.000 M |     |
| --- | --- | -------- | -------- | --- |
crecimiento del tráfico IP 2015→2025 tiempo online diario promedio por usuario personas usando IA mensualmente en 2025
Fuente: DataReportal — Digital 2026 Global Overview Report (Kepios / GSMA Intelligence / GWI, octubre 2025)
Ingeniería de Datos II  ·  Facultad de Ingeniería y Ciencias Exactas  ·  UADE  ·  Ing. Damián Arnaudo

| UADE | Ingeniería de Datos II |     |     | Big Data |
| ---- | ---------------------- | --- | --- | -------- |
¿Qué pasa en un solo minuto en Internet? (2025)
Cada 60 segundos, el volumen de actividad digital equivale a lo que antes tomaba días o semanas.
|     | 231 M | 5,7 M | 69 M |     |
| --- | ----- | ----- | ---- | --- |
| 📧   |       | 🔍     | 💬    |     |
mensajes en WhatsApp
|     | emails enviados | búsquedas en Google |     |     |
| --- | --------------- | ------------------- | --- | --- |
& Messenger
|     | 700 K hs          | 500 hs            | $ 1 M        |     |
| --- | ----------------- | ----------------- | ------------ | --- |
| ▶   |                   | 📱                 | 🛒            |     |
|     | horas de video    | de video          | gastados en  |     |
|     | vistas en YouTube | subidas a YouTube | e-commerce   |     |
|     | +1.000 M          | 9,3 PB            | 66 K         |     |
| 🤖   |                   | 📊                 | 📸            |     |
|     | personas usan IA  | de tráfico IP     | fotos/videos |     |
|     | cada mes (2025)   | consumidos        | en Instagram |     |
Fuentes: DataReportal 2026 · Domo Data Never Sleeps · go-globe.com · IBISWorld 2025
Ingeniería de Datos II  ·  Facultad de Ingeniería y Ciencias Exactas  ·  UADE  ·  Ing. Damián Arnaudo

UADE Ingeniería de Datos II Big Data
El dato se volvió el activo más valioso del siglo XXI
“
Information is the oil of the 21st century, and analytics is the combustion engine.
— Peter Sondergaard, Gartner Research , 2011
“
Data creation is exploding. With all the selfies and useless files people refuse to delete… The world's
data storage capacity will be overtaken. Data shortages, data rationing, data black markets… data-
geddon!
— Gavin Belson, HBO Silicon Valley, 2015 · [y sin embargo, tenía razón en algo]
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

| UADE | Ingeniería de Datos II | Big Data |
| ---- | ---------------------- | -------- |
¿Qué es Big Data?
Conjuntos de datos cuyo volumen, velocidad de generación y variedad superan la capacidad de las herramientas
tradicionales de gestión de bases de datos para capturar, almacenar, gestionar y analizar.
| 2001 | Doug Laney (Gartner) acuña las 3 V's originales: Volumen, Velocidad, Variedad |     |
| ---- | ----------------------------------------------------------------------------- | --- |
2005 O'Reilly Media populariza el término — explota la Web 2.0 y el contenido generado por usuarios
2011 McKinsey: "Big Data es la próxima frontera para la innovación, la competencia y la productividad"
| 2012+ | Se amplía a 7 V's. El término entra al léxico empresarial y académico global |     |
| ----- | ---------------------------------------------------------------------------- | --- |
Ingeniería de Datos II  ·  Facultad de Ingeniería y Ciencias Exactas  ·  UADE  ·  Ing. Damián Arnaudo

UADE Ingeniería de Datos II Big Data
Las 7 V's del Big Data
Volumen Valor
V V
Petabytes de datos generados por segundo Extraer conocimiento útil del ruido
Velocidad Visualización
V V
Generación y procesamiento en tiempo real Representar datos para tomar decisiones
Variedad Variabilidad
V V
Estructurados, semi y no estructurados Flujos de datos inconsistentes en el tiempo
Veracidad
V
Calidad e incertidumbre de los datos
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

| UADE | Ingeniería de Datos II |     |     | Contexto |
| ---- | ---------------------- | --- | --- | -------- |
Impulsores del NoSQL
No fue una moda. Fue una respuesta a necesidades reales.
|     | 🌐                 | ⚡                       | 📦                  |     |
| --- | ----------------- | ----------------------- | ------------------ | --- |
|     | Escala web masiva | Latencia submilisegundo | Datos heterogéneos |     |
Facebook llegó a 800M de usuarios en 2011. MySQL  Amazon calculó que cada 100ms extra de latencia =  JSON de APIs, logs de servidores, clicks, sensores
no podía responder. 1% menos de ventas. IoT: sin esquema fijo.
💸 🔄
Costo de escala vertical Alta disponibilidad 24/7
Un servidor Oracle de alta gama cuesta cientos de  Los RDBMS tradicionales toleran mal los fallos de
miles de USD. nodo en producción.
Ingeniería de Datos II  ·  Facultad de Ingeniería y Ciencias Exactas  ·  UADE  ·  Ing. Damián Arnaudo

UADE Ingeniería de Datos II Historia
El término NoSQL
Carlo Strozzi
1998
Lo usa para su RDBMS que no usaba SQL como interfaz. Ironía: era relacional.
Eric Evans
2009
Lo re-populariza para describir bases de datos NO relacionales en Twitter.
Industria
Hoy
"Not Only SQL": abarca múltiples modelos que coexisten con el modelo relacional.
⚠ Error frecuente: NoSQL NO significa "sin SQL". Muchos sistemas NoSQL tienen sus propios lenguajes de consulta similares a SQL (CQL, MQL, Cypher…).
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

💬 Pregunta disparadora
¿Es posible diseñar un sistema que sea
a la vez consistente, disponible
y tolerante a particiones de red?
Pensá en WhatsApp, tu banco online y Netflix. ¿Cuál prioriza qué?
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo Debate

Características de NoSQL
¿Qué hace diferente a estas bases de datos?
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

| UADE | Ingeniería de Datos II |     | Características |
| ---- | ---------------------- | --- | --------------- |
Consistencia Eventual
"Si no hay nuevas actualizaciones, eventualmente todos los nodos verán el mismo valor."
|     | Nodo A | Nodo B | Nodo C |
| --- | ------ | ------ | ------ |
escribe X=5 ···  replicación en progreso  ··· lee X=3 (viejo) sincronizado ✓ lee X=5 (ok)
Ejemplo real — Facebook News Feed:
Cuando subís una foto, tu amigo en otro datacenter puede no verla de inmediato (ventana de segundos).
Eventualmente, los sistemas se sincronizan y todos ven el mismo estado. Esto es consistencia eventual.
Ingeniería de Datos II  ·  Facultad de Ingeniería y Ciencias Exactas  ·  UADE  ·  Ing. Damián Arnaudo

UADE Ingeniería de Datos II Características
Modelos de consistencia en NoSQL
No todas las bases NoSQL usan el mismo nivel de consistencia. Hay un espectro entre consistencia fuerte y eventual.
Todos los nodos deben confirmar la escritura antes de responder. Máxima
Consistencia plena
W > N/2 garantía, mayor latencia.
de escritura
Ejemplo: sistemas bancarios críticos
Se necesita confirmación de la mayoría (quórum). Balance entre consistencia y
Consistencia
W+R > N disponibilidad.
por quórum
Ejemplo: Cassandra con QUORUM
La lectura contacta todos los nodos para obtener el valor más reciente, aunque
Consistencia
R = N alguno falle.
de lectura fuerte
Ejemplo: MongoDB con ReadConcern 'majority'
Se escribe en un nodo y se propaga después. Máxima disponibilidad y
Consistencia
W=1, async velocidad. Riesgo de leer datos viejos.
Eventual
Ejemplo: DynamoDB, Cassandra eventual
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

| UADE | Ingeniería de Datos II |     |     |     | Características |
| ---- | ---------------------- | --- | --- | --- | --------------- |
Ausencia de esquema fijo
Tabla SQL (esquema rígido) Colección MongoDB (sin esquema)
| id  | nombre | edad | email |     |     |
| --- | ------ | ---- | ----- | --- | --- |
{ id:1, nombre:"Ana", edad:28,
| 1   | Ana | 28  | ana@… |   email:"ana@…", tags:["vip"] } |     |
| --- | --- | --- | ----- | ------------------------------- | --- |
{ id:2, nombre:"Luis",
  empresa:"UADE", país:"AR" }
| 2   | Luis | —   | —   |     |     |
| --- | ---- | --- | --- | --- | --- |
{ id:3, nombre:"Marta",
  edad:35, lat:-34.6, lon:-58.4 }
| 3   | Marta | 35  | …   |     |     |
| --- | ----- | --- | --- | --- | --- |
✓ Cada documento puede tener campos distintos. El esquema evoluciona sin migraciones costosas.
Ingeniería de Datos II  ·  Facultad de Ingeniería y Ciencias Exactas  ·  UADE  ·  Ing. Damián Arnaudo

UADE Ingeniería de Datos II Características
Schema-on-Write vs Schema-on-Read
El esquema no desaparece — se desplaza. La diferencia clave es cuándo y quién lo impone.
Schema-on-Write (SQL) Schema-on-Read (NoSQL)
📋 Definís la tabla antes de insertar datos 📦 Insertás cualquier estructura sin definición previa
🔒 La BD rechaza datos que no cumplan el esquema 🔓 La BD acepta el dato; la app interpreta el esquema
✅ La validación es automática e inmediata 🚀 Iteración rápida: agregás campos sin downtime
⚠ ` Cambiar el esquema requiere una migración (ALTER TABLE) ⚠ ` La validación queda a cargo de la aplicación
🐌 Las migraciones en producción pueden tardar horas 🐛 Datos heterogéneos pueden complicar las queries
Pivert (2018): "NoSQL Data Models" — el esquema no desaparece, se vuelve responsabilidad del desarrollador.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II Características
Alta velocidad de respuesta
¿Cómo logran respuestas en microsegundos?
In-memory storage Estructuras optimizadas
Tablas hash, árboles B+, LSM-trees: acceso O(1) o O(log n) según el
Redis guarda datos en RAM. Sin I/O de disco → respuestas en < 1ms.
modelo.
Sin JOIN pesados Procesamiento paralelo
Datos desnormalizados: una lectura trae todo. No hay joins costosos. Consultas distribuidas en múltiples nodos simultáneamente.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

| UADE | Ingeniería de Datos II |     |     | Características |
| ---- | ---------------------- | --- | --- | --------------- |
¿Por qué son tan rápidas? — Estructuras internas
Detrás de cada motor NoSQL hay una estructura de datos específica optimizada para su caso de uso.
| Hash Table |     | → Redis                   | LSM-Tree | → Cassandra, LevelDB       |
| ---------- | --- | ------------------------- | -------- | -------------------------- |
|            |     | SET usuario:42 "{nombre:  |          | INSERT INTO eventos ... →  |
|            |     | 'Ana'}"                   |          | buffer en RAM              |
Escrituras van siempre al final (append-only).
Acceso O(1) a claves. La estructura más simple  GET usuario:42   → O(1)  Flush a disco ordenado → sin
Sin random writes. Ideal para volumen
| y rápida posible para clave/valor. |     | siempre |     | seek |
| ---------------------------------- | --- | ------- | --- | ---- |
masivo.
| B+Tree |     | → MongoDB, MySQL             | Graph Store | → Neo4j                  |
| ------ | --- | ---------------------------- | ----------- | ------------------------ |
|        |     | db.users.find({edad: {$gte:  |             | MATCH (a)-[:SIGUE]->(b)  |
|        |     | 18}})                        |             | → pointer chase, no join |
Lectura eficiente O(log n). Soporta rangos y  → Index scan O(log n + k) Relaciones se almacenan como punteros
ordenamientos. Equilibrio lectura/escritura. físicos. Traversal O(1) por arista, sin JOINs.
Ingeniería de Datos II  ·  Facultad de Ingeniería y Ciencias Exactas  ·  UADE  ·  Ing. Damián Arnaudo

UADE Ingeniería de Datos II Características
Estructura distribuida
Los datos no viven en un único servidor: se reparten entre múltiples nodos.
Ventajas clave:
Nodo 1
Réplica 1A
[Shard A]
→ Alta disponibilidad
→ Tolerancia a fallos
Cliente Nodo 2
Réplica 2B
App [Shard B]
→ Sin single point of failure
→ Lectura/escritura local
Nodo 3
Réplica 3C
[Shard C]
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

| UADE | Ingeniería de Datos II | Características |
| ---- | ---------------------- | --------------- |
Escalabilidad: vertical vs horizontal
↑ Escala Vertical (Scale-Up) → Escala Horizontal (Scale-Out)
Un servidor más grande y potente Más servidores pequeños (nodos)
• •
CPU más rápida + más RAM Commodity hardware (barato)
| • Límite físico insuperable | • Sin límite teórico de nodos |     |
| --------------------------- | ----------------------------- | --- |
| • Costo exponencial         | • Costo lineal                |     |
• •
Ventana de mantenimiento requerida Sin downtime para agregar nodos
| • Single point of failure | • Alta disponibilidad distribuida |     |
| ------------------------- | --------------------------------- | --- |
NoSQL fue diseñado nativamente para escala horizontal. Los RDBMS pueden hacerlo, pero con mayor complejidad.
Ingeniería de Datos II  ·  Facultad de Ingeniería y Ciencias Exactas  ·  UADE  ·  Ing. Damián Arnaudo

| UADE | Ingeniería de Datos II | Características |
| ---- | ---------------------- | --------------- |
Escalamiento horizontal — casos reales
El escalamiento no es solo teoría. Estas empresas lo implementaron para sobrevivir al crecimiento.
Problema: 700+ millones de horas de video por día. Un fallo de un datacenter no puede tumbar el servicio.
| Netflix | Solución: |     |
| ------- | --------- | --- |
Cassandra en 3 regiones AWS. Replicación activa-activa. Si cae una región, las otras dos siguen sin interrupciones.
Lección: Disponibilidad > Consistencia (CAP: AP)
Problema: 500 millones de tweets por día. El timeline de cada usuario debe cargarse en < 100ms.
| Twitter / X | Solución: |     |
| ----------- | --------- | --- |
Redis para caché de timelines (lectura O(1)). Cassandra para almacenamiento histórico. Fan-out al escribir.
Lección: Rendimiento de lectura es la prioridad absoluta
Problema: Geolocalización en tiempo real de millones de conductores y pasajeros actualizándose cada segundo.
| Uber | Solución: |     |
| ---- | --------- | --- |
Schemaless (sobre MySQL) + Cassandra para viajes históricos. Kafka para eventos en tiempo real.
Lección: Escala escritura > escala lectura. Tolerancia a particiones obligatoria.
Harrison (2015): "Next Generation Databases" — Cap. 1: "Why NoSQL?"
Ingeniería de Datos II  ·  Facultad de Ingeniería y Ciencias Exactas  ·  UADE  ·  Ing. Damián Arnaudo

UADE Ingeniería de Datos II Análisis crítico
Ventajas y Desventajas de NoSQL
✓ Ventajas ✗ Desventajas
✓ Masivamente escalable (horizontal) ✗ Capacidad de consulta más limitada que SQL
✓ Alta disponibilidad y tolerancia a fallos ✗ Consistencia eventual: complejidad en apps
✓ Esquema flexible para datos dispersos ✗ Sin estándar unificado: vendor lock-in
✓ Bajo costo comparado con RDBMS empresariales ✗ Herramientas de seguridad menos maduras
✓ Rendimiento optimizado para grandes volúmenes ✗ No apto para transacciones ACID críticas
✗ Curva de aprendizaje y ecosistema fragmentado
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

Teorema CAP
Una de las ideas más importantes de los sistemas distribuidos
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

| UADE | Ingeniería de Datos II |     |     | Teorema CAP |
| ---- | ---------------------- | --- | --- | ----------- |
Teorema CAP — Brewer (2000)
"En un sistema distribuido, solo podés garantizar 2 de estas 3 propiedades simultáneamente."
|     | C            | A              | P                      |     |
| --- | ------------ | -------------- | ---------------------- | --- |
|     | Consistency  | Availability   | Partition tolerance    |     |
|     | Consistencia | Disponibilidad | Tolerancia a partición |     |
Todos los nodos ven los mismos datos al mismo  Cada request recibe una respuesta, sin garantía  El sistema funciona aunque la red entre nodos
|     | tiempo. | de actualidad. | falle. |     |
| --- | ------- | -------------- | ------ | --- |
En la práctica, P casi siempre es obligatorio (las redes fallan). La elección real es C vs A.
Ingeniería de Datos II  ·  Facultad de Ingeniería y Ciencias Exactas  ·  UADE  ·  Ing. Damián Arnaudo

| UADE | Ingeniería de Datos II |     |     |     |     | Teorema CAP |
| ---- | ---------------------- | --- | --- | --- | --- | ----------- |
CAP — ¿Qué elige cada tecnología?
| CA  |                   | CP  |                    | AP  |                     |     |
| --- | ----------------- | --- | ------------------ | --- | ------------------- | --- |
|     | RDBMS tradicional |     | Bancos, inventario |     | Redes sociales, IoT |     |
Ej: MySQL, PostgreSQL Ej: MongoDB, HBase, Redis Cluster Ej: Cassandra, CouchDB, DynamoDB
Consistencia + Disponibilidad. Sin partición. Para  Consistencia + Tolerancia. Si la red falla, el nodo  Disponibilidad + Tolerancia. Siempre responde,
sistemas centralizados. rechaza requests para no entregar datos viejos. pero puede dar datos desactualizados.
"You can have it good, you can have it fast, you can have it cheap: pick two."  — adaptación popular del teorema CAP
Ingeniería de Datos II  ·  Facultad de Ingeniería y Ciencias Exactas  ·  UADE  ·  Ing. Damián Arnaudo

UADE Ingeniería de Datos II Modelos de consistencia
Modelos de Consistencia: ACID vs BASE
ACID — Transacciones relacionales BASE — Modelo NoSQL
Atomicidad Basically Available
A
Todo o nada. Si falla un paso, todo se revierte. BA
El sistema garantiza disponibilidad (CAP availability).
Consistencia
C
Soft state
Las reglas del negocio siempre se respetan.
S
El estado puede cambiar con el tiempo sin input externo.
Aislamiento
I
Las transacciones no se afectan entre sí.
Eventual consistency
Durabilidad E
D El sistema eventualmente alcanza un estado consistente.
Los cambios confirmados sobreviven a fallos.
Referencia: http://queue.acm.org/detail.cfm?id=1394128
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

💬 Pregunta disparadora
¿Preferirías ACID o BASE para
el sistema de reservas de un avión?
¿Y para el "me gusta" de Instagram?
¿En qué casos la disponibilidad vale más que la consistencia perfecta?
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo Debate

Taxonomía NoSQL
Los 6 grandes modelos de bases de datos no relacionales
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

| UADE | Ingeniería de Datos II |     |     | Taxonomía |
| ---- | ---------------------- | --- | --- | --------- |
Los 6 modelos NoSQL — Visión general
|     | 📄                | 🕸️`               | 🔑                |     |
| --- | ---------------- | ----------------- | ---------------- | --- |
|     | Documental       | Grafos            | Clave / Valor    |     |
|     | MongoDB, CouchDB | Neo4j, ArangoDB   | Redis, DynamoDB  |     |
|     | 📊                | 📦                 | 🧊                |     |
|     | Tabular          | Objetos           | Multidimensional |     |
|     | Cassandra, HBase | db4o, ObjectStore | SciDB, Rasdaman  |     |
Ingeniería de Datos II  ·  Facultad de Ingeniería y Ciencias Exactas  ·  UADE  ·  Ing. Damián Arnaudo

UADE Ingeniería de Datos II Modelos NoSQL
Bases de Datos Documentales
Almacenan los datos como documentos semi-estructurados (JSON, BSON, XML).
{ Características clave:
"_id": "u001",
"nombre": "Ana García",
→ Cada documento es independiente y auto-descriptivo
"edad": 28,
"ciudad": "Buenos Aires",
"intereses": ["NoSQL","Python","ML"], → Colecciones: conjuntos de documentos (≈ tablas SQL)
"ultima_compra": {
"producto": "Auriculares",
"monto": 4500, → Documentos de la misma colección pueden tener campos distintos
"fecha": "2024-03-15"
}
→ Consultas por campo, rango, expresión regular
}
→ Indexación secundaria sobre cualquier campo
→ Muy rápido para reads de objetos completos (sin JOINs)
MongoDB · CouchDB · Couchbase · MarkLogic · Firestore
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II Modelos NoSQL
Bases de Datos de Grafos
Representan los datos como nodos y relaciones (aristas). Ideales cuando las relaciones importan tanto como los datos.
UADE
DICTA
TRABAJA_EN (Org.)
Ana
(Persona)
BD II
CONOCE (Curso)
INSCRIPTO
Luis
(Persona)
Cypher (Neo4j):
MATCH (p:Persona)-[:INSCRIPTO]->(c:Curso)<-[:DICTA]-(o:Org)
WHERE c.nombre = "BD II" RETURN p.nombre, o.nombre
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II Modelos NoSQL
Bases de Datos Clave / Valor
El modelo más simple: un diccionario distribuido y de alta velocidad.
Clave Valor
session:u001 {"user":"Ana","token":"abc123","exp":3600}
cache:prod:42 {"nombre":"Laptop","precio":85000,"stock":5}
lock:checkout "1" (mutex distribuido)
rate:ip:1.2.3 "47" (contador de requests)
Redis CLI:
SET session:u001 '{"user":"Ana","exp":3600}' EX 3600 ← escribe con TTL
GET session:u001 ← lectura O(1)
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

💬 Pregunta disparadora
¿Para qué casos de uso usarías Redis
en lugar de MongoDB?
¿Y a la inversa?
Caché de sesiones, contadores, publicar/suscribir, datos con TTL, búsqueda por texto completo…
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo Debate

| UADE | Ingeniería de Datos II |     |     |     |     | Modelos NoSQL |
| ---- | ---------------------- | --- | --- | --- | --- | ------------- |
Bases de Datos Tabulares (Column-Family)
Organizan los datos por columnas, no por filas. Optimizadas para consultas analíticas sobre grandes volúmenes.
SQL: almacenamiento por filas Cassandra: almacenamiento por columnas
| ID  | Nombre | Monto | País | CF: identidad   |        |        |
| --- | ------ | ----- | ---- | --------------- | ------ | ------ |
|     |        |       |      | ID:1            | ID:2   | ID:3   |
| 1   | Ana    | 4500  | AR   |                 |        |        |
| 2   | Luis   | 1200  | AR   | CF: transacción |        |        |
|     |        |       |      | M:4500          | M:1200 | M:8900 |
| 3   | María  | 8900  | MX   |                 |        |        |
CF: geo
|     |     |     |     | País:AR | País:AR | País:MX |
| --- | --- | --- | --- | ------- | ------- | ------- |
CQL (Cassandra Query Language):
CREATE TABLE ventas (id UUID PRIMARY KEY, monto DECIMAL, pais TEXT);     -- DDL
SELECT monto, pais FROM ventas WHERE pais = 'AR' ALLOW FILTERING;         -- DML
Ingeniería de Datos II  ·  Facultad de Ingeniería y Ciencias Exactas  ·  UADE  ·  Ing. Damián Arnaudo

UADE Ingeniería de Datos II Modelos NoSQL
Bases de Datos Orientadas a Objetos
Almacenan objetos tal como existen en el código de la aplicación, sin necesidad de mapeo objeto-relacional.
Clase: Pedido (Java/C++/Python) Sin mapeo O/R
El objeto se serializa directamente. No hay impedance mismatch.
class Pedido:
id: str
cliente: Cliente # ← objeto anidado Identidad de objeto
items: List[Item] # ← lista de objetos
total: float Cada objeto tiene un OID persistente único (no solo clave primaria).
estado: EstadoEnum
Herencia
# Se persiste tal cual, sin conversión
Las jerarquías de clases se reflejan en la persistencia.
Polimorfismo
Consultas sobre subtipos sin JOIN ni CAST.
db4o · ObjectStore · Versant · GemStone | Uso frecuente: CAD/CAM, simulación científica, financiero
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

| UADE | Ingeniería de Datos II |     |     |     |     | Modelos NoSQL |
| ---- | ---------------------- | --- | --- | --- | --- | ------------- |
Bases de Datos Multidimensionales / Arrays
Organizan los datos en grillas regulares multi-dimensionales. Ideales para ciencia, IoT y simulaciones.
Casos de uso:
Array 2D — Temperatura por zona/hora
Imágenes médicas
MRI, CT Scan: arrays 3D de vóxeles
|        | 8hs | 12hs | 16hs | 20hs |                   |     |
| ------ | --- | ---- | ---- | ---- | ----------------- | --- |
| Zona N | 21° | 28°  | 31°  | 25°  | Datos satelitales |     |
Raster data geoespacial por tiempo
| Zona C | 20° | 26° | 29° | 23° |     |     |
| ------ | --- | --- | --- | --- | --- | --- |
Simulación climática
| Zona S | 18° | 24° | 27° | 21° |     |     |
| ------ | --- | --- | --- | --- | --- | --- |
Grillas de temperatura/presión
Series temporales IoT
SciDB · Rasdaman · TileDB  |  Harrison (2015): "Next Generation Databases", cap. 9 Millones de sensores × tiempo
Ingeniería de Datos II  ·  Facultad de Ingeniería y Ciencias Exactas  ·  UADE  ·  Ing. Damián Arnaudo

Arquitectura Distribuida
Cómo NoSQL maneja la distribución, replicación y sharding
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II Arquitectura
Arquitectura de BD NoSQL
¿Cómo se organiza internamente un sistema NoSQL distribuido?
Capa de Aplicación Drivers, ORMs, SDKs en lenguajes como Python, Java, Node.js
Capa de Acceso Router de queries, load balancer, gestión de conexiones
Capa de Almacenamiento Nodos de datos, motores de almacenamiento (LSM, B-tree)
Capa de Replicación Coordinación entre réplicas, protocolo de consenso (Raft, Paxos)
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II Arquitectura
Sharding — Distribución de datos
Sharding: dividir horizontalmente los datos en múltiples nodos según una clave de partición.
Shard 1 IDs 0–999 Shard 2 IDs 1000–1999 Shard 3 IDs 2000+
{ _id: "u042", ... } { _id: "u1003",... } { _id: "u2100",... }
{ _id: "u511", ... } { _id: "u1457",... } { _id: "u3302",... }
⚠ ¿Qué es un Hotspot?
Un hotspot es un nodo que recibe desproporcionadamente más
carga que el resto.
Estrategias de sharding:
Ejemplo: sharding por rango con IDs secuenciales → los IDs nuevos
→ Range-based: por rangos de clave (simple, puede causar hotspots) siempre van al mismo shard, que se satura.
→ Hash-based: hash de la clave → distribución uniforme Solución → Hash-based sharding distribuye la carga uniformemente.
→ Directory-based: tabla de mapeo explícita → flexible pero un punto centralizado
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II Análisis comparativo
Comparación de modelos NoSQL
¿Cuándo usar cada modelo? Resumen de criterios de selección.
Modelo Estructura Fortaleza Caso de uso típico Ejemplo
Documental JSON/BSON Flexibilidad CMS, catálogos, perfiles MongoDB
Grafos Nodos+aristas Relaciones complejas Redes sociales, fraude Neo4j
Clave/Valor Dict distribuido Velocidad O(1) Caché, sesiones, colas Redis
Tabular Column families Escritura masiva IoT, analytics, time-series Cassandra
Objetos Objetos nativos Sin mapeo O/R CAD, sim. científica db4o
Multidimensional Arrays N-dim Análisis numérico Imágenes, sensores, clima SciDB
Referencia: Harrison, G. (2015). Next Generation Databases. Apress. — Cap. 2 y 3
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

| UADE | Ingeniería de Datos II |     |     | DB-Engines Ranking |
| ---- | ---------------------- | --- | --- | ------------------ |
Top 20 — Bases de datos más populares (Marzo 2026)
Fuente: db-engines.com/en/ranking  ·  Métrica: menciones en buscadores, Stack Overflow, LinkedIn, ofertas de trabajo y redes sociales
| # DBMS                 |     | Modelo          | # DBMS                    | Modelo             |
| ---------------------- | --- | --------------- | ------------------------- | ------------------ |
| 1 Oracle               |     | Relacional      | 11 Apache Cassandra       | Tabular (wide-col) |
| 2 MySQL                |     | Relacional      | 12 SQLite                 | Relacional         |
| 3 Microsoft SQL Server |     | Relacional      | 13 MariaDB                | Relacional         |
| 4 PostgreSQL           |     |                 | 14 Microsoft Azure SQL DB |                    |
|                        |     | Relacional      |                           | Relacional         |
| 5 MongoDB              |     | Documental      | 15 Apache Hive            | Relacional         |
| 6 Snowflake            |     | Relacional      | 16 Splunk                 | Motor búsqueda     |
| 7 Databricks           |     | Relacional/Lake | 17 Amazon DynamoDB        | Clave/Valor        |
| 8 Redis                |     | Clave/Valor     | 18 Google BigQuery        | Relacional         |
| 9 IBM Db2              |     |                 | 19 Neo4j                  |                    |
Relacional Grafos
10 Elasticsearch Motor búsqueda 20 Apache Solr Motor búsqueda
Relacional (RDBMS) Documental (NoSQL) Tabular (NoSQL) Grafos (NoSQL) Clave/Valor (NoSQL) Motor búsqueda
Ingeniería de Datos II  ·  Facultad de Ingeniería y Ciencias Exactas  ·  UADE  ·  Ing. Damián Arnaudo db-engines.com

UADE Ingeniería de Datos II DB-Engines Ranking
Popularidad por categoría de base de datos (Marzo 2026)
Fuente: db-engines.com/en/ranking_categories · Gráfico "Ranking scores per category in percent, March 2026"
Relacional (RDBMS) 71.4%
Documental 8.2%
Clave / Valor 5.8%
Motor de búsqueda 4.3%
Tabular (Wide Column) 3.1%
Time Series 2.8%
Grafos 2.2%
Vector DBMS 1.3%
Objetos 0.5%
Otros 0.4%
Relacional: 71.4% · Total NoSQL: ~28.6% · Los RDBMS dominan pero NoSQL creció de ~8% (2013) a ~28% (2026) · Fuente: db-engines.com/en/ranking_categories
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo db-engines.com

UADE Ingeniería de Datos II ⚠ Atención
Errores conceptuales frecuentes
✗ "NoSQL reemplaza a las bases relacionales"
✓ NoSQL complementa al modelo relacional. La tendencia es persistencia polimórfica: usar la herramienta correcta para cada problema.
✗ "NoSQL no tiene lenguaje de consulta"
✓ Cassandra tiene CQL, MongoDB tiene MQL (similar a JSON), Neo4j tiene Cypher. La diferencia es que ninguno es ANSI SQL estándar.
✗ "En NoSQL no hay esquema"
✓ Hay 'schema-flexible' o 'schema-on-read', pero en la práctica toda app impone un esquema implícito. La diferencia es cuándo se valida.
✗ "NoSQL siempre es más rápido que SQL"
✓ Depende del tipo de consulta y del modelo. Para queries relacionales complejas, un RDBMS con índices puede superar a un documental.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

| UADE | Ingeniería de Datos II |     |     |     | Casos de uso |
| ---- | ---------------------- | --- | --- | --- | ------------ |
NoSQL en producción — Casos reales
|     | Netflix |             | Twitter/X |                   |     |
| --- | ------- | ----------- | --------- | ----------------- | --- |
|     |         | → Cassandra |           | → Redis+Cassandra |     |
Timeline cache (Redis ms) · tweets históricos (Cassandra) · 6000
150M usuarios · historial de vistas · series temporales · 99.99% uptime
tweets/seg
|     | LinkedIn | → Voldemort (Riak) | Uber | → Schemaless (MySQL+NoSQL) |     |
| --- | -------- | ------------------ | ---- | -------------------------- | --- |
Graph de conexiones profesionales · 1B perfiles · consultas de red Geolocalización en tiempo real · surge pricing · trips históricos
Ingeniería de Datos II  ·  Facultad de Ingeniería y Ciencias Exactas  ·  UADE  ·  Ing. Damián Arnaudo

💬 Pregunta disparadora
Si tuvieras que diseñar el backend de una
app de delivery con 1M de usuarios:
¿qué modelo(s) NoSQL elegirías y por qué?
Usuarios, pedidos, menú, repartidores en tiempo real, historial, recomendaciones…
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo Debate

UADE Ingeniería de Datos II Síntesis
El hilo conductor de la clase
Contexto: era de los datos
01
Explosión de volumen desde 2005 → RDBMS no alcanza
Respuesta: NoSQL
02
Flexibilidad + escala horizontal + alta disponibilidad
El precio: CAP & BASE
03
Debemos elegir entre consistencia y disponibilidad
La solución: 6 modelos
04
Cada modelo optimiza para un tipo de problema distinto
La madurez: persistencia polimórfica
05
Usar el modelo correcto para cada parte del sistema
Próxima clase: Implementación práctica con MongoDB — consultas, índices y modelado documental.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II Tarea y recursos
Para la próxima clase
📚 Lecturas y preparación
Harrison (2015)
Cap. 1 y 2: "Why NoSQL?" + "NoSQL Data Models"
Pivert (2018)
Cap. 1: "Introduction to NoSQL Data Models"
Documentación MongoDB
mongodb.com/docs — sección "Introduction" e "Installation"
Instalar MongoDB Community
Tener MongoDB 7.x corriendo localmente o vía Docker para la Clase 3
✏ Ejercicio:
Dado el sistema de e-commerce de la pregunta final: definí qué modelo NoSQL usarías para CADA entidad (usuarios, productos, pedidos, repartidores,
recomendaciones).
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

3 ideas clave para llevarse de la Clase 2
NoSQL nació de una necesidad real
1
No es una moda: escala, velocidad y flexibilidad que el modelo relacional no podía dar a empresas como Google o Facebook.
CAP es un trade-off, no una falla
2
Elegir entre consistencia y disponibilidad es una decisión de diseño consciente, no un defecto del sistema.
No hay un modelo universal
3
Cada uno de los 6 modelos NoSQL está optimizado para un tipo de problema. El arte está en elegir el correcto.
Ingeniería de Datos II · 1er Cuatrimestre 2026 · Ing. Damián Arnaudo · UADE