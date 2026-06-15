C L A S E 3
Bases de Datos
Documentales
y MongoDB
BD Documentales — Concepto y características · MongoDB · CRUD y consultas
Ing. Damián Arnaudo · 1er Cuatrimestre 2026 · Facultad de Ingeniería y Ciencias Exactas — UADE
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II Clase 3
Agenda de la clase
Bases de Datos Documentales
01
Concepto · Características · Comparativa relacional · Ecosistema
MongoDB — Descripción y Evolución
02
Historia · Arquitectura · BSON · Jerarquía · Modelado · Índices · Replicación · Sharding
CRUD y Consultas
03
Comandos básicos · insertOne/Many · find + operadores · update · delete · Aggregation Pipeline
Ejercitación Práctica
04
Casos de negocio reales · Resolución guiada · Preguntas de reflexión
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

Bases de Datos Documentales
Concepto · Características · Comparativa relacional · Ecosistema
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II BD Documentales
¿Qué es una Base de Datos Documental?
Una base de datos documental almacena, recupera y administra datos semi-estructurados organizados como
documentos independientes — en lugar de filas en tablas con esquema fijo.
El documento es la unidad Colecciones, no tablas Formato semi-estructurado
Un documento es un conjunto Los documentos se agrupan en Los formatos más comunes son JSON y
autocontenido de datos. Puede incluir colecciones. A diferencia de las tablas, BSON (Binary JSON). Cada documento es
arrays, sub-documentos y tipos una colección no impone un esquema: un árbol de pares clave:valor, donde los
complejos. No necesita referencias a cada documento puede tener campos valores pueden ser escalares, arrays u
otras 'tablas'. distintos. otros documentos.
💡 Analogía: Si una BD relacional es un formulario con campos fijos, una BD documental es un expediente donde cada legajo tiene su
propia estructura.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

💬 Pregunta disparadora
documento MongoDB
¿Por qué guardar
{
este perfil de usuario "nombre": "Ana García",
"email": "ana@mail.com",
"telefonos": ["+54-11-1234", "+54-341-5678"],
en una tabla SQL?
"redes": {
"instagram": "@anagarcia",
nombre, apellido, email, fecha_nac, ciudad, "linkedin": "ana-garcia-arg"
},
telefono1, telefono2, foto_url, idioma_pref,
"compras": [
redes_sociales, historial_compras, …
{ "prod": "Laptop", "fecha": "2024-01" },
{ "prod": "Mouse", "fecha": "2024-03" }
En SQL necesitarías al menos 4 tablas y varios JOINs para
]
representar este perfil.
}
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

| UADE | Ingeniería de Datos II |     |     |     | BD Documentales |
| ---- | ---------------------- | --- | --- | --- | --------------- |
Relacional vs. Documental: La Unidad de Datos
| SQL — Tabla 'clientes' |        |       |        | MongoDB — Colección 'clientes' |     |
| ---------------------- | ------ | ----- | ------ | ------------------------------ | --- |
| id                     | nombre | email | ciudad | JSON/BSON                      |     |
{
| 1   | Ana | ana@mail.com | Rosario |   "_id": ObjectId("64a1f3b..."), |     |
| --- | --- | ------------ | ------- | -------------------------------- | --- |
  "nombre":    "Ana",
| 2   | Luis | NULL | Buenos Aires |     |     |
| --- | ---- | ---- | ------------ | --- | --- |
  "email":     "ana@mail.com",
| ⚠  Problemas del modelo relacional |     |     |     |   "ciudad":    "Rosario", |     |
| ---------------------------------- | --- | --- | --- | ------------------------- | --- |
| para datos heterogéneos:           |     |     |     |   "telefonos": [          |     |
    "+54-341-111",
• NULL para campo sin valor
    "+54-341-222"
• Esquema rígido para todos los registros
  ],
• Datos relacionados en tablas separadas (JOIN)
  "preferencias": {
• Migración obligatoria al cambiar el esquema
    "newsletter":  true,
Tabla separada 'telefonos'
    "categoria":   "tecnología"
| cliente_id |     | telefono |     |     |     |
| ---------- | --- | -------- | --- | --- | --- |
  }
| 1   |     | +54-341-111 |     |     |     |
| --- | --- | ----------- | --- | --- | --- |
}
| 1   |     | +54-341-222 |     |     |     |
| --- | --- | ----------- | --- | --- | --- |
// → Luis puede omitir 'email'
//   sin necesidad de NULL
✔  Arrays en un solo documento  ✔  Sin NULL  ✔  Sin JOIN  ✔
Ingeniería de Datos II  ·  Facultad de Ingeniería y Ciencias Exactas  ·  UADE  ·  Ing. Damián Arnaudo Sin migraciones de esquema

| UADE | Ingeniería de Datos II |     |     | BD Documentales |
| ---- | ---------------------- | --- | --- | --------------- |
Características Clave de las BD Documentales
| Esquema Flexible |     | Localidad de Datos | Escritura Rápida |     |
| ---------------- | --- | ------------------ | ---------------- | --- |
No requiere DDL previo. El esquema
Toda la información de una entidad vive  Priorizan disponibilidad de escritura.
evoluciona con los datos sin migraciones
en un solo documento → menos lecturas  Garantizan escrituras aún ante fallos de
costosas. Cada documento puede tener
|     |     | de disco, sin joins obligatorios. | red o hardware (configurable). |     |
| --- | --- | --------------------------------- | ------------------------------ | --- |
campos distintos.
| Consultas Ricas |     | Indexación Avanzada | Escalabilidad Horizontal |     |
| --------------- | --- | ------------------- | ------------------------ | --- |
Soporte de filtros, proyecciones,
agregaciones, búsqueda de texto  Índices simples, compuestos,  Sharding nativo: la colección se fragmenta
completo e índices sobre cualquier  geoespaciales, de texto, TTL y wildcard.  entre múltiples nodos según la shard key.
campo, incluidos arrays y sub- Sin índice → full collection scan. Soporta petabytes de datos.
documentos.
Ingeniería de Datos II  ·  Facultad de Ingeniería y Ciencias Exactas  ·  UADE  ·  Ing. Damián Arnaudo

UADE Ingeniería de Datos II BD Documentales
Esquema Flexible — Schema-on-Read
A diferencia del modelo relacional (schema-on-write), en una BD documental el esquema se valida en la lectura: la aplicación
interpreta los documentos. Esto tiene consecuencias profundas.
Schema-on-Write (SQL) Schema-on-Read (NoSQL Documental)
• Define la tabla antes de insertar datos • Inserta datos sin definición previa de estructura
• La BD rechaza datos que no cumplen el esquema • La BD acepta el documento tal como viene
• La validación es automática e inmediata • La validación queda a cargo de la aplicación
• Cambiar el esquema requiere ALTER TABLE • Agregar campos no requiere migración
• Las migraciones en producción pueden ser lentas • Datos heterogéneos conviven fácilmente
📌 Buena práctica: aunque MongoDB no lo exige, en producción se recomienda definir $jsonSchema validators para validar los
documentos antes de insertarlos. No es un esquema rígido, sino una red de seguridad configurable.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II BD Documentales
Localidad de Datos y Rendimiento de Escritura
Localidad de datos Documento único en MongoDB
En un modelo relacional, una entidad como 'pedido' puede
1 lectura de disco
involucrar 5 o más tablas. Cada consulta necesita múltiples
{
lecturas de disco y JOINs en memoria.
"_id": ObjectId("..."),
pedidos clientes items_pedido "cliente": { "nombre": "Ana", "email": "..." },
"direccion": { "calle": "...", "ciudad": "..." },
"items": [
productos direcciones
{ "prod": "Laptop", "precio": 1200, "qty": 1 },
{ "prod": "Mouse", "precio": 25, "qty": 2 }
],
5 tablas + 4 JOINs = múltiples lecturas
"total": 1250,
Rendimiento de escritura "estado": "enviado"
}
• Prioriza disponibilidad de escritura sobre consistencia estricta
// → 1 documento = 1 lectura de disco
• Garantiza escrituras rápidas incluso ante fallos de hardware o red
• Write Concern configurable: desde fire-and-forget hasta journaled
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II BD Documentales
Consultas Ricas — Casos de Uso Ideales
Las BD documentales no son simplemente 'más flexibles' — tienen un perfil de uso específico donde brillan.
👤 Gestión de contenido / CMS 🛒 Catálogos de e-commerce 📱 Perfiles de usuario / Social
Artículos, posts y páginas con estructura Productos con atributos heterogéneos: Datos densos: preferencias, historial,
variable. Cada tipo de contenido tiene una campera tiene talla, una TV tiene conexiones. Todo en un documento =
campos propios. resolución. Un documento por producto. lectura ultra-rápida del perfil.
📊 Datos de IoT / Logs / Eventos 🎮 Gaming / Inventarios 🏥 Historia clínica / Medical
Cada paciente tiene un esquema
Alto volumen de escritura, esquema Estado del juego, inventario del
diferente según sus condiciones. El
variable según el sensor o evento. personaje, logros. Estructuras anidadas
modelo documental es natural para
Colecciones con TTL para auto-expirar. que mapean 1:1 con objetos del juego.
historias clínicas.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II BD Documentales
¿Cuándo NO usar una Base de Datos Documental?
La BD documental no es una solución universal. Existen escenarios donde el modelo relacional sigue siendo superior.
✗ Transacciones complejas multi-entidad
Si tu dominio requiere ACID estricto entre muchas entidades (ej: transferencias bancarias con múltiples actores), un RDBMS con transacciones
maduras puede ser más adecuado. MongoDB soporta transacciones multi-documento desde v4.0, pero con costo de rendimiento.
✗ Datos altamente relacionados en grafo
Si tu problema central son las relaciones (red social, grafo de dependencias), una BD de grafos como Neo4j es más apropiada. Los $lookup en
MongoDB no escalan bien para relaciones profundas recursivas.
✗ Consultas analíticas complejas sobre datos históricos
OLAP pesado con muchas dimensiones y métricas se suele servir mejor con un data warehouse columnar (Redshift, BigQuery, Snowflake).
MongoDB tiene Atlas Data Lake, pero no reemplaza un OLAP especializado.
✗ Equipo con expertise puramente relacional, sin necesidad de escala
Si la escala no es un problema y el equipo domina SQL, introducir NoSQL suma complejidad operativa sin beneficio claro. La herramienta
correcta depende del contexto.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II BD Documentales
El Ecosistema — Principales BD Documentales
MongoDB
General purpose
Líder del mercado. Open source (SSPL). Community + Enterprise. Cloud: Atlas (AWS/GCP/Azure).
Aggregation Pipeline potente.
CouchDB (Apache)
Offline-first / móvil
HTTP nativo. Protocolo de sincronización offline con PouchDB (apps móviles). Replicación multi-
master. UI Fauxton integrada.
Amazon DynamoDB
Cloud / serverless
Servicio gestionado AWS. Modelo key-document híbrido. SLA 99.999%. Auto-scaling. Muy popular
en arquitecturas serverless.
Google Firestore
Apps reactivas / Firebase
Cloud nativo Google. SDK tiempo real web/mobile. Sincronización offline. Reglas de seguridad
declarativas. Integrado en Firebase.
Couchbase
Alto rendimiento / cache
Combina documental + clave/valor. SQL-like query language (N1QL). Memoria cache integrada. Alto
throughput.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II BD Documentales
⚠ Errores Conceptuales Frecuentes
✗ "Sin esquema = sin estructura = caos"
✔ Schema-less significa esquema implícito, gestionado por la aplicación. En producción se usan $jsonSchema validators. No es caos —
es responsabilidad delegada a la capa de aplicación.
✗ "Una colección es exactamente igual a una tabla SQL"
✔ La analogía es útil para empezar, pero imprecisa. Una colección no impone estructura: documentos de la misma colección pueden ser
radicalmente distintos. No hay DDL previo.
✗ "Las BD documentales no soportan relaciones entre entidades"
✔ Sí soportan relaciones, pero de dos formas: embedding (documento anidado) o referencing (clave foránea manual + $lookup). El
diseño decide cuál usar según el patrón de acceso.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

MongoDB
Descripción · Evolución · Arquitectura · Características
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II MongoDB
¿Qué es MongoDB?
Definición, nombre y ediciones
MongoDB es la base de datos documental líder del mercado. Su nombre proviene del inglés humongous (enorme), reflejando
su diseño para manejar volúmenes masivos de datos.
Características generales Ediciones disponibles
Community Server
• Base de datos documental orientada a documentos BSON
Gratuita. Open source (SSPL). Ideal para desarrollo y producción
• Arquitectura distribuida nativa: replicación + sharding
sin soporte oficial.
• Motor de almacenamiento: WiredTiger (desde v3.2)
• Aggregation Pipeline de alto rendimiento Enterprise Advanced
• Drivers oficiales para 10+ lenguajes Soporte oficial, auditoría, LDAP/Kerberos, encriptación en
reposo, BI Connector.
• Certificaciones profesionales disponibles
MongoDB University (https://learn.mongodb.com/)
Atlas (Cloud DBaaS)
Servicio gestionado: backups automáticos, escalado, búsqueda
vectorial, Charts, Data Lake. Free Tier M0 disponible.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

| UADE | Ingeniería de Datos II |     |     |     |     | MongoDB |
| ---- | ---------------------- | --- | --- | --- | --- | ------- |
Historia y Evolución de MongoDB
| 2007              |      | 2011          |      | 2018          |      | 2023–24 |
| ----------------- | ---- | ------------- | ---- | ------------- | ---- | ------- |
|                   | 2009 |               | 2016 |               | 2021 |         |
| 10gen desarrolla  |      | Versión 1.4:  |      | Versión 4.0:  |      |         |
Versión 7.x (LTS):
| MongoDB mientras  |     | considerada  |     | transacciones ACID  |     |     |
| ----------------- | --- | ------------ | --- | ------------------- | --- | --- |
queryable encryption,
| construye una PaaS  |     | 'production ready'.  |     | multi-documento.  |     |     |
| ------------------- | --- | -------------------- | --- | ----------------- | --- | --- |
búsqueda vectorial
| (similar a Google App  |     | Despegue en la  |     | Licencia SSPL  |     |     |
| ---------------------- | --- | --------------- | --- | -------------- | --- | --- |
(RAG/IA), Atlas Stream.
Engine)
|     |     | comunidad de  |     | reemplaza AGPL. |     |     |
| --- | --- | ------------- | --- | --------------- | --- | --- |
startups.
MongoDB se publica
|     |     | Versión 3.x: motor  |     | Versión 5.x: time series  |     |     |
| --- | --- | ------------------- | --- | ------------------------- | --- | --- |
como open source
|     |     | WiredTiger reemplaza  |     | collections nativas, live  |     |     |
| --- | --- | --------------------- | --- | -------------------------- | --- | --- |
bajo licencia AGPL.
|     |     | MMAPv1. Compresión,  |     | resharding, búsqueda  |     |     |
| --- | --- | -------------------- | --- | --------------------- | --- | --- |
Primera versión
|     |     | mejor concurrencia. |     |     | semántica. |     |
| --- | --- | ------------------- | --- | --- | ---------- | --- |
pública.
Ingeniería de Datos II  ·  Facultad de Ingeniería y Ciencias Exactas  ·  UADE  ·  Ing. Damián Arnaudo

| UADE | Ingeniería de Datos II |     |     |     |     | MongoDB |
| ---- | ---------------------- | --- | --- | --- | --- | ------- |
BSON — Binary JSON: El Formato Interno
MongoDB NO almacena texto JSON. Internamente usa BSON (Binary JSON), una extensión binaria que agrega tipos que JSON
nativo no tiene.
| ¿Por qué BSON y no JSON? |     |     |     | Tipos BSON adicionales a JSON |             |     |
| ------------------------ | --- | --- | --- | ----------------------------- | ----------- | --- |
| •                        |     |     |     | Tipo                          | Descripción |     |
JSON es texto plano → lento de parsear
• BSON es binario → más rápido de leer/escribir desde disco ObjectId (12 B) ID único autogenerado, cronológico
• BSON tiene tipos ricos que JSON no tiene Date Fecha/hora en ms desde epoch Unix
• Permite indexar directamente sobre campos binarios Int32 / Int64 Enteros de 32 y 64 bits
• Soporta datos de hasta 16 MB por documento Decimal128 Decimal alta precisión (finanzas)
|     |     |     |     | BinData   | Datos binarios arbitrarios |     |
| --- | --- | --- | --- | --------- | -------------------------- | --- |
|     |     |     |     | Timestamp | Uso interno de replicación |     |
Anatomía del ObjectId (12 bytes)
|         |     |         |         | Regex | Expresiones regulares compiladas |     |
| ------- | --- | ------- | ------- | ----- | -------------------------------- | --- |
| 4 bytes |     | 5 bytes | 3 bytes |       |                                  |     |
Unix timestamp ID proceso/host Contador aleatorio →  Globalmente único, ordenado cronológicamente, sin coordinación central
Ingeniería de Datos II  ·  Facultad de Ingeniería y Ciencias Exactas  ·  UADE  ·  Ing. Damián Arnaudo

UADE Ingeniería de Datos II MongoDB
Jerarquía de Datos en MongoDB
La estructura interna y su equivalencia con SQL
mongod — proceso servidor
Instancia del proceso de base de datos. Un servidor puede alojar múltiples BD.
Base de Datos
Agrupa colecciones. Tiene su propio espacio de nombres. Ej: 'ecommerce', 'hospital'.
Colección
Análoga a tabla. No impone esquema. Ej: 'productos', 'clientes', 'pedidos'.
Documento (BSON)
Análogo a fila. Autocontenido. Puede tener arrays, sub-docs y tipos ricos.
Campo: valor
Par clave-valor. El valor puede ser escalar, array u otro
documento.
Equivalencia SQL → MongoDB
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II MongoDB
Modelado: Embedding vs. Referencing
La decisión de diseño más importante en MongoDB
Embedding — Documentos Anidados Referencing — Clave Foránea Manual
Embedding Referencing
{ // Colección 'pedidos'
"_id": ObjectId("..."), {
"cliente": "Ana García", "_id": ObjectId("abc"),
"direccion": { "clienteId": ObjectId("xyz"),
"calle": "San Martín 450", "producto": "Laptop",
"ciudad": "Rosario" "precio": 1200
}, }
"pedidos": [ // Colección 'clientes'
{ "prod": "Laptop", "precio": 1200 }, {
{ "prod": "Mouse", "precio": 25 } "_id": ObjectId("xyz"),
] "nombre": "Ana García"
} }
✔ Un acceso de disco ✔ Sin duplicación — entidad compartida
✔ Sin JOIN — datos juntos siempre ✔ Documentos más pequeños (< 16 MB)
⚠ Puede superar 16 MB si los sub-docs crecen ⚠ Requiere $lookup (equivalente a JOIN)
⚠ Duplicación si la sub-entidad es compartida ⚠ Dos lecturas de disco mínimo
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II MongoDB
Regla de Oro del Modelado en MongoDB
"Diseñá el esquema según cómo la aplicación accede a los datos, no según las relaciones abstractas
entre entidades."
¿Los datos siempre se leen juntos? → Embed (documento anidado)
¿La sub-entidad se actualiza independientemente? → Reference (clave foránea)
¿La sub-entidad es compartida por múltiples documentos? → Reference para evitar duplicación
¿El array puede crecer ilimitadamente? → Reference (riesgo de superar 16 MB)
¿Necesitás la info del padre sin la del hijo? → Reference o subset pattern
Referencia: MongoDB Documentation — Data Modeling Introduction | docs.mongodb.com/manual/data-modeling/
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II MongoDB
Motor de Almacenamiento: WiredTiger
• Motor por defecto desde MongoDB 3.2. Reemplazó al MMAPv1.
Arquitectura simplificada
• Almacenamiento comprimido: Snappy (default), zlib o zstd —
Aplicación / Driver
reduce 80% el espacio en muchos casos
• Concurrencia a nivel documento (document-level locking) — sin ↕
mongod (API)
bloqueos de colección
• Soporte de transacciones ACID multi-documento desde v4.0 ↕
WiredTiger Cache
(Replica Set) y v4.2 (Sharded)
↕
• Journal (oplog) para durabilidad y recuperación ante cierres
Journal / Oplog
forzados
↕
• GridFS: sistema de almacenamiento para archivos > 16 MB (divide
Disco (comprimido)
en chunks de 255 KB)
⚠ Límite de documento: 16 MB. Para archivos mayores usar GridFS, que
fragmenta el archivo en chunks de 255 KB almacenados como documentos
separados.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II MongoDB
Índices en MongoDB
Estructuras de acceso rápido — clave para el rendimiento
Un índice es una estructura de datos auxiliar (B-tree) que almacena los valores de un campo en orden, permitiendo
búsquedas en O(log n) en lugar de O(n) (collection scan completo).
_id (automático) Simple
Creado automáticamente. No se puede borrar. Garantiza unicidad
Un campo. db.col.createIndex({ campo: 1 }) — 1 asc, -1 desc.
global.
Compuesto Multiclave (Array)
Múltiples campos. El orden importa. Sigue la ESR Rule: Equality → Indexa cada elemento de un array. Se crea automáticamente al
Sort → Range. indexar un campo array.
Geoespacial Textual
2dsphere (GeoJSON) para coordenadas reales. 2d para grillas
Búsqueda full-text: tokenización, stemming y stopwords por idioma.
planas. Queries de proximidad.
TTL (Time To Live) Parcial (Partial)
Elimina documentos automáticamente después de un tiempo. Útil Indexa solo los documentos que cumplen un filtro. Índice más
para sesiones, logs. pequeño, más rápido.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II MongoDB
Replicación: Replica Sets
Alta disponibilidad y redundancia de datos
• Un Replica Set es un grupo de instancias mongod que mantienen el Topología de Replica Set
mismo dataset.
PRIMARY
• Un nodo Primary recibe todas las escrituras (solo 1 a la vez puede
✎ Escrituras + Lecturas
ser Primary)
• Nodos Secondary replican el oplog del Primary de forma asíncrona
• Si el Primary falla → elección automática de nuevo Primary SECONDARY SECONDARY
Solo lecturas Solo lecturas
(heartbeat cada 2 s)
• Mínimo 3 nodos para quórum de elección. Puede haber un Árbitro
oplog: capped collection replicada entre todos los nodos
(voto sin datos).
• Write Concern 'majority': escritura confirmada por la mayoría →
durable
⚠ Lecturas desde Secondary: posible staleness (consistencia eventual).
Configurar readPreference y readConcern según el caso de uso.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II MongoDB
Sharding: Escalamiento Horizontal
Distribución de datos en múltiples nodos
• Sharding fragmenta una colección en múltiples nodos (shards) usando
Componentes del Clúster Sharded
una shard key
• Cada shard almacena un subconjunto de documentos (chunk = rango de Aplicación Cliente
shard key)
↕
• mongos: router de consultas — el cliente nunca habla directamente con
mongos (Router)
los shards
↕
• Config Servers (CSRS): almacenan el mapa de chunks y metadatos del
cluster Shard 1 (RS)
• Escalabilidad casi lineal: agregar más shards = más capacidad de ↕
escritura y lectura
Config Servers (CSRS)
Criterios para la Shard Key
Alta Cardinalidad Baja Frecuencia No monótona
Muchos valores únicos → distribución Cada valor se repite poco → sin 'hotspot' en Evitar ObjectId/fecha crudos → todo va al
granular entre chunks un shard último shard
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

| UADE | Ingeniería de Datos II | MongoDB |
| ---- | ---------------------- | ------- |
Sharding: Composición
Ingeniería de Datos II  ·  Facultad de Ingeniería y Ciencias Exactas  ·  UADE  ·  Ing. Damián Arnaudo

UADE Ingeniería de Datos II MongoDB
Seguridad en MongoDB
Autenticación SCRAM (default), x.509, LDAP, Kerberos. ⚠ Sin autenticación activada, cualquier conexión local tiene
acceso total — activar siempre en producción.
Autorización (RBAC) Roles por base de datos: read, readWrite, dbAdmin, userAdmin, clusterAdmin. Roles personalizados con
granularidad por colección.
Encriptación en Tránsito
TLS/SSL obligatorio en producción. Verificación de certificados cliente-servidor.
Encriptación en Reposo
WiredTiger soporta AES-256. Solo en MongoDB Enterprise y Atlas. No disponible en Community.
Auditoría
Registro de operaciones: quién hizo qué y cuándo. Solo Enterprise. Exporta a JSON/BSON/syslog.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

CRUD y Consultas
Comandos básicos · insertOne/Many · find · update · delete · Aggregation Pipeline
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II CRUD y Consultas
Comandos de Administración
MongoDB Shell (mongosh)
mongosh mongosh
// ─── Bases de datos ───────────────────────────────────
db.createCollection("productos", {
show dbs // Listar todas las bases de datos
validator: { $jsonSchema: { // Validación de esquema
use ecommerce // Cambiar / crear base de datos
required: ["nombre", "precio"],
db.stats() // Estadísticas de la BD actual
properties: {
db.dropDatabase() // Eliminar BD actual (irreversible)
nombre: { bsonType: "string" },
precio: { bsonType: "double", minimum: 0 }
}
// ─── Colecciones ──────────────────────────────────────
}}
show collections // Listar colecciones
})
db.getCollectionNames() // Igual — retorna array JS
db.productos.drop() // Eliminar colección
db.productos.renameCollection("items") // Renombrar colección
console.clear() // cls // Limpiar la consola
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II CRUD y Consultas
CREATE — Insertar Documentos
mongosh — CREATE mongosh — CREATE
// ─── insertOne ──────────────────────────────────────── // ─── insertMany ──────────────────────────────────────
db.productos.insertOne({ db.productos.insertMany([
nombre: "Laptop ThinkPad X1", { nombre: "Mouse Inalámbrico", precio:29.99, stock:200 },
marca: "Lenovo", { nombre: "Teclado Mecánico", precio: 89.00, stock:75 },
precio: 1250.00, { nombre: "Monitor 27\"", precio: 480.00, stock: 30 }
stock: 15, ], { ordered: false })
categorias: ["electrónica", "computación"], // array // ordered:false → continúa si un documento falla
especif: { ram: "16GB", ssd: "512GB" }, // sub-doc // (no detiene el batch)
creadoEn: new Date()
}) // Si no se provee _id → MongoDB genera
// ObjectId automáticamente
// → { acknowledged: true,
// insertedId: ObjectId("64a1f3b...") }
✔ ordered: false mejora rendimiento en bulk inserts al no detener el lote ante un error parcial. Los errores se reportan al final.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II CRUD y Consultas
READ — Consultar Documentos (find)
mongosh — READ mongosh — READ
// ─── Operadores de comparación
// ─── Equivalencias SQL → MongoDB
─────────────────────────────────────
────────────────────────────────
$eq igual $ne distinto
db.productos.find() // SELECT * FROM productos
$lt menor que $lte menor o igual
$gt mayor que $gte mayor o igual
db.productos.find({ precio: { $gt: 100 } })
$in [a,b] en lista $nin [a,b] no en lista
// WHERE precio > 100
// ─── Sort, Limit, Skip
db.productos.find(
─────────────────────────────────────────────
{ stock: { $gt: 0 } }, // filtro
db.productos.find().sort({ precio: -1
{ nombre: 1, precio: 1, _id: 0 }
}).limit(5).skip(10)
// proyección (1=incluir, 0=excluir)
)
// ─── findOne ── devuelve el primero o null
─────────────────────────
db.productos.findOne({ nombre: "Laptop ThinkPad X1" })
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II CRUD y Consultas
READ — Operadores Lógicos
mongosh — mongosh —
Operadores Operadores
// ─── Operadores lógicos
──────────────────────────────────────────
// Atajo: múltiples condiciones en el mismo campo → $and
db.productos.find({ $and: [{ precio: { $gt: 50 } }, {
implícito
stock: { $gt: 0 } }] })
db.productos.find({ precio: { $gt: 50, $lt: 200 } })
db.productos.find({ $or: [{ marca: "Lenovo" }, {
precio: { $lt: 30 } }] })
// ─── Operadores de elemento
─────────────────────────────────────────
db.productos.find({ precio: { $not: { $gt: 500 } } })
db.productos.find({ descuento: { $exists:
true } }) // campo existe
db.productos.find({ $nor: [{ precio: { $lt: 0 } }, {
db.productos.find({ precio: { $type:
stock: { $lt: 0 } }] })
"double" } }) // tipo BSON
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II CRUD y Consultas
READ — Operadores de Array
mongosh —
Operadores
// ─── Operadores de array ────────────────────────────────────────────
// Campo 'categorias' contiene "electrónica"
db.productos.find({ categorias: "electrónica" })
// Contiene TODOS los valores del array
db.productos.find({ categorias: { $all: ["electrónica", "computación"] } })
// El array tiene exactamente 2 elementos
db.productos.find({ categorias: { $size: 2 } })
// Al menos un elemento del array cumple la condición
db.productos.find({ categorias: { $elemMatch: { $eq: "computación" } } })
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II CRUD y Consultas
READ — Proyección, Regex y Campos Anidados
mongosh — mongosh —
Proyección y Regex Proyección y Regex
// ─── Proyección: 1 = incluir, 0 = excluir (no mezclar
salvo _id) ──
db.productos.find({}, { nombre: 1, precio: 1, _id: 0 }) // ─── Texto completo (requiere índice de texto)
// Proyectar campo anidado ─────────────────────
db.productos.find({}, { "especif.ram": 1, nombre: 1 }) db.productos.createIndex({ nombre: "text", descripcion:
"text" })
// ─── Consulta sobre campo anidado db.productos.find({ $text: { $search: "laptop lenovo",
────────────────────────────────── $language: "es" } })
db.productos.find({ "especif.ram": "16GB" })
// ─── Ordenar por relevancia en búsqueda de texto
// ─── Búsqueda por regex ───────────────────
──────────────────────────────────────────── db.productos.find(
// Nombre que empieza con "Lap" (case-insensitive) { $text: { $search: "laptop" } },
db.productos.find({ nombre: { $regex: /^Lap/i } }) { score: { $meta: "textScore" } }
db.productos.find({ nombre: { $regex: "^Lap", $options: ).sort({ score: { $meta: "textScore" } })
"i" } })
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II CRUD y Consultas
UPDATE — Modificar Documentos
mongosh — UPDATE mongosh — UPDATE
// ─── updateOne / updateMany // ─── upsert: inserta si no existe
────────────────────────────────────── ─────────────────────────────────
db.productos.updateOne( db.configs.updateOne(
{ nombre: "Mouse Inalámbrico" }, // filtro { key: "theme" }, { $set: { value: "dark" } },
{ $set: { precio: 34.99, "especif.color": "negro" } } { upsert: true }
// operador )
)
db.productos.updateMany(
{ stock: { $lt: 10 } },
{ $set: { alerta: true }, $currentDate:
{ actualizadoEn: true } }
)
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II CRUD y Consultas
UPDATE — Modificar Documentos
mongosh — UPDATE
// ─── Operadores de update más usados ──────────────────────────────
$set → asigna valor (crea el campo si no existe)
$unset → elimina campo: { $unset: { descuento: "" } }
$inc → incrementa: { $inc: { stock: -1 } }
$mul → multiplica: { $mul: { precio: 1.10 } } // +10%
$rename → renombra campo: { $rename:{ "desc": "descripcion" } }
$min / $max → actualiza si < / > { $min: { minPrecio: 10 } }
$push → agrega al array: { $push: { tags: "oferta" } }
$pull → quita del array: { $pull: { tags: "oferta" } }
$addToSet → agrega sin dupl: { $addToSet: { tags: "nuevo" } }
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II CRUD y Consultas
DELETE — Eliminar Documentos
mongosh — DELETE mongosh — DELETE
// ─── deleteOne / deleteMany ──────────────────────────
// ─── replaceOne — reemplaza el documento complete ────
db.productos.deleteOne({ nombre: "Monitor 27\"" })
// ⚠ Todo el documento es reemplazado
// elimina el primero
// (solo se conserva el _id)
db.productos.replaceOne( { _id: ObjectId("...") },
db.productos.deleteMany({ stock: { $eq: 0 } })
{ nombre: "Nuevo Producto", precio: 99.0, stock: 50 }
// elimina todos los que tienen stock 0
)
db.productos.deleteMany({})
// ─── Diferencia clave ────────────────────────────────
// vacía la colección (¡irreversible!)
// db.col.deleteMany({}) → vacía la colección, la
mantiene con sus índices
// ─── findOneAndDelete — retorna el documento eliminado
const eliminado = db.productos.findOneAndDelete(
// db.col.drop() → elimina la colección Y todos
{ precio: { $lt: 5 } },
sus índices
{ sort: { precio: 1 } } // elimina el más barato
)
printjson(eliminado)
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II CRUD y Consultas
Aggregation Pipeline
Procesamiento de datos en etapas encadenadas
La salida de cada etapa es la entrada de la siguiente. Permite transformar, filtrar, agrupar y unir colecciones con un alto rendimiento.
mongosh —
Aggregation Pipeline
db.pedidos.aggregate([
{ $match: { fecha: { $gte: new Date("2024-06-01") } } }, // 1: Filtrar
{ $lookup: { // 2: JOIN
from: "clientes", localField: "clienteId",
foreignField: "_id", as: "cliente"
}},
{ $unwind: "$cliente" }, // 3: Des-anidar
{ $group: { // 4: Agrupar
_id: "$cliente.nombre",
totalCompras: { $sum: "$total" },
cantPedidos: { $count: {} }
}},
{ $sort: { totalCompras: -1 } }, // 5: Ordenar
{ $limit: 5 } // 6: Top 5
])
💡 Poner $match al inicio es crucial — permite que el pipeline use índices y reduzca los documentos procesados por las etapas siguientes.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II CRUD y Consultas
Etapas Clave del Aggregation Pipeline
$match $project
Filtra documentos (como WHERE). Usar primero para aprovechar Selecciona/transforma campos (como SELECT). Puede crear
índices. campos calculados.
$group $sort
Agrupa por clave y aplica acumuladores: $sum, $avg, $min, $max, Ordena. Antes de $group puede afectar performance. Usar
$push, $addToSet. índices si es posible.
$limit / $skip $lookup
JOIN entre colecciones. Equivalente a LEFT OUTER JOIN. from,
Paginación. Combinados para eficiencia: $sort → $skip → $limit.
localField, foreignField, as.
$addFields/
$unwind
$set
Descompone un array en documentos individuales. Agrega campos calculados sin modificar los existentes. $set es
preserveNullAndEmptyArrays: true evita pérdidas. alias moderno.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II CRUD y Consultas
$lookup — Equivalente al JOIN Relacional
SQL JOIN vs. MongoDB $lookup
SQL MongoDB
-- SQL: LEFT JOIN simple
// MongoDB: $lookup equivalente
SELECT p.total, c.nombre AS cliente_nombre
db.pedidos.aggregate([
FROM pedidos p
{ $lookup: {
LEFT JOIN clientes c ON p.cliente_id = c.id
from: "clientes",
WHERE p.total > 100
localField: "clienteId",
v3.6+ pipeline foreignField: "_id",
lookup as: "cliente"
}},
// $lookup con pipeline (v3.6+) — más flexible y potente
{ $unwind: "$cliente" },
{ $match: { total: { $gt: 100 } } },
{ $lookup: {
{ $project: { total: 1,
from: "inventario",
cliente_nombre: "$cliente.nombre" } } ])
let: { prod_id: "$productoId" },
pipeline: [
{ $match: { $expr: { $eq: ["$_id", "$
⚠ Consideraciones:
$prod_id"] } } },
• $lookup es costoso → preferir embedding cuando sea posible
{ $project: { stock: 1, deposito: 1 } }
], • El resultado es un array: puede tener 0..N elementos
as: "inventario"
• $unwind rompe el array en documentos individuales
}}
• Usar $match antes del $lookup para reducir documentos
• No reemplaza un JOIN en consultas OLAP complejas
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II CRUD y Consultas
⚠ Errores Conceptuales Frecuentes (CRUD)
✗ "updateOne() sin operadores reemplaza el documento completo"
✔ updateOne() SIN operadores de actualización ($set, $inc, etc.) arroja error en versiones recientes. Siempre usar operadores. Para reemplazo
total, usar replaceOne() de forma explícita.
✗ "No hay operadores lógicos — hay que anidar find()"
✔ MongoDB tiene $and, $or, $not y $nor. Además, múltiples condiciones en el mismo objeto de query son un $and implícito: { a: 1, b: 2 } =
{ $and: [{a:1},{b:2}] }.
✗ "El Aggregation Pipeline solo sirve para reportes"
✔ El pipeline es el motor de consultas analíticas y también de operaciones cotidianas: $lookup para joins, $project para transformaciones,
$unwind para arrays. Con $match al inicio y buenos índices, es performante en producción.
✗ "deleteMany({}) borra la colección"
✔ deleteMany({}) vacía la colección pero la mantiene junto con sus índices. db.coleccion.drop() es lo que elimina la colección completamente,
incluyendo sus índices — operación irreversible.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

Ejercitación Práctica
Casos de negocio reales · Resolución guiada · MongoDB Compass / mongosh
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II Ejercitación
Ejercicio 1 — Sistema de Biblioteca
Nivel: Básico | Herramienta: mongosh / MongoDB Compass
📋 Contexto: Modelar una biblioteca universitaria con libros, autores y préstamos.
Consigna
// 1. Crear la BD y colección con validación de esquema
use biblioteca
db.createCollection("libros", {
validator: { $jsonSchema: {
required: ["titulo", "isbn", "disponible"],
properties: {
isbn: { bsonType: "string" },
titulo: { bsonType: "string" },
disponible: { bsonType: "bool" }
}
}}
})
// 2. Insertar 5 libros (al menos 2 con múltiples autores y géneros como arrays)
// 3. Consultar todos los libros disponibles ordenados por título ascendente
// 4. Actualizar el stock de un libro usando $inc (restar 1 en cada préstamo)
// 5. Crear un índice en 'isbn' y verificar con explain() que usa IXSCAN
// 6. Agregar campo 'ultimaPrestamo' con $currentDate a un libro específico
✅ Criterios de evaluación: uso correcto de insertMany, validación de esquema, proyección en las consultas, IXSCAN en el explain plan.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II Ejercitación
Ejercicio 2 — Análisis de Ventas con Pipeline
Nivel: Intermedio | Herramienta: MongoDB Compass — Aggregation Builder
📋 Colección 'ventas': documentos con fecha, clienteId, items (array de {producto, cantidad, precio}), vendedor, total.
Consigna —
Aggregation Pipeline
// 2a. Total vendido por vendedor en el último trimestre
// Etapas: $match → $group → $sort
// 2b. Top 3 productos más vendidos (por cantidad total)
// Etapas: $unwind(items) → $group → $sort → $limit
// 2c. Promedio de ticket por cliente con cantidad de compras
// Etapas: $group con $avg y $count → $sort → $project
// 2d. Ventas agrupadas por mes — formato { año, mes, totalFacturado }
// Etapas: $project con $year/$month → $group → $sort
// 2e. (Bonus) Clientes que compraron más de 3 veces en el mes
// Etapas: $match → $group → $match (second) → $sort
// ─── Para cada consulta: ───────────────────────────────────────────
// → Ejecutar la query y capturar los resultados
// → Proponer el índice que optimizaría cada pipeline y justificar
✅ Correcto orden de etapas (match primero), uso apropiado de $unwind y justificación del índice con explain().
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

UADE Ingeniería de Datos II Ejercitación
Ejercicio 3 — Decisión de Modelado
Nivel: Avanzado | Análisis crítico argumentado
📋 Escenario: Red social con usuarios, posts y comentarios. Cada post puede tener miles de comentarios. Los comentarios se
paginan de a 20. La funcionalidad más accedida es 'ver un post con sus primeros 20 comentarios'.
Opción A — Full Embedding
✔ 1 lectura de disco ✗ Doc > 16 MB con miles de comentarios
comments como array dentro del doc
post
Opción B — Full Reference
✔ Sin límite de comentarios ✗ JOIN ($lookup) en cada lectura de post
Colección 'comments' con postId
Opción C — Hybrid (Outlier Pattern)
✔ Balance rendimiento/escala ✗ Lógica más compleja en la app
Últimos N comentarios embebidos + flag
hasMore + referencia
🎯 Consigna: Elegir una opción y justificar en base a: patrón de acceso, frecuencia de escritura/lectura, estimación de volumen y
restricciones de MongoDB.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

💬 Preguntas de Reflexión
1. ¿Cuándo elegiría MongoDB sobre PostgreSQL para un nuevo proyecto?
💡 Pensar en: variabilidad del esquema, patrón de acceso, escalabilidad, necesidad de ACID, tipos de consultas.
2. ¿Es correcto afirmar que MongoDB 'no tiene transacciones'?
💡 Evaluar: desde qué versión existen transacciones multi-documento y qué limitaciones siguen existiendo.
3. Un cliente tiene 50 millones de documentos y una query que tarda 8 segundos. ¿Por dónde empezaría la
investigación?
💡 Secuencia: explain() → COLLSCAN vs IXSCAN → índice compuesto → shard key → hardware → query rewrite.
4. ¿Qué ventaja específica tiene el Aggregation Pipeline sobre procesar los datos en la capa de aplicación?
💡 Localidad de cómputo, reducción de tráfico de red, uso de índices en el pipeline, distribución en shards.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

| UADE | Ingeniería de Datos II | Para la próxima clase |
| ---- | ---------------------- | --------------------- |
Para la Próxima Clase
📚  Lecturas y preparación
| • Harrison (2015), Cap. 5–7 — MongoDB: arquitectura y modelado     |     |     |
| ------------------------------------------------------------------ | --- | --- |
| • Pivert (2018), Cap. 2 — Document Model: patterns y anti-patterns |     |     |
• Documentación MongoDB — sección "Data Modeling": docs.mongodb.com/manual/data-modeling
💻  Instalar MongoDB
| • MongoDB Community Server 7.x: mongodb.com/try/download/community |     |     |
| ------------------------------------------------------------------ | --- | --- |
| • MongoDB Compass (GUI): mongodb.com/products/compass              |     |     |
•
Conectar Compass a localhost:27017 y verificar la conexión
🎯  Ejercicio
Crear la BD 'ecommerce' con colecciones 'productos', 'clientes' y 'pedidos'. Insertar al menos 10 documentos coherentes en cada
colección. Resolver las queries del Ejercicio 2 (pipeline de ventas) con sus propios datos. Entregar los pipelines + capturas de
resultados.
Ingeniería de Datos II  ·  Facultad de Ingeniería y Ciencias Exactas  ·  UADE  ·  Ing. Damián Arnaudo

3 ideas clave para llevarse de la Clase 3
El documento como unidad central
1
MongoDB almacena datos en documentos BSON autocontenidos. Cada documento puede tener arrays, sub-
documentos y tipos ricos. Esto elimina la mayoría de los JOINs — a cambio de posible redundancia controlada.
Modelado según el patrón de acceso
2
El esquema en MongoDB no se define en base a relaciones abstractas sino a cómo la aplicación usa los datos.
Embedding si siempre se leen juntos; referencing si la entidad se comparte o crece ilimitadamente.
CRUD es el comienzo — el pipeline es el poder
3
Las operaciones CRUD son necesarias pero el verdadero potencial está en el Aggregation Pipeline: $match, $group,
$lookup, $unwind, $project permiten ETL, joins, reportes y transformaciones complejas.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

C L A S E 3
Bases de Datos Documentales
y MongoDB
¿Preguntas?
Ing. Damián Arnaudo · 1er Cuatrimestre 2026 · Facultad de Ingeniería y Ciencias Exactas — UADE
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo