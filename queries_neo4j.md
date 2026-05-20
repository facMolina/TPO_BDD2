# Consultas Cypher — TP1 Tema 8: Streaming Musical

**Neo4j AuraDB:** `neo4j+s://ab97369a.databases.neo4j.io`
**Req 7 — Sección 3.2 del TP**

Copiar cada query y pegarla en el editor de [Neo4j Browser](https://browser.neo4j.io) o en la consola de [AuraDB](https://console.neo4j.io).

---

## Verificación previa de carga

Ejecutar antes de cualquier query para confirmar que los datos están cargados:

```cypher
MATCH (n:Artist)  RETURN count(n) AS artists;   // esperado: 80
MATCH (n:Song)    RETURN count(n) AS songs;     // esperado: 564
MATCH (n:User)    RETURN count(n) AS users;     // esperado: 200
MATCH ()-[r:PLAYED]->()            RETURN count(r) AS plays;   // esperado: 50000
MATCH ()-[r:COLLABORATED_WITH]-()  RETURN count(r) AS collabs; // esperado: 190
```

---

## Query 7a — Artistas conectados en hasta 2 saltos de colaboración

> Dado un artista, encontrar todos los artistas conectados hasta 2 saltos de colaboración directa.

Probar con: `"Shakira"`, `"Ed Sheeran"`, `"Gorillaz"`, `"Doja Cat"`, `"Bad Bunny"`

```cypher
MATCH path = (a:Artist {stage_name: "Shakira"})-[:COLLABORATED_WITH*1..2]-(connected:Artist)
WHERE connected <> a
RETURN DISTINCT
  connected.stage_name AS artista,
  connected.main_genre AS genero,
  min(length(path))    AS saltos
ORDER BY saltos, artista;
```

---

## Query 7b — Camino entre dos artistas sin colaboración directa

> Encontrar el camino de colaboraciones entre dos artistas que nunca trabajaron juntos directamente.

Pares sugeridos (géneros distintos, sin collab directa):
- `"Queen"` → `"Bad Bunny"`
- `"The Beatles"` → `"Karol G"`
- `"Metallica"` → `"Rosalía"`
- `"Pink Floyd"` → `"Bizarrap"`

```cypher
MATCH (a1:Artist {stage_name: "Queen"}),
      (a2:Artist {stage_name: "Bad Bunny"})
WHERE NOT (a1)-[:COLLABORATED_WITH]-(a2)
MATCH path = shortestPath((a1)-[:COLLABORATED_WITH*]-(a2))
RETURN [n IN nodes(path) | n.stage_name] AS cadena_de_colaboracion,
       length(path) AS saltos;
```

> **Nota:** AuraDB Free no tiene APOC. Usar `shortestPath()` nativo como está arriba.

---

## Query 7c — Artistas puente entre géneros

> Detectar artistas que colaboraron con artistas de al menos 3 géneros distintos al propio.

Artistas esperados con nuestro dataset:

| Artista | Género propio | Géneros conectados |
|---|---|---|
| Shakira | Pop Latino | Urbano, Reggaeton, Pop, R&B |
| Gorillaz | Alternative | Hip Hop, Electronic, Trap, Urbano |
| Rihanna | R&B | Hip Hop, Pop Latino, Urbano, Pop |
| Doja Cat | Hip Hop | Pop, R&B, Urbano |
| Justin Bieber | Pop | Hip Hop, Reggaeton, Urbano |
| Ed Sheeran | Pop | Hip Hop, R&B, Urbano |

```cypher
MATCH (a:Artist)-[:COLLABORATED_WITH]-(collab:Artist)
WHERE a.main_genre <> collab.main_genre
WITH a, collect(DISTINCT collab.main_genre) AS generos_ajenos
WHERE size(generos_ajenos) >= 3
RETURN
  a.stage_name         AS artista_puente,
  a.main_genre         AS genero_propio,
  generos_ajenos,
  size(generos_ajenos) AS diversidad_generos
ORDER BY diversidad_generos DESC;
```

---

## Query 7d — Recomendación de artistas por historial similar

> Dado un usuario, recomendar artistas escuchados por usuarios con historial similar que el usuario aún no conoce.

Probar con cualquier usuario `User_1` … `User_200`. Usuarios premium (múltiplos de 5): `User_5`, `User_10`, `User_50`.

```cypher
MATCH (u:User {name: "User_1"})-[:PLAYED]->(s:Song)<-[:PLAYED]-(similar:User)
WHERE similar <> u
WITH u, similar, count(s) AS reproducciones_comunes
ORDER BY reproducciones_comunes DESC
LIMIT 20
MATCH (similar)-[:PLAYED]->(s2:Song)<-[:PERFORMED]-(rec:Artist)
WHERE NOT (u)-[:PLAYED]->(:Song)<-[:PERFORMED]-(rec)
  AND NOT (u)-[:FOLLOWS]->(rec)
RETURN
  rec.stage_name AS artista_recomendado,
  rec.main_genre AS genero,
  count(*)       AS score_recomendacion
ORDER BY score_recomendacion DESC
LIMIT 10;
```

---

## Query 7e — Clusters de artistas altamente interconectados (sin GDS)

> Encontrar comunidades musicales basadas en la densidad real de colaboraciones mutuas e identificar el género dominante de cada cluster.

> **Nota:** AuraDB Free no incluye Graph Data Science (GDS). La detección de comunidades se implementa con Cypher puro usando vecindarios densos: artistas que comparten ≥2 colaboradores en común Y colaboraron directamente entre sí.

> **Criterio de comunidad:** a diferencia de agrupar por género (que solo categoriza), este enfoque detecta subgrafos estructuralmente densos en la red de colaboraciones — artistas que forman un núcleo interconectado independientemente de su género.

```cypher
MATCH (a:Artist)-[:COLLABORATED_WITH]-(x:Artist)-[:COLLABORATED_WITH]-(b:Artist)
WHERE a <> b
  AND (a)-[:COLLABORATED_WITH]-(b)
WITH a, b, count(x) AS colaboradores_comunes
WHERE colaboradores_comunes >= 2
WITH
  collect(DISTINCT a.stage_name) AS comunidad,
  collect(DISTINCT a.main_genre) AS generos_en_cluster
RETURN
  comunidad[0..6]          AS muestra_artistas,
  generos_en_cluster[0..3] AS generos_presentes,
  generos_en_cluster[0]    AS genero_dominante,
  size(comunidad)          AS tamanio_cluster
ORDER BY tamanio_cluster DESC
LIMIT 10;
```

**Variante — triángulos de colaboración** (núcleo más denso: 3 artistas que colaboraron mutuamente):

```cypher
MATCH (a:Artist)-[:COLLABORATED_WITH]-(b:Artist)-[:COLLABORATED_WITH]-(c:Artist)
WHERE (a)-[:COLLABORATED_WITH]-(c)
  AND id(a) < id(b) AND id(b) < id(c)
RETURN
  a.stage_name AS artista_1,
  b.stage_name AS artista_2,
  c.stage_name AS artista_3,
  a.main_genre AS genero_1,
  b.main_genre AS genero_2,
  c.main_genre AS genero_3
ORDER BY artista_1
LIMIT 20;
```

---

## Consultas de soporte / diagnóstico

Útiles para el informe y la defensa oral.

```cypher
// Géneros disponibles
MATCH (g:Genre) RETURN g.name ORDER BY g.name;

// Artistas con más colaboraciones
MATCH (a:Artist)-[:COLLABORATED_WITH]-(b:Artist)
RETURN a.stage_name AS artista, a.main_genre AS genero, count(b) AS total_collabs
ORDER BY total_collabs DESC LIMIT 10;

// Top 10 canciones más reproducidas
MATCH (u:User)-[:PLAYED]->(s:Song)<-[:PERFORMED]-(a:Artist)
RETURN s.title AS cancion, a.stage_name AS artista, count(u) AS reproducciones
ORDER BY reproducciones DESC LIMIT 10;

// Usuarios más activos
MATCH (u:User)-[p:PLAYED]->(:Song)
RETURN u.name AS usuario, u.plan AS plan, count(p) AS reproducciones
ORDER BY reproducciones DESC LIMIT 10;

// Artistas más seguidos en la muestra
MATCH (u:User)-[:FOLLOWS]->(a:Artist)
RETURN a.stage_name AS artista, a.main_genre AS genero, count(u) AS seguidores
ORDER BY seguidores DESC LIMIT 10;

// Verificar grafo conexo: artistas sin ninguna colaboración
MATCH (a:Artist)
WHERE NOT (a)-[:COLLABORATED_WITH]-()
RETURN count(a) AS artistas_sin_collab;
// Si devuelve 0 → todos los artistas están conectados

// Subgrafo de un artista puente (ejemplo)
MATCH (a:Artist {stage_name: "Shakira"})-[:COLLABORATED_WITH]-(b:Artist)
RETURN a.stage_name AS origen, b.stage_name AS colaborador,
       a.main_genre AS genero_origen, b.main_genre AS genero_colaborador;
```
