I N G E N I E R Í A D E D A T O S I I
Clase 4 · Unidad II
Bases de Datos
Orientadas a Grafos
Introducción a Neo4j · Modelo y Cypher
Ing. Damián Arnaudo · 1er Cuatrimestre 2026 · Facultad de Ingeniería y Ciencias Exactas — UADE

Agenda — Clase 4
1. Pregunta disparadora
2. ¿Qué es una base de datos de grafos?
3. Conceptos clave: Nodo · Relación · Propiedad · Traversal
4. Grafos vs. Modelo Relacional
5. ¿Cuándo usar (y NO usar) grafos?
6. Introducción a Neo4j: Arquitectura y modelo de datos
7. Introducción a Cypher: CREATE · MATCH · RETURN · SET · DELETE
8. Caso guiado + Ejercicio práctico + Cierre
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

❓ PR EGUNTA DISPAR ADOR A
Red social: 100 millones de usuarios.
¿Cuántos JOINs necesitás para encontrar
los amigos de amigos de amigos de Juan?
SELECT u3.name FROM users u1 JOIN friendships f1 ON u1.id=f1.user_id
JOIN users u2 ON f1.friend_id=u2.id JOIN friendships f2 ON u2.id=f2.user_id JOIN users u3 ...
A 6 grados de separación: ¿sigue siendo viable?
Los JOINs en SQL crecen exponencialmente con la profundidad de las relaciones. Las bases de grafos resuelven exactamente este
problema.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

Ubicación en el programa — Unidad II: Modelos NoSQL
| Documental | Clave/Valor | Grafos | Tabular   |
| ---------- | ----------- | ------ | --------- |
| MongoDB    | Redis       | Neo4j  | Cassandra |
| ✓ Vista    |             | ← HOY  |           |
En grafos, las relaciones son ciudadanos de primera clase — se almacenan físicamente, no se calculan.
Conexión con Clase 2: Neo4j en standalone es CP (Consistencia + Partition tolerance). En cluster usa consistencia causal basada en
protocolo Raft. Lo veremos hoy.
Ingeniería de Datos II  ·  Facultad de Ingeniería y Ciencias Exactas  ·  UADE  ·  Ing. Damián Arnaudo

01
¿Qué es una Base de Datos de Grafos?
Del concepto matemático al almacenamiento eficiente

¿Qué es una base de datos de grafos?
Definición
Sistema de base de datos que usa estructuras de grafo — nodos, relaciones y propiedades — para representar y almacenar
información, optimizando el traversal de conexiones.
○ → {} ⟳
Nodo Relación Propiedad Traversal
Entidad del dominio Conexión con dirección Atributo de nodo Recorrido del grafo
Ej: Persona, Producto, Ciudad y significado semántico o de relación siguiendo relaciones
Analogía: Un grafo es como un mapa de metro — las estaciones son nodos, las líneas son relaciones, y el color de línea es una propiedad
de la relación.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

Nodos — La entidad del dominio
• Representan entidades del mundo real (Persona,
:Person
Empresa, Producto)
:Company
• Equivalente conceptual a una fila en una tabla SQL
name: 'Ana'
• Pueden tener múltiples etiquetas (labels) simultáneas
edad: 28 name: 'ACME'
• Almacenan propiedades como pares clave:valor ciudad: 'BsAs'
• Son el punto de inicio de todo traversal
• Un nodo con múltiple labels:
(ana:Person:Employee:Blogger) — todas simultáneas
⚠ Error conceptual frecuente
"Los nodos son como tablas" → INCORRECTO. Un nodo es más parecido a una FILA. Las tablas son los labels. Un nodo puede pertenecer a
múltiples 'tablas' (labels) simultáneamente — algo imposible en SQL.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

Relaciones — El corazón del modelo de grafos
• Siempre tienen dirección (de → hacia)
• Siempre tienen un tipo/nombre obligatorio
• También pueden tener propiedades (peso, fecha,
contexto)
• Son objetos de primera clase — no derivados como los
ACME
Ana TRABAJA_EN
:Company
JOINs :Person since:2022
• Se almacenan físicamente como registros con
punteros directos a nodos origen y destino
• Traversal costo O(1) por relación vs O(n) de un JOIN en SQL
⚠ Error frecuente
"Las relaciones en grafos son como foreign keys"
→ FALSO. Las FK son solo un número (ID). En grafos, la relación es una estructura almacenada físicamente con punteros bidireccionales. No
requieren búsqueda de índice: el traversal es directo.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

Propiedades y Traversal
Propiedades Traversal
• Pares clave-valor en nodos y relaciones • Recorrer el grafo siguiendo relaciones
• Tipos: string, number, boolean, date, lista • Punto inicio → seguir aristas → destino
• No requieren esquema previo (schema-free) • Costo O(1) por salto (puntero directo)
• Nulos no se almacenan (ausencia = no existe la prop) • Base de: camino más corto, comunidades, recomendaciones
MATCH (ana:Person {name:'Ana'})-[:TRABAJA_EN]->(emp)-[:RADICADA_EN]->(ciudad) RETURN ciudad.nombre
Este traversal: Ana → su empresa → ciudad de la empresa. En SQL: 2 JOINs + índices. En grafos: 2 punteros directo.
Analogía del traversal: seguir hipervínculos en la web. Partís de una página (nodo), hacés clic (relación) y llegás a otra. PageRank de
Google mapea este grafo de links.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

02
Grafos vs. Modelo Relacional
¿Cuándo cambia el juego?

Grafos vs. Relacional — Comparación estructural
|     | Aspecto       |                         | Relacional (SQL) |                           | Grafos (Neo4j)  |
| --- | ------------- | ----------------------- | ---------------- | ------------------------- | --------------- |
|     | Unidad básica |                         | Tabla / Fila     |                           | Nodo / Relación |
|     | Relaciones    | JOIN calculado en query |                  | Puntero físico almacenado |                 |
Esquema Estricto · DDL obligatorio Flexible · Schema-optional
Consultas profundas Degradación O(n²) Constante O(1) por arista
| Lenguaje de consulta |     |     | SQL |     | Cypher (openCypher) |
| -------------------- | --- | --- | --- | --- | ------------------- |
Mejor caso de uso Datos tabulares uniformes Datos altamente conectados
Regla práctica (Harrison, 2015): si las relaciones son tan importantes como los datos, usá grafos. Si los datos son lo central, usá SQL.
Ingeniería de Datos II  ·  Facultad de Ingeniería y Ciencias Exactas  ·  UADE  ·  Ing. Damián Arnaudo

El problema de JOIN en profundidad — Ejemplo real
Caso: Amigos de amigos de Ana (2 niveles)
SQL — 2 niveles Cypher — 2 niveles
SELECT DISTINCT u3.name
FROM users u1
JOIN friendships f1
MATCH
ON u1.id = f1.user_id
(ana:Person {name:'Ana'})
JOIN users u2
-[:AMIGA_DE*2]->
ON f1.friend_id = u2.id
(fof:Person)
JOIN friendships f2
WHERE fof <> ana
ON u2.id = f2.user_id
RETURN DISTINCT fof.name
JOIN users u3
ON f2.friend_id = u3.id
WHERE u1.name = 'Ana'
A 6 niveles → 6 JOINs adicionales, degradación exponencial A 6 niveles → solo cambiar *2 por *6
💡 La profundidad del traversal en Neo4j no afecta la complejidad del código ni la estructura de la consulta.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

03
¿Cuándo Usar (y No Usar) Grafos?
Criterios de selección técnica

Casos de uso ideales para grafos
Redes Sociales Recomendaciones Detección de Fraude
Amigos, seguidores, influencers. Consultas 'Compraron esto también…' Patrones de Anillos de fraude. Patrones de transacciones
de comunidad y camino más corto. comportamiento compartido entre nodos. y entidades relacionadas en tiempo real.
Gestión de Identidad Knowledge Graphs Supply Chain
Google Knowledge Graph, Wikidata.
Quién tiene acceso a qué recurso, a través Rutas de distribución, dependencias de
Relacionan conceptos de múltiples
de qué roles y grupos jerárquicos. componentes, impacto de fallas en cadena.
dominios.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

¿Cuándo NO usar una base de datos de grafos?
Grafos no son la solución universal — hay casos donde otras BD son superiores:
✗ Datos puramente tabulares
Alternativa:
PostgreSQL / MySQL
Ej: reportes contables, planillas de nómina → SQL es superior
✗ Volúmenes masivos sin relaciones
Alternativa:
Cassandra / InfluxDB
Ej: logs de sistema, series de tiempo → escalado horizontal simple
✗ Búsqueda full-text
Alternativa:
Elasticsearch
Ej: búsqueda de texto libre en documentos → indexado invertido
✗ Transacciones masivamente concurrentes
Alternativa:
PostgreSQL / MySQL
Ej: sistemas POS, e-commerce de alta frecuencia
✗ Datos sin estructura de relación
Alternativa:
MongoDB
Ej: almacenar JSON sin traversal necesario
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

✏ MINI EJERCICIO — Debate en clase
Para cada sistema: ¿qué modelo de BD elegirías y por qué?
Sistema de inventario para cadena de supermercados (productos, stock, sucursales)
A
Pista: ¿Hay relaciones complejas entre entidades?
Red de colaboración científica: investigadores, papers, co-autoría, citaciones cruzadas
B
Pista: ¿Cuántos niveles de conexión interesan?
Detección de cuentas falsas en red social: patrones de comportamiento, conexiones sospechosas
C
Pista: ¿Qué define un patrón de fraude?
Plataforma de e-commerce: catálogo, órdenes, pagos, historial de compras
D
Pista: ¿El traversal profundo agrega valor?

04
Introducción a Neo4j
Arquitectura, ediciones y entorno de trabajo

Neo4j — ¿Qué es?
• Base de datos de grafos open source (licencia GPL/AGPL)
| • Implementada  |     | en  Java  | —  disponible  | en  | Linux,  macOS,  |     |     |     |     |
| --------------- | --- | --------- | -------------- | --- | --------------- | --- | --- | --- | --- |
Windows
| • Modelo:  | Property  | Graph  | (grafos  | con  propiedades  |     | en  |      |      |      |
| ---------- | --------- | ------ | -------- | ----------------- | --- | --- | ---- | ---- | ---- |
|            |           |        |          |                   |     |     | ACID | Raft | Bolt |
nodos y relaciones)
•
| Lenguaje  | de  | consulta  | nativo:  | Cypher  | (estándar  |     |               |           |           |
| --------- | --- | --------- | -------- | ------- | ---------- | --- | ------------- | --------- | --------- |
|           |     |           |          |         |            |     | transacciones | protocolo | protocolo |
openCypher)
|     |     |     |     |     |     |     | completas | de consenso | de conexión |
| --- | --- | --- | --- | --- | --- | --- | --------- | ----------- | ----------- |
• ACID compliant — soporte transaccional complete
•
| Documentación  |     | oficial:  | neo4j.com/docs  |     | —  siempre  |     |     |     |     |
| -------------- | --- | --------- | --------------- | --- | ----------- | --- | --- | --- | --- |
consultar para versión actual
Ediciones
Community: 1 DB usuario, sin clustering. Ideal para desarrollo y esta cursada.
Enterprise: Múltiples DBs, clustering, seguridad avanzada, soporte oficial.
AuraDB: Cloud gestionado. Para producción sin operaciones.
Ingeniería de Datos II  ·  Facultad de Ingeniería y Ciencias Exactas  ·  UADE  ·  Ing. Damián Arnaudo

Arquitectura de Neo4j — Componentes clave
Capa de Aplicación
Neo4j Browser · Drivers (Java/Python/JS) · REST API · Bolt Protocol
DBMS Core
Motor de grafos · Query Planner · Cypher Runtime · Transaction Manager
Storage Engine
Node Store · Relationship Store · Property Store · Label Store · Index Store
Clustering (Enterprise)
Core Servers (escritura, Raft) · Read Replicas (lectura escala) · Causal Consistency
Clave: Neo4j almacena nodos y relaciones como registros de tamaño fijo con punteros directos. Traversal = seguir punteros, no buscar en
índices.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

Neo4j Browser — Entorno de trabajo en clase
• Interfaz web incluida en Neo4j (puerto 7474 por defecto)
• Ejecuta consultas Cypher de forma interactiva
• Visualiza grafos de forma gráfica, en tabla o JSON
• Conecta al motor vía protocolo Bolt (puerto 7687)
• Incluye guías interactivas de aprendizaje (:play intro)
• Alternativa cloud: sandbox.neo4j.com — sin instalación, con datasets
precargados
Comandos del Browser (no son Cypher):
:play intro // tutorial interactivo paso a paso
:server connect // conectar a base de datos
:clear // limpiar pantalla
:help // ayuda completa
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

05
Introducción a Cypher
El lenguaje de consulta de Neo4j

Cypher — ¿Qué es?
• Lenguaje declarativo de consulta para grafos
• Creado por Neo4j, hoy estándar openCypher (open source)
• Sintaxis 'ASCII art': los patrones se escriben como se ven
• Describe QUÉ buscar, no CÓMO recorrer el grafo
• Documentación: neo4j.com/docs/cypher-manual/current/
Anatomía básica de Cypher:
(n) ← nodo, variable 'n'
(n:Person) ← nodo con label Person
(n:Person {name:'Ana'}) ← nodo con propiedad
(a)-[:CONOCE]->(b) ← relación dirigida tipo CONOCE
(a)-[r:CONOCE {since:2020}]->(b) ← relación con propiedad y alias
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

Cypher — CREATE: creando nodos
Crear nodos
// Nodo con label y propiedades
CREATE (p:Person {name: 'Ana', edad: 28, ciudad: 'Buenos Aires'})
// Múltiples nodos en un solo CREATE
CREATE
(ana:Person {name: 'Ana', edad: 28}),
(luis:Person {name: 'Luis', edad: 35}),
(uba:University {name: 'UBA', fundacion: 1821})
// Nodo con múltiples labels
CREATE (emp:Person:Employee:Manager {name: 'Pedro', nivel: 3})
⚠ IMPORTANTE: CREATE siempre crea un nodo nuevo, aunque ya exista otro con las mismas propiedades.
Para crear solo si no existe → usar MERGE (Clase 5). Para esta clase usamos CREATE directo sobre bases limpias.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

Cypher — CREATE: creando relaciones
// Primero MATCH los nodos, luego CREATE la relación
MATCH (ana:Person {name: 'Ana'}), (luis:Person {name: 'Luis'})
CREATE (ana)-[:CONOCE]->(luis)
// Relación con propiedades
MATCH (ana:Person {name: 'Ana'}), (uade:University {name: ‘UADE'})
CREATE (ana)-[:ESTUDIA_EN {desde: 2018, carrera: 'Informática'}]->(uade)
// Crear nodos Y relación en un solo bloque
CREATE
(pedro:Person {name: 'Pedro'}),
(tech:Company {name: 'TechCorp'}),
(pedro)-[:TRABAJA_EN {rol: 'Dev', desde: 2022}]->(tech)
Convenciones de Cypher:
• Tipos de relación: MAYÚSCULAS con guion bajo (TRABAJA_EN, AMIGO_DE) • Labels de nodo: PascalCase (Person, Company)
• Propiedades: camelCase (firstName, birthYear)
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

Cypher — MATCH + RETURN: consultando el grafo
// Todos los nodos (cuidado en grafos grandes)
MATCH (n) RETURN n
// Todos los nodos con label Person
MATCH (p:Person) RETURN p
// Proyección: solo atributos específicos (como SELECT col en SQL)
MATCH (p:Person) RETURN p.name AS Nombre, p.edad AS Edad
// Filtrar con condición de propiedad
MATCH (p:Person {ciudad: 'Buenos Aires'}) RETURN p.name
// Traversal: personas que Ana CONOCE
MATCH (ana:Person {name: 'Ana'})-[:CONOCE]->(otro:Person)
RETURN otro.name AS Conocidos
RETURN puede devolver: nodos, relaciones, propiedades, alias, expresiones calculadas y colecciones. Profundizamos en Clase 5.
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

Cypher — SET y DELETE
SET — Actualizar DELETE — Eliminar
// Modificar propiedad
// Eliminar nodo SIN relaciones
MATCH (p:Person {name:'Ana'})
MATCH (p:Person {name:'Luis'})
SET p.email = 'ana@mail.com'
DELETE p
RETURN p
// Eliminar una relación
// Agregar label al nodo
MATCH (:Person {name:'Ana'})
MATCH (p:Person {name:'Ana'})
-[r:CONOCE]->()
SET p:Employee
DELETE r
// Múltiples propiedades
// Eliminar nodo Y sus relaciones
MATCH (p:Person {name:'Ana'})
MATCH (p:Person {name:'Luis'})
SET p.ciudad = 'Rosario',
DETACH DELETE p
p.edad = 29
// Limpiar TODO el grafo
// Reemplazar todas las propiedades
MATCH (n) DETACH DELETE n
MATCH (p:Person {name:'Ana'})
SET p = {name:'Ana', edad:29}
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

Caso Guiado — Red social mínima: paso a paso
Construir un mini grafo con 3 personas y sus amistades.
// PASO 1 — Crear nodos
CREATE
(ana:Person {name:'Ana', edad:28}),
(luis:Person {name:'Luis', edad:35}),
(maria:Person{name:'María', edad:22})
// PASO 2 — Crear relaciones
MATCH (ana:Person {name:'Ana'}), (luis:Person {name:'Luis'})
CREATE (ana)-[:AMIGA_DE]->(luis), (luis)-[:AMIGO_DE]->(ana)
MATCH (ana:Person {name:'Ana'}), (maria:Person {name:'María'})
CREATE (ana)-[:AMIGA_DE]->(maria)
// PASO 3 — Amigos de Ana
MATCH (ana:Person {name:'Ana'})-[:AMIGA_DE]->(amigo)
RETURN amigo.name AS Amigos
// PASO 4 — Amigos de amigos de Ana
MATCH (ana:Person {name:'Ana'})-[:AMIGA_DE*2]->(fof)
RETURN DISTINCT fof.name AS AmigosDeAmigos
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

✏ EJERCICIO PRÁCTICO 1 — Nivel Básico
Sistema Universitario
Una universidad modela relaciones entre estudiantes, cursos y profesores usando Neo4j.
1 Crear 2 nodos :Student (Carlos, leg:101 y Laura, leg:102)
2 Crear 2 nodos :Course (BD2, creditos:4 y Redes, creditos:3)
3 Crear 1 nodo :Professor (Dra. García, especialidad:'Datos')
4 Crear relaciones INSCRIPTO_EN de cada estudiante a ambos cursos
5 Crear relación DICTA de la profesora al curso BD2
6 Consultar: ¿Qué cursos cursa Carlos?
7 Consultar: ¿Qué estudiantes comparten profesor con Carlos?

Errores conceptuales frecuentes — Para no cometer
✗ CREATE (a:Person {name:'Ana'})-[:CONOCE]->(b:Person
→ CREATE crea nuevos nodos aunque pongas
{name:'Luis'})
propiedades de nodos existentes. Siempre MATCH +
✓ MATCH (a:Person {name:'Ana'}), (b:Person {name:'Luis'}) CREATE.
CREATE (a)-[:CONOCE]->(b)
✗ MATCH (n) DELETE n // nodo con relaciones → DELETE sola falla si el nodo tiene relaciones. DETACH
DELETE elimina nodo y todas sus relaciones.
✓ MATCH (n) DETACH DELETE n
✗ MATCH (p:person) RETURN p // ¿funciona igual? → Labels, tipos de relación y propiedades son todos
case-sensitive. :person ≠ :Person. Convención:
PascalCase para labels.
✓ MATCH (p:Person) RETURN p // labels son CASE-SENSITIVE
Ingeniería de Datos II · Facultad de Ingeniería y Ciencias Exactas · UADE · Ing. Damián Arnaudo

Resumen — Clase 4
1 Los grafos son ideales cuando las RELACIONES son tan importantes como los datos.
2 Nodo + Relación + Propiedad: el tridente del Property Graph. El traversal es O(1) por arista.
3 Neo4j: ACID, lenguaje Cypher, almacenamiento físico de relaciones. Muy superior en consultas profundas.
4 Cypher básico: CREATE para escribir · MATCH para buscar · RETURN para proyectar · SET/DELETE para modificar.
Próxima clase: Cypher avanzado · Modelado · Casos reales · Neo4j en profundidad