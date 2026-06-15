<!-- Slide number: 1 -->

INGENIERÍA DE DATOS II  ·  UNIDADES V–VI

![preencoded.png](Image0.jpg)
Persistencia
Polimórfica,
Big Data
& Hadoop
Clase 12  ·  3h 30min

Ing. Damián Arnaudo  |  UADE · FICE

### Notes:

<!-- Slide number: 2 -->
Agenda de la clase

Bloque 1 · 0:00–1:00

![preencoded.png](Image0.jpg)
Persistencia Polimórfica

Bloque 2 · 1:00–1:45

![preencoded.png](Image1.jpg)
¿Qué es Big Data? El problema de escala

Descanso · 1:45–2:00

![preencoded.png](Image2.jpg)
⏸  Break

Bloque 3 · 2:00–3:00

![preencoded.png](Image3.jpg)
Apache Hadoop — Core & Ecosistema

Bloque 4 · 3:00–3:30

![preencoded.png](Image4.jpg)
Casos reales, debates y cierre
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 3 -->

BLOQUE 1

![preencoded.png](Image0.jpg)
Persistencia
Polimórfica
Unidad V  —  Acceso desde aplicaciones y Frameworks de persistencia
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 4 -->
El problema: múltiples bases de datos en una aplicación

Escenario real

![preencoded.png](Image0.jpg)
MongoDB guarda perfiles de usuario
Neo4j gestiona relaciones sociales
Redis mantiene sesiones y cachés
Cassandra registra eventos de actividad
PostgreSQL persiste datos financieros
¿Cómo accede la
aplicación a todas
sin acoplarse a cada
implementación?
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 5 -->
Persistencia Polimórfica — Definición

Capacidad de una aplicación de persistir y recuperar datos utilizando
múltiples tecnologías de almacenamiento de manera transparente,
mediante una capa de abstracción uniforme.

![preencoded.png](Image0.jpg)

![preencoded.png](Image1.jpg)

![preencoded.png](Image2.jpg)
Abstracción
Intercambiabilidad
Polimorfismo
La lógica de negocio ignora qué motor subyace
Se puede cambiar el motor sin reescribir la app
Un mismo contrato, múltiples implementaciones concretas
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 6 -->
Arquitectura en capas — Repository Pattern

Lógica de Negocio / Servicios
Solo conoce interfaces

![preencoded.png](Image0.jpg)

Repository Interface
Contrato genérico de persistencia

![preencoded.png](Image1.jpg)

Repository Impl. (MongoDB / Redis / Neo4j…)
Implementación concreta por motor

![preencoded.png](Image2.jpg)

Driver / ODM / OGM
Mongoose, Spring Data, Neo4j Driver…

![preencoded.png](Image3.jpg)

Motor de Base de Datos
MongoDB · Redis · Neo4j · Cassandra
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 7 -->
Repository Pattern — Ejemplo Java/Spring Data

Interface genérica
Uso en servicio
public interface UserRepository<T, ID> {
  T findById(ID id);
  void save(T entity);
  void delete(ID id);
  List<T> findAll();
}

// Impl. MongoDB
@Repository
public class MongoUserRepo
    implements UserRepository<User, String> {
  @Autowired MongoTemplate mongo;
  public User findById(String id) {
    return mongo.findById(id, User.class);
  }
  // ...
}
@Service
public class UserService {

  // Inyección — puede ser CUALQUIER impl.
  @Autowired
  private UserRepository<User, String> repo;

  public User getUser(String id) {
    return repo.findById(id);
  }

  public void registerUser(User u) {
    repo.save(u);
  }
}

// En config: cambiar la impl.
// NO se modifica UserService.
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 8 -->
Polyglot Persistence — Múltiples motores, un modelo

![preencoded.png](Image0.jpg)

![preencoded.png](Image1.jpg)
MongoDB
Documentos
Neo4j
Grafos

APP

![preencoded.png](Image2.jpg)

![preencoded.png](Image3.jpg)
Redis
Clave/Valor
Cassandra
Tabular
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 9 -->
Framework de persistencia: Spring Data

Spring Data provee módulos intercambiables: el código del repositorio permanece idéntico independientemente del motor subyacente.

Spring Data MongoDB
MongoRepository, MongoTemplate, @Document

Spring Data Neo4j
Neo4jRepository, @Node, @Relationship

Spring Data Redis
RedisTemplate, @RedisHash, ReactiveRedis

Spring Data Cassandra
CassandraRepository, @Table, @PrimaryKey

Spring Data JPA
JpaRepository, @Entity, JPQL / Criteria API
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 10 -->
ODM · OGM · Driver Directo — ¿Cuándo usar cada uno?

Herramienta
Motor
Abstracción
Cuándo usarlo

Driver oficial
Todos
Ninguna (raw)
Control total, optimización extrema

ODM (Mongoose)
MongoDB
Media (schema opcional)
APIs Node.js, prototipado rápido

OGM (OGM/neo4j-ogm)
Neo4j
Media (entidades anotadas)
Apps JVM con grafos complejos

Spring Data *
Multi-motor
Alta (generación automática)
Enterprise Java, DDD, polimorfismo
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 11 -->
ODM Mongoose — Modelo polimórfico en Node.js

models/product.model.js
const mongoose = require('mongoose');

// Schema base (discriminatorKey = polimorfismo)
const productSchema = new mongoose.Schema(
  { name: String, price: Number, category: String },
  { discriminatorKey: 'kind', collection: 'products' }
);

const Product    = mongoose.model('Product', productSchema);

// Sub-tipos polimórficos
const Physical = Product.discriminator('Physical',
  new mongoose.Schema({ weight: Number, stock: Number })
);
const Digital  = Product.discriminator('Digital',
  new mongoose.Schema({ downloadUrl: String, licenseType: String })
);

// Consulta uniforme — devuelve ambos tipos
const all = await Product.find({ category: 'software' });
// all[0] puede ser Physical o Digital según 'kind'
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 12 -->
Error frecuente: ¿Cuándo NO usar polimorfismo?

❌ Error conceptual

![preencoded.png](Image0.jpg)
Diseñar una sola clase Repository que intenta conectarse a TODOS los motores a la vez para toda la app. Genera acoplamiento total y hace imposible el testing unitario.

✅ Correcto

![preencoded.png](Image1.jpg)
Cada bounded context elige el motor que mejor se adapta a su naturaleza. El polimorfismo permite intercambiarlos sin modificar la lógica de negocio.

💡 Criterio clave

![preencoded.png](Image2.jpg)
La persistencia polimórfica no es 'usar todo a la vez'. Es que la app pueda funcionar con distintos motores en distintos contextos mediante la misma interfaz.
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 13 -->
Reflexión — Persistencia Polimórfica

Pregunta 1
Una startup usa MongoDB para usuarios, Neo4j para su red de contactos y Redis para notificaciones push. ¿Cómo estructurarías los repositorios y qué patrón aplicarías para que el Service de 'Notificación' pueda mandar alertas a usuarios de cualquier motor?

Pregunta 2
¿Cuál es la diferencia entre un ODM (Object-Document Mapper) y un ORM (Object-Relational Mapper) en términos de esquema, validaciones y consultas? Justifica con un ejemplo concreto.
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 14 -->
Resumen — Persistencia Polimórfica

![preencoded.png](Image0.jpg)
Polimorfismo = misma interfaz, múltiples implementaciones concretas

![preencoded.png](Image1.jpg)
Repository Pattern desacopla la lógica de negocio del motor

![preencoded.png](Image2.jpg)
Spring Data es el framework más usado para polimorfismo en Java

![preencoded.png](Image3.jpg)
Polyglot Persistence: cada dominio elige el motor óptimo
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 15 -->

BLOQUE 2

![preencoded.png](Image0.jpg)
Big Data
& El Problema
de Escala
Unidad VI  —  Manejo de grandes volúmenes de datos
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 16 -->
¿Qué es Big Data?

Datos cuyo volumen, velocidad o variedad superan la capacidad de las herramientas tradicionales de bases de datos para capturar, gestionar y procesar en tiempo razonable.
120 ZB

2.5 EB
datos generados
por día (2024)

90%
de datos actuales
se crearon en 2 años
volumen de datos global
generado en 2023
(Statista, 2024)

40%
del crecimiento es
no estructurado
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 17 -->
Las 5 Vs del Big Data

Volume
Velocity
Variety

![preencoded.png](Image0.jpg)

![preencoded.png](Image1.jpg)

![preencoded.png](Image2.jpg)
Volumen
Velocidad
Variedad
Terabytes → Petabytes → Exabytes de datos
Generación y procesamiento en tiempo real
Estructurado, semi-estructurado, binario

Veracity
Value

![preencoded.png](Image3.jpg)

![preencoded.png](Image4.jpg)
Veracidad
Valor
Calidad, ruido e incertidumbre de los datos
El insight de negocio extraído del análisis
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 18 -->
¿Por qué los RDBMS tradicionales fallan a escala?

Escalado vertical (Scale-Up)

![preencoded.png](Image0.jpg)
Agregar CPU/RAM tiene límite físico y costo exponencial. No es viable a partir de cierto punto.

ACID a gran escala = overhead

![preencoded.png](Image1.jpg)
Mantener ACID con millones de transacciones concurrentes genera locks y degrada el rendimiento.

Esquema rígido

![preencoded.png](Image2.jpg)
Alterar tablas en producción con billones de filas implica downtime o migraciones costosas.

JOIN entre tablas masivas

![preencoded.png](Image3.jpg)
Un JOIN de dos tablas de 10B filas cada una puede tardar horas en RDBMS convencionales.
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 19 -->
La respuesta: procesamiento distribuido

Divide el problema: en vez de 1 máquina grande → N máquinas pequeñas cooperando.

![preencoded.png](Image0.jpg)

![preencoded.png](Image1.jpg)

![preencoded.png](Image2.jpg)
Sharding / Particionamiento
Replicación
Map-Reduce
Los datos se dividen en fragmentos (shards) distribuidos en múltiples nodos.
Cada shard tiene réplicas para garantizar alta disponibilidad y tolerancia a fallos.
Paradigma para procesamiento paralelo masivo: Map transforma, Reduce agrega.
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 20 -->
Paradigma Map-Reduce — Fundamento de Hadoop

INPUT
Data chunks
MAP
Transformar
SHUFFLE
& SORT
REDUCE
Agregar
OUTPUT
Resultado

![preencoded.png](Image0.jpg)

![preencoded.png](Image1.jpg)

![preencoded.png](Image2.jpg)

![preencoded.png](Image3.jpg)

Ejemplo: contar palabras (clásico de Hadoop)
// MAP: para cada línea, emite (palabra, 1)
map(String line) → emit(word, 1) para cada word en line

// SHUFFLE: agrupa por clave → ("hadoop", [1,1,1,...])

// REDUCE: suma los valores de la misma clave
reduce(String word, List<Integer> counts) → emit(word, sum(counts))

// Resultado: hadoop → 142,  bigdata → 87,  mapreduce → 56
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 21 -->
Ecosistema Big Data — Mapa de tecnologías

![preencoded.png](Image0.jpg)

![preencoded.png](Image1.jpg)

![preencoded.png](Image2.jpg)

![preencoded.png](Image3.jpg)
Hadoop HDFS
Apache Spark
Apache Hive
Apache HBase
Almacenamiento distribuido
Procesamiento en memoria
SQL sobre Hadoop
NoSQL sobre HDFS

![preencoded.png](Image4.jpg)

![preencoded.png](Image5.jpg)

![preencoded.png](Image6.jpg)

![preencoded.png](Image7.jpg)
Apache Kafka
Apache Flink
Apache Parquet
Apache Airflow
Streaming de eventos
Stream processing
Formato columnar
Orquestación de pipelines
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 22 -->
Arquitecturas de referencia — Lambda vs Kappa

Arquitectura Lambda
Arquitectura Kappa
Batch Layer: histórico completo (Hadoop)
Speed Layer: tiempo real (Spark/Kafka)
Serving Layer: queries sobre ambas capas
✅ Alta precisión histórica
❌ Complejidad de 2 codebases paralelos
Un solo pipeline de streaming (Kafka)
Reprocesa desde el log cuando necesita
Serving Layer sobre el stream
✅ Codebase único, más simple
❌ Limitado para análisis histórico complejo
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 23 -->

BLOQUE 3

![preencoded.png](Image0.jpg)
Apache
Hadoop
El framework de referencia para procesamiento distribuido a escala
Clases 12  ·  Unidad VI
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 24 -->
Historia de Hadoop — Origen y evolución

Google publica Google File System (GFS)
2003

Google publica el paper de Map-Reduce
2004

Doug Cutting & Mike Cafarella crean Hadoop como parte de Nutch (web crawler)
2005

Yahoo! contrata a Doug Cutting. Hadoop se separa de Nutch como proyecto propio
2006

Apache Hadoop se convierte en Top-Level Project de la ASF
2008

Hadoop 1.0 — HDFS + MapReduce (JobTracker/TaskTracker)
2011

Hadoop 2.0 — YARN separa gestión de recursos del procesamiento
2013

Hadoop 3.0 — Erasure Coding, mejoras HDFS, YARN Timeline Service v2
2017

Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 25 -->
Arquitectura Core de Hadoop

Hadoop se compone de 4 módulos principales:

![preencoded.png](Image0.jpg)

![preencoded.png](Image1.jpg)

![preencoded.png](Image2.jpg)

![preencoded.png](Image3.jpg)
Hadoop Common
HDFS
YARN
MapReduce
Utilidades y librerías compartidas por todos los módulos
Hadoop Distributed File System — sistema de archivos distribuido
Yet Another Resource Negotiator — gestión de recursos y scheduling
Motor de procesamiento paralelo distribuido basado en el paradigma MR
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 26 -->
HDFS — Hadoop Distributed File System

Diseñado para almacenar archivos muy grandes (GB → TB) en clusters de hardware commodity, con tolerancia a fallos mediante replicación (factor 3 por defecto).

Características
de bloques
DataNode 1
(Rack A)

![preencoded.png](Image2.jpg)

![preencoded.png](Image0.jpg)
Tamaño por defecto: 128 MB
Factor de replicación: 3
Rack-aware placement
Write-once, read-many
Checksum CRC-32 por bloque

![preencoded.png](Image1.jpg)
DataNode 2
(Rack A)

![preencoded.png](Image3.jpg)
NameNode
Metadata master
Directorio de archivos
Ubicación de bloques
(SPOF → HA en v2+)

DataNode 3
(Rack B)

![preencoded.png](Image4.jpg)
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 27 -->
HDFS vs Almacenamiento de objetos (S3/GCS)

Criterio
HDFS
S3 / GCS / ADLS

Latencia
Baja (datos cerca del cómputo)
Media (red externa)

Escalabilidad
Manual (agregar nodos)
Automática e ilimitada

Costo infra
Alto (servidores dedicados)
Bajo (pay-per-use)

Procesamiento
Data Locality — MR corre en el nodo con los datos
Separación compute/storage

Mantenimiento
Alto (cluster propio)
Ninguno (managed service)

Tendencia actual
Legacy / on-premise
Cloud-native (predominante)
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 28 -->
YARN — Yet Another Resource Negotiator

Separación de responsabilidades: gestión de recursos (YARN) desacoplada del modelo de programación (MapReduce, Spark, etc.).

![preencoded.png](Image0.jpg)

![preencoded.png](Image1.jpg)

![preencoded.png](Image2.jpg)
ResourceManager
NodeManager
ApplicationMaster
Árbitro global de recursos del cluster.
Schedulers: FIFO, Capacity, Fair
Ejecuta en cada worker node.
Gestiona containers y reporta al RM
Un AM por aplicación.
Negocia recursos con RM, supervisa tareas
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 29 -->
MapReduce — Flujo de ejecución en el cluster

Input Split
1
HDFS divide el archivo en splits de 128MB. Cada split → 1 Map task

Map Phase
2
Cada Mapper procesa su split localmente en el DataNode (data locality)

Combiner
3
Mini-Reduce local: reduce el tráfico de red antes del shuffle (opcional)

Shuffle & Sort
4
Framework transfiere outputs de Mappers a los Reducers, ordena por clave

Reduce Phase
5
Cada Reducer procesa todas las claves que le corresponden → output final a HDFS
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 30 -->
MapReduce Java API — WordCount clásico

WordCount.java
public class WordCount {
  // MAPPER: emite (palabra, 1) por cada token
  public static class TokenizerMapper
      extends Mapper<LongWritable, Text, Text, IntWritable> {
    private final static IntWritable one = new IntWritable(1);
    private Text word = new Text();
    public void map(LongWritable key, Text value, Context ctx)
        throws IOException, InterruptedException {
      StringTokenizer itr = new StringTokenizer(value.toString());
      while (itr.hasMoreTokens()) {
        word.set(itr.nextToken());
        ctx.write(word, one);
      }
    }
  }
  // REDUCER: suma todos los 1s de cada palabra
  public static class IntSumReducer
      extends Reducer<Text, IntWritable, Text, IntWritable> {
    public void reduce(Text key, Iterable<IntWritable> values, Context ctx)
        throws IOException, InterruptedException {
      int sum = 0;
      for (IntWritable val : values) sum += val.get();
      ctx.write(key, new IntWritable(sum));
    }
  }
}
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 31 -->

![preencoded.png](Image0.jpg)
Apache Hive — SQL sobre Hadoop

Capa de abstracción SQL (HiveQL) que traduce queries a jobs MapReduce o Tez/Spark. Permite a analistas usar SQL sobre datos en HDFS.

Metastore
HiveQL example
Catálogo central de schemas (MySQL/Derby)
-- Crear tabla externa sobre HDFS
CREATE EXTERNAL TABLE ventas (
  id      BIGINT,
  cliente STRING,
  monto   DECIMAL(10,2),
  fecha   DATE
)
ROW FORMAT DELIMITED FIELDS TERMINATED BY ','
STORED AS PARQUET
LOCATION '/datos/ventas/';

-- Query normal
SELECT fecha, SUM(monto) AS total
FROM ventas
WHERE monto > 1000
GROUP BY fecha
ORDER BY fecha DESC;

Execution
MR, Tez, o Spark como backend

Partitioning
Particionado por columna reduce scans

Bucketing
Hash-bucketing para JOINs eficientes
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 32 -->

![preencoded.png](Image0.jpg)
Apache HBase — NoSQL columnar sobre HDFS

Base de datos NoSQL columnar que funciona sobre HDFS. Inspirada en BigTable de Google. Latencia de millisegundos. Escala lineal a miles de nodos.

Modelo de datos HBase
HBase Shell
# Crear tabla con column families
create 'usuarios',
  { NAME => 'perfil', VERSIONS => 3 },
  { NAME => 'actividad', TTL => 86400 }

# Insertar
put 'usuarios', 'u001', 'perfil:nombre', 'Ana García'
put 'usuarios', 'u001', 'perfil:email',  'ana@mail.com'
put 'usuarios', 'u001', 'actividad:login', '2024-01-15'

# Leer fila
get 'usuarios', 'u001'

# Scan con filtro
scan 'usuarios', {
  COLUMNS => ['perfil:nombre'],
  STARTROW => 'u001',
  ENDROW   => 'u999'
}
RowKey: identificador único (ordenado lexicográficamente)
Column Family: agrupación física de columnas (se define al crear)
Column Qualifier: nombre de columna dentro de la familia
Cell: (rowkey, CF, qualifier, timestamp) → valor
Versiones: por defecto guarda 3 versiones por cell
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 33 -->

![preencoded.png](Image0.jpg)
Apache Spark — MapReduce en memoria

Spark procesa datos en memoria (RDD), eliminando el I/O a disco entre stages. Hasta 100× más rápido que MapReduce para iteraciones (ML, grafos).

Aspecto
MapReduce
Apache Spark

Almacenamiento
HDFS en disco entre cada step
Memoria (RDD / Dataset)

Velocidad
Baseline
10–100× más rápido

API
Java (verbosa)
Scala, Python, Java, R, SQL

ML
Mahout (limitado)
MLlib (nativo)

Streaming
Micro-batch (largo)
Structured Streaming nativo

Graph
No nativo
GraphX nativo
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 34 -->
Apache Kafka — Streaming de eventos en tiempo real

![preencoded.png](Image0.jpg)

Plataforma de streaming distribuido de alto rendimiento. Actúa como bus de eventos entre productores y consumidores con retención configurable.

![preencoded.png](Image1.jpg)

![preencoded.png](Image3.jpg)

![preencoded.png](Image5.jpg)

![preencoded.png](Image2.jpg)

![preencoded.png](Image4.jpg)
Producers
(Apps, DBs,
Sensores)
Kafka
Brokers
(Cluster)
Consumers
(Spark, Flink,
Apps)

Topic:
Canal lógico de mensajes. Equivale a una 'cola' con múltiples particiones.
Partition:
Unidad de paralelismo. Los mensajes dentro de cada partición están ordenados.

Offset:
Posición del mensaje dentro de la partición. Los consumers guardan su offset.
Retention:
Tiempo o tamaño durante el cual los mensajes permanecen (default: 7 días).
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 35 -->

![preencoded.png](Image0.jpg)
Apache Flink — Stream Processing de nueva generación

Framework de procesamiento de streams con estado (stateful). Trata el batch como un caso especial del streaming. Garantías exactly-once.

True Streaming
Stateful Processing

![preencoded.png](Image1.jpg)

![preencoded.png](Image2.jpg)
Procesa evento a evento, no micro-batch. Latencias de milisegundos.
Estado local en memoria con respaldo en RocksDB. Checkpoints automáticos.

Event Time
Exactly-Once

![preencoded.png](Image3.jpg)

![preencoded.png](Image4.jpg)
Maneja eventos out-of-order usando watermarks. Crítico para IoT y logs.
Garantía de procesamiento: ni pérdida ni duplicación, incluso ante fallas.
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 36 -->

![preencoded.png](Image0.jpg)
Apache Parquet — El formato columnar de Big Data

Formato de almacenamiento columnar y binario, diseñado para eficiencia en queries analíticas (OLAP). Compatible con todo el ecosistema Hadoop.
Almacenamiento por filas (CSV/RDBMS)
Almacenamiento columnar (Parquet/ORC)

ID
Nombre
Monto
País
ID
1
2
3

1
Ana
500
AR
Nombre
Ana
Bob
Eva

2
Bob
800
CL
Monto
500
800
1200

3
Eva
1200
MX
País
AR
CL
MX
Query solo lee las columnas necesarias → menor I/O
Alta compresión por columna (datos homogéneos)
Codificación eficiente: RLE, Dictionary, Delta
Compatible con Spark, Hive, Impala, Drill, Presto
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 37 -->
Apache ZooKeeper — Coordinación distribuida

![preencoded.png](Image0.jpg)

Servicio de coordinación distribuida para el ecosistema Hadoop. Gestiona configuración, naming, sincronización y elección de líder.

Leader Election

![preencoded.png](Image1.jpg)
HDFS HA: elige el NameNode activo entre primario y standby automáticamente ante falla.

Configuration Mgmt

![preencoded.png](Image2.jpg)
Almacena configuración centralizada que todos los nodos del cluster leen dinámicamente.

Service Discovery

![preencoded.png](Image3.jpg)
Kafka usa ZooKeeper para que los brokers se registren y los consumers los encuentren.

Distributed Locks

![preencoded.png](Image4.jpg)
Previene condiciones de carrera en operaciones distribuidas sin coordinación manual.
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 38 -->

![preencoded.png](Image0.jpg)
Apache Airflow — Orquestación de pipelines de datos

Define, programa y monitorea pipelines de datos como DAGs (Directed Acyclic Graphs) escritos en Python.

DAG como código
Pipeline ETL con Airflow DAG
Los pipelines son Python puro, versionables en Git
from airflow import DAG
from airflow.operators.bash import BashOperator
from datetime import datetime

dag = DAG('etl_hadoop',
    schedule_interval='0 2 * * *',
    start_date=datetime(2024, 1, 1))

ingest = BashOperator(
    task_id='ingest_hdfs',
    bash_command='hdfs dfs -put /raw/*.csv /datos/',
    dag=dag)

transform = BashOperator(
    task_id='hive_transform',
    bash_command='hive -f /sql/transform.hql',
    dag=dag)

export = BashOperator(
    task_id='spark_aggregate',
    bash_command='spark-submit agg.py',
    dag=dag)

ingest >> transform >> export

Scheduler
CRON-based o event-driven con backfill automático

Operators
BashOperator, PythonOp, HiveOp, SparkSubmitOp…

Web UI
Monitoreo visual, logs por tarea, re-run manual
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 39 -->
Hadoop Managed en la nube — EMR · Dataproc · HDInsight

AWS
GCP
Azure
EMR
(Elastic MapReduce)
Dataproc
HDInsight
Cluster Hadoop/Spark efímero. S3 como storage. Auto-scaling. Precio por nodo-hora.
Levanta clusters en 90s. BigQuery como Hive alternative. Stackdriver monitoring.
Hadoop + Spark + Kafka managed. ADLS Gen2 como storage. Active Directory integrado.

Tendencia 2024: clusters efímeros + storage separado (S3/GCS) + Spark sustituyendo MapReduce. HDFS local en desuso para nuevos proyectos cloud.
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 40 -->
RDBMS vs Hadoop — ¿Cuándo elegir cada uno?

Criterio
RDBMS (PostgreSQL/Oracle)
Hadoop (HDFS + Hive/Spark)

Volumen datos
MB → GB (hasta ~TBs con tuning)
TBs → PBs → EBs nativamente

Tipo de queries
OLTP: baja latencia, alta concurrencia
OLAP: scans masivos, agregaciones

Esquema
Schema-on-write (rígido)
Schema-on-read (flexible)

Latencia de lectura
Milisegundos
Segundos a minutos (batch)

Transacciones ACID
Nativas y robustas
Limitadas (Hive ACID, Delta Lake)

Costo escala
Exponencial (hardware))
Lineal (commodity hardware)

Casos de uso ideales
ERP, e-commerce, finanzas
Data warehouse, ML, log analytics
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 41 -->
Integración NoSQL → Data Warehouse con Hadoop

![preencoded.png](Image0.jpg)

![preencoded.png](Image2.jpg)

![preencoded.png](Image4.jpg)

![preencoded.png](Image6.jpg)
MongoDB
Neo4j
Cassandra
Redis
Kafka
Ingesta
en tiempo
real
Hadoop
HDFS
Parquet
Hive / Spark
SQL
Aggregations

![preencoded.png](Image1.jpg)

![preencoded.png](Image3.jpg)

![preencoded.png](Image5.jpg)

Sqoop: importa datos de RDBMS a HDFS.  Flume: streaming de logs a HDFS.  Oozie: orquestador de workflows Hadoop.
NoSQL → Kafka → HDFS (raw zone) → Parquet (curated zone) → Hive/Spark (analytics) → BI Tools
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 42 -->
Caso Real — LinkedIn: origen de Kafka y uso de Hadoop

LinkedIn fue pionero en el uso de Hadoop a gran escala y creó Apache Kafka como solución a sus necesidades de ingesta masiva de eventos (2011).

El problema (2010)

![preencoded.png](Image0.jpg)
500M+ usuarios. 100GB+ de datos de actividad por día. Los ETLs nocturnos hacia RDBMS tomaban 24+ horas.

Solución con Hadoop

![preencoded.png](Image1.jpg)
Migración de pipelines batch a Hadoop HDFS. Map-Reduce para cálculo de 'People You May Know'. Hive para analytics.

Kafka: nacimiento

![preencoded.png](Image2.jpg)
Para reemplazar colas ad-hoc y pipelines frágiles. Diseñado para 1M+ mensajes/segundo con retención de días.

Resultado

![preencoded.png](Image3.jpg)
Latencia de analytics de 24h → minutos. Kafka hoy procesa 7T de mensajes/día en LinkedIn.
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 43 -->
Errores conceptuales frecuentes sobre Hadoop

![preencoded.png](Image0.jpg)
"Hadoop siempre es más rápido que SQL"

![preencoded.png](Image1.jpg)
Hadoop es más rápido para procesamiento masivo por lotes (batch). Para queries pequeñas o OLTP, un RDBMS con índices gana ampliamente.

![preencoded.png](Image2.jpg)
"Hadoop reemplaza las bases de datos"

![preencoded.png](Image3.jpg)
Hadoop complementa las BBDD. Es una capa de procesamiento y almacenamiento distribuido, no un reemplazo de OLTP ni de NoSQL transaccional.

![preencoded.png](Image4.jpg)
"HDFS es igual a S3"

![preencoded.png](Image5.jpg)
HDFS requiere un cluster dedicado y ofrece data locality. S3 es un servicio gestionado. Son filosóficamente distintos: storage acoplado vs desacoplado.

![preencoded.png](Image6.jpg)
"Hive es una base de datos"

![preencoded.png](Image7.jpg)
Hive es una capa de procesamiento SQL sobre datos en HDFS/S3. No almacena datos propios. La ejecución es batch, no OLTP.
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 44 -->
Resumen — Ecosistema Hadoop en un mapa

Orquestación

![preencoded.png](Image0.jpg)
Oozie · Airflow · Azkaban

SQL / Analytics

![preencoded.png](Image1.jpg)
Hive · Impala · Presto · SparkSQL

Procesamiento

![preencoded.png](Image2.jpg)
MapReduce · Spark · Flink · Tez

Streaming

![preencoded.png](Image3.jpg)
Kafka · Flume · Sqoop · Storm
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 45 -->

BLOQUE 4

![preencoded.png](Image0.jpg)
Casos Reales,
Debate
y Cierre
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 46 -->
Caso Integrador — Plataforma de análisis de e-commerce

Una empresa de e-commerce procesa 5M de eventos/día (clicks, compras, devoluciones). Necesita recomendaciones en tiempo real Y reportes históricos.

MongoDB
→
Catálogo de productos, perfiles de usuario

![preencoded.png](Image0.jpg)

Redis
→
Sesiones activas, carrito temporal, ranking live

![preencoded.png](Image1.jpg)

Kafka
→
Bus de eventos de comportamiento del usuario

![preencoded.png](Image2.jpg)

Hadoop/HDFS
→
Data lake: histórico completo de eventos

![preencoded.png](Image3.jpg)

Hive + Spark
→
Análisis batch: patrones de compra, ML de recomendación

![preencoded.png](Image4.jpg)
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 47 -->
Debate — ¿Cuándo usar Hadoop y cuándo no?

✅ Usar Hadoop cuando…
❌ NO usar Hadoop cuando…
Datos > 100 TB no manejables en un servidor
Procesamiento batch de todo el histórico
Análisis exploratorio con esquemas cambiantes
Ingesta de múltiples fuentes heterogéneas
Entrenamiento de modelos ML sobre millones de registros
Datos < 100 GB: un RDBMS es más eficiente
Se necesita latencia baja (OLTP, RT queries)
Queries ad-hoc simples y ocasionales
Equipo sin experiencia en sistemas distribuidos
Presupuesto limitado para infraestructura
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 48 -->
Preguntas de reflexión — Clase 12

Q1
Una empresa bancaria tiene transacciones en Oracle, grafos de fraude en Neo4j y eventos de tarjeta en Kafka. Diseñá la arquitectura de repositorios para que el servicio de detección de fraude acceda a los 3 sin acoplarse a ninguno.

![preencoded.png](Image0.jpg)

Q2
¿Por qué LinkedIn reemplazó sus pipelines de ETL nocturno por Kafka + Hadoop? ¿Qué problema específico resuelve Kafka que Hadoop solo no puede resolver?

![preencoded.png](Image1.jpg)

Q3
Tenés 500 GB de logs de servidor en CSV en HDFS. Describí el pipeline completo para obtener un reporte diario con el top 10 de endpoints más lentos usando Hive o Spark.

![preencoded.png](Image2.jpg)
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 49 -->
Bibliografía y recursos — Clase 12

![preencoded.png](Image0.jpg)

Obligatoria
• Harrison, G. (2015). Next Generation Databases. Apress. Cap. 9-10 (Hadoop, Big Data).
• Deka, G.C. (2017). NoSQL: Database for Storage and Retrieval of Data in Cloud. CRC Press. Caps. 6-8.

Documentación oficial
• Apache Hadoop Docs — hadoop.apache.org/docs/stable/
• Apache Hive Wiki — cwiki.apache.org/confluence/display/Hive
• Apache Spark Docs — spark.apache.org/docs/latest/
• Apache Kafka Docs — kafka.apache.org/documentation/
• Apache Airflow Docs — airflow.apache.org/docs/

Lecturas complementarias
• Dean, J. & Ghemawat, S. (2004). MapReduce: Simplified Data Processing. OSDI.
• Ghemawat, S. et al. (2003). The Google File System. SOSP.
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes:

<!-- Slide number: 50 -->

Resumen de la clase

![preencoded.png](Image0.jpg)

Persistencia Polimórfica

![preencoded.png](Image1.jpg)
Repository Pattern + Spring Data desacoplan la app del motor

Big Data — Las 5 Vs

![preencoded.png](Image2.jpg)
Volumen, Velocidad, Variedad, Veracidad y Valor

Hadoop Core

![preencoded.png](Image3.jpg)
HDFS + YARN + MapReduce como fundación del procesamiento distribuido

Ecosistema

![preencoded.png](Image4.jpg)
Hive, HBase, Spark, Kafka, Flink, Airflow, Parquet, ZooKeeper
Próxima clase: Clase 13 — Frameworks de persistencia y ORM/ODM avanzados
Ing. Damián Arnaudo  |  Ingeniería de Datos II  |  Clase 12

### Notes: