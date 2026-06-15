Facultad de Ingeniería y Ciencias Exactas
Dpto. Tecnología Informática
CLASE 1
Relacional
vs NoSQL
ACID · Bloqueos · BASE · Big Data · Principios de Selección
Ing. Damián Arnaudo · 1er Cuatrimestre 2026 · 9 de Marzo

Agenda de Hoy — 3h 30min
Clase 1
0:00–0:15 1 Bienvenida + presentación de la materia
0:15–0:50 2 RDBMS: características, ACID y bloqueos
0:50–1:30 3 ¿Por qué NoSQL? Big Data + historia
1:30–1:45 4 ☕ Break
1:45–2:25 5 NoSQL: concepto, BASE, ventajas/límites
2:25–3:05 6 Relacional vs NoSQL — principios de selección
3:05–3:30 7 Cierre y preguntas
BD II · Clase 1 · Relacional vs NoSQL · UADE · Ing. Damián Arnaudo

01
RDBMS
¿Qué garantiza una BD relacional?
Ingeniería de Datos II · UADE

💬 DEBATE
🐢
¿Cuándo dijiste por última vez
"esta base de datos es lenta"?
Spoiler: casi siempre hay una razón de diseño detrás — no es culpa del motor.
BD II · Clase 1 · UADE

DBMS Relacional — ¿Qué garantiza?
Unidad I
Modelo estándar Integridad ACID
⊞ ✔
Tablas con relaciones. Lenguaje SQL estandarizado (ISO). Atomicidad, Consistencia, Aislamiento, Durabilidad — la
Portabilidad entre motores. garantía más robusta.
Independencia Seguridad
⊙ 🔒
El esquema lógico (tablas) es independiente del físico Control de acceso granular, auditoría de operaciones,
(archivos, índices en disco). recuperación ante fallos.
BD II · Clase 1 · Relacional vs NoSQL · UADE · Ing. Damián Arnaudo

Propiedades ACID — Con ejemplos reales
Unidad I
|     | Atomicidad  |     | Consistencia                  |
| --- | ----------- | --- | ----------------------------- |
| A   | TODO o NADA | C   | Estado válido → Estado válido |
Ej: Transferencia: falla el débito → no hay crédito Ej: Venta con stock = 0 → viola restricción → rollback
|     | Aislamiento          |     | Durabilidad               |
| --- | -------------------- | --- | ------------------------- |
|     | Cada tx trabaja sola |     | COMMIT = persiste siempre |
| I   |                      | D   |                           |
Ej: Tx A y Tx B leen el mismo saldo → ven el original Ej: Server cae después del COMMIT → datos intactos
BD II  ·  Clase 1  ·  Relacional vs NoSQL  ·  UADE  ·  Ing. Damián Arnaudo

⚡ DESAFÍO ¿Cuál propiedad ACID garantiza esto?
Un sistema bancario ejecuta una transferencia de $5.000 entre dos cuentas.
A mitad del proceso, el servidor se cae. Al reiniciar, ninguna cuenta fue afectada.
¿Qué propiedad ACID garantizó este comportamiento?
Consistencia — la BD pasó de un estado válido a AAttoommiicciiddaadd —— ttooddoo oo nnaaddaa,, llaa ttxx n noo s see c coommpplelettóó ✓
A B
otro
C Aislamiento — otra tx no pudo interferir D Durabilidad — los datos persisten ante fallos
💡 Atomicidad: la transacción no se completó → se revirtió completamente (rollback). Consistencia hubiera sido si SE completó y
mantuvo las reglas de negocio.
BD II · Clase 1 · UADE

Bloqueos, Granularidad y el Costo de ACID
Unidad I
Compartido (Shared)
Múltiples tx leen simultáneamente. Bloquea escrituras.
Exclusivo (Exclusive)
Una tx lee y escribe. Bloquea todo lo demás.
Deadlock Scale-up vs Scale-out → esto nos va a importar mucho en NoSQL
Dos tx se esperan mutuamente. El DBMS detecta y aborta
una.
Fila Clave Página Extent Tabla Base de datos
← más fino / más concurrencia más conflictos / más grueso →
BD II · Clase 1 · Relacional vs NoSQL · UADE · Ing. Damián Arnaudo

02
¿Por qué NoSQL?
Big Data, historia y el límite de los RDBMS
Ingeniería de Datos II · UADE

¿Por qué los RDBMS tienen límites a escala?
Unidad I
💬 ¿Alguien trabajó con una BD que se volvió lenta? ¿Qué pasaba?
01 Gestión de Logs 02 Control de Concurrencia 03 Transacciones Distribuidas
Redo log + Undo log. Cada write va a Bloqueos para coordinar acceso Protocolo 2PC suma latencia en entornos
disco dos veces. simultáneo. A escala = cuello de botella. distribuidos.
04 Buffer Pool 05 Integridad Compleja 06 Malos Diseños ⚠
Gestión de páginas en memoria. Tamaño Triggers, FKs, constraints → overhead en La causa #1 en producción: índices
y política impactan directamente. cada operación. faltantes, JOINs sin optimizar.
BD II · Clase 1 · Relacional vs NoSQL · UADE · Ing. Damián Arnaudo

Big Data — El contexto que impulsó NoSQL
Unidad I
Las 3 Vs
Volumen
TB → PB generados por segundo a escala global
Velocidad
Tiempo real: IoT, redes sociales, finanzas
Variedad
Quiénes lo impulsaron:
SQL + JSON + XML + audio + video + texto libre
| Google   | Amazon | Facebook  | LinkedIn  | Twitter |
| -------- | ------ | --------- | --------- | ------- |
| Bigtable | Dynamo | Cassandra | Voldemort | FlockDB |
| 2004     | 2007   | 2008      | 2009      | 2010    |
BD II  ·  Clase 1  ·  Relacional vs NoSQL  ·  UADE  ·  Ing. Damián Arnaudo

💬 DEBATE
📸
Están construyendo Instagram desde cero.
¿Qué usarían para guardar las fotos y sus
metadatos?
Pensar en: escala (miles de millones de fotos), velocidad de subida,
variedad de metadatos (tags, filtros, ubicación)
BD II · Clase 1 · UADE

03
NoSQL
Concepto, BASE y los 4 modelos
Ingeniería de Datos II · UADE

De "No SQL" a "Not Only SQL"
Unidad I
1998 2009 Hoy
Eric Evans lo reinstala para BD "Not Only SQL": BD que
Carlo Strozzi lo acuña para una
no relacionales en una meetup difieren del modelo
BD relacional sin interfaz SQL.
en San Francisco. El término relacional en estructura y
(Ironía: era relacional!)
explota. mecanismo de acceso.
⚠ Error clásico: Creer que "NoSQL = sin SQL". CQL de Cassandra, N1QL de Couchbase son casi SQL. La diferencia real es el
modelo de datos.
BD II · Clase 1 · Relacional vs NoSQL · UADE · Ing. Damián Arnaudo

Los 4 Grandes Modelos NoSQL
Unidad II — Adelanto
💬  ¿Con cuál de estos motores ya trabajaron o escucharon?
📄  Documental MongoDB · CouchDB 🔑  Clave–Valor Redis · DynamoDB
Documentos JSON/BSON. Esquema flexible. Ideal para  Par key-value ultra-simple. Extremadamente rápido. Caché,
| catálogos, perfiles, contenido. | sesiones, configuración. |                 |
| ------------------------------- | ------------------------ | --------------- |
| ⬡  Tabular                      | 🕸  Grafos                | Neo4j · Amazon  |
Cassandra · HBase
Neptune
Filas con columnas dinámicas. Escala masiva. Series de  Nodos + relaciones. Redes sociales, recomendaciones,
| tiempo, logs, analítica. | detección de fraude. |     |
| ------------------------ | -------------------- | --- |
BD II  ·  Clase 1  ·  Relacional vs NoSQL  ·  UADE  ·  Ing. Damián Arnaudo

Modelo BASE — La Alternativa a ACID
Unidad I
Mientras ACID prioriza consistencia, BASE prioriza disponibilidad y escala
BA S E
Basically Available Soft State Eventually Consistent
Disponibilidad garantizada aunque El estado del sistema puede cambiar sin El sistema convergirá a un estado
algunos nodos fallen o datos sean nuevas entradas (propagación de consistente en algún momento futuro,
temporalmente inconsistentes. actualizaciones entre réplicas). una vez que paren las actualizaciones.
ACID vs BASE — No son opuestos:
ACID = corrección estricta (pagos, banca). BASE = escala y velocidad (redes sociales, IoT). La elección es arquitectural — depende
del caso de uso, no de la tecnología.
BD II · Clase 1 · Relacional vs NoSQL · UADE · Ing. Damián Arnaudo

⚡ DESAFÍO ¿Qué garantía da BASE que ACID no puede a escala?
Una app de chat tiene 50 millones de usuarios activos. Cada mensaje se guarda en múltiples
servidores en distintos países.
¿Qué garantía prioriza BASE que permite que esto escale?
Consistencia — todos los servidores ven el  Durabilidad — el mensaje nunca se pierde aunque
| A                        | B   |                   |
| ------------------------ | --- | ----------------- |
| mensaje instantáneamente |     | el servidor caiga |
DDiissppoonniibbiilliiddaadd  ——  eell  ssiisstteemmaa r reessppoonnddee a auunnqquuee   Atomicidad — el mensaje se envía completo o no
| C                                | D             |          |
| -------------------------------- | ------------- | -------- |
| aallggúúnn  nnooddoo  ffaallllee |             ✓ | se envía |
💡  Disponibilidad (A en CAP): el sistema responde aunque algún nodo esté caído. A cambio, otro usuario puede ver el mensaje
con un pequeño retraso (consistencia eventual).
BD II  ·  Clase 1  ·  UADE

04
Relacional
vs NoSQL
Principios de selección y Teorema CAP
Ingeniería de Datos II · UADE

La Diferencia Fundamental — El Dato como
Unidad I
Unidad
RDBMS: fragmenta NoSQL: une
Factura → tabla clientes + tabla items + tabla impuestos. Factura = documento JSON completo. Recuperar = una sola
Recuperar = JOIN costoso. lectura por key. Sin JOIN.
BD II · Clase 1 · Relacional vs NoSQL · UADE · Ing. Damián Arnaudo

¿Cuándo usar NoSQL? — Principios de Selección
Unidad I
💬 Caso: app de delivery en tiempo real. ¿Qué elegirían para pedidos activos? ¿Y para el historial?
✔ Elegir NoSQL cuando… ✗ Preferir RDBMS cuando…
Control ACID no es crítico Transacciones ACID (pagos, banca)
JOINs no son necesarios Consultas complejas con JOINs
Alta escalabilidad horizontal Informes y reportes analíticos
Esquema cambia con frecuencia Esquema estable y bien definido
Volúmenes masivos + alta escritura Equipo sin exp. en NoSQL
🔀 Persistencia Políglota (tendencia actual):
Combinar RDBMS + NoSQL según el componente: RDBMS para tx · Redis para caché · MongoDB para contenido · Neo4j para
recomendaciones
BD II · Clase 1 · Relacional vs NoSQL · UADE · Ing. Damián Arnaudo

Teorema CAP — Intro (Unidad IV en detalle)
Unidad I → IV
Un sistema distribuido solo puede garantizar 2 de estos 3:
Consistency
C
Todos los nodos ven los mismos datos al mismo tiempo.
Availability
A
Toda solicitud recibe respuesta (aunque no sea la última
versión).
Partition Tolerance
P
El sistema funciona aunque haya pérdida de mensajes
entre nodos.
📅 Lo vemos en detalle: Clase 2 / Unidad IV
BD II · Clase 1 · Relacional vs NoSQL · UADE · Ing. Damián Arnaudo

💬 DEBATE
🏢
Su empresa actual o proyecto final:
¿Qué componente se beneficiaría de NoSQL?
¿Qué modelo usarían?
Documental · Clave-Valor · Tabular · Grafos — y por qué, no solo cuál.
BD II · Clase 1 · UADE

Errores Conceptuales Frecuentes
¡Ojo!
"NoSQL reemplaza a los RDBMS"
NoSQL complementa. En arquitecturas modernas
✗ ✔
coexisten. Cada uno tiene su dominio.
"NoSQL siempre es más rápido" En lecturas masivas no transaccionales, sí. En
✗ ✔
consultas complejas, un RDBMS optimizado suele
ganar.
"BASE = sin consistencia"
BASE garantiza consistencia eventual. Los datos
✗ ✔
convergen. No son incorrectos para siempre.
"NoSQL no usa índices ni claves"
Todos los motores NoSQL usan claves e índices. La
✗ ✔
diferencia está en su estructura.
BD II · Clase 1 · Relacional vs NoSQL · UADE · Ing. Damián Arnaudo

Resumen
RDBMS son robustos pero costosos a escala
1
ACID, bloqueos y transacciones distribuidas generan cuellos de botella con millones de registros.
NoSQL nació para resolver problemas de escala real
2
Google, Amazon, Facebook crearon soluciones propias. Big Data aceleró la adopción masiva.
BASE ≠ sin consistencia — es una elección arquitectural
3
Consistencia eventual permite escala y disponibilidad. La elección depende del caso de uso.
📚 Para la próxima (16-mar):
Harrison (2015) Cap. 1-2 · db-engines.com/en/ranking · Traigan: ¿qué BD usan en su trabajo/proyecto y por qué?

?
Preguntas y Consultas
Ing. Damián Arnaudo · darnaudo@uade.edu.ar · Ingeniería de Datos II · UADE