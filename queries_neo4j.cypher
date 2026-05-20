// =============================================================================
// CONSULTAS CYPHER — TP1 Tema 8: Streaming Musical
// Neo4j AuraDB: neo4j+s://ab97369a.databases.neo4j.io
// Req 7 (Sección 3.2) — 5 consultas obligatorias
// =============================================================================
// Verificación previa de carga (ejecutar primero):
//   MATCH (n:Artist)  RETURN count(n);   // 80
//   MATCH (n:Song)    RETURN count(n);   // 564
//   MATCH (n:User)    RETURN count(n);   // 200
//   MATCH ()-[r:PLAYED]->()            RETURN count(r);  // 50000
//   MATCH ()-[r:COLLABORATED_WITH]-() RETURN count(r);  // 190 (95 pares x2)
// =============================================================================


// ─────────────────────────────────────────────────────────────────────────────
// QUERY 7a
// Dado un artista, encontrar todos los artistas conectados en hasta 2 saltos
// de colaboración directa.
// ─────────────────────────────────────────────────────────────────────────────
// Parámetro de ejemplo: Shakira (artista bridge con muchas conexiones)
// Probar también con: "Ed Sheeran", "Gorillaz", "Doja Cat"

MATCH path = (a:Artist {stage_name: "Shakira"})-[:COLLABORATED_WITH*1..2]-(connected:Artist)
WHERE connected <> a
RETURN DISTINCT
  connected.stage_name AS artista,
  connected.main_genre AS genero,
  min(length(path))    AS saltos
ORDER BY saltos, artista;

// ─── Variante parametrizada (para defensa oral) ───────────────────────────────
// :param artist_name => "Bad Bunny"
// MATCH path = (a:Artist {stage_name: $artist_name})-[:COLLABORATED_WITH*1..2]-(connected:Artist)
// WHERE connected <> a
// RETURN DISTINCT connected.stage_name AS artista, connected.main_genre AS genero,
//        min(length(path)) AS saltos
// ORDER BY saltos, artista;


// ─────────────────────────────────────────────────────────────────────────────
// QUERY 7b
// Encontrar el camino de colaboraciones entre dos artistas que NUNCA trabajaron
// juntos directamente.
// ─────────────────────────────────────────────────────────────────────────────
// Usamos dos artistas de géneros distintos que no tienen collab directa:
//   Queen (Rock, UK, 1975) y Bad Bunny (Urbano, PR, 2022)
// Están conectados por el grafo: Queen → Oasis/Foo Fighters → ... → cross-genre → Bad Bunny

MATCH (a1:Artist {stage_name: "Queen"}),
      (a2:Artist {stage_name: "Bad Bunny"})
WHERE NOT (a1)-[:COLLABORATED_WITH]-(a2)
CALL apoc.algo.dijkstra(a1, a2, 'COLLABORATED_WITH', null) YIELD path, weight
RETURN [n IN nodes(path) | n.stage_name] AS cadena_de_colaboracion,
       length(path) AS saltos;

// ─── Versión sin APOC (AuraDB Free no tiene APOC — usar esta) ────────────────

MATCH (a1:Artist {stage_name: "Queen"}),
      (a2:Artist {stage_name: "Bad Bunny"})
WHERE NOT (a1)-[:COLLABORATED_WITH]-(a2)
MATCH path = shortestPath((a1)-[:COLLABORATED_WITH*]-(a2))
RETURN [n IN nodes(path) | n.stage_name] AS cadena_de_colaboracion,
       length(path) AS saltos;

// ─── Otros pares sin conexión directa para probar ────────────────────────────
// ("The Beatles", "Karol G")
// ("Metallica", "Rosalía")
// ("Soda Stereo", "Drake")
// ("Pink Floyd", "Bizarrap")


// ─────────────────────────────────────────────────────────────────────────────
// QUERY 7c
// Detectar artistas 'puente' entre géneros: colaboraron con artistas de al
// menos 3 géneros diferentes al propio.
// ─────────────────────────────────────────────────────────────────────────────
// Artistas esperados con nuestros datos:
//   Shakira (Pop Latino) → Urbano, Reggaeton, Pop, R&B
//   Doja Cat (Hip Hop)   → Pop, R&B, Urbano
//   Gorillaz (Alternative) → Hip Hop, Electronic, Trap, Urbano
//   Justin Bieber (Pop)  → Hip Hop, Reggaeton, Urbano
//   Rihanna (R&B)        → Hip Hop, Pop Latino, Urbano, Pop
//   Ed Sheeran (Pop)     → Hip Hop, R&B, Urbano

MATCH (a:Artist)-[:COLLABORATED_WITH]-(collab:Artist)
WHERE a.main_genre <> collab.main_genre
WITH a, collect(DISTINCT collab.main_genre) AS generos_ajenos
WHERE size(generos_ajenos) >= 3
RETURN
  a.stage_name       AS artista_puente,
  a.main_genre       AS genero_propio,
  generos_ajenos,
  size(generos_ajenos) AS diversidad_generos
ORDER BY diversidad_generos DESC;


// ─────────────────────────────────────────────────────────────────────────────
// QUERY 7d
// Dado un usuario, recomendar artistas escuchados por usuarios con historial
// similar que el usuario aún no conoce (no siguió + no escuchó).
// ─────────────────────────────────────────────────────────────────────────────
// Probar con cualquier usuario: User_1 … User_200
// Usuarios premium (múltiplos de 5): User_5, User_10, User_50, User_100

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

// ─── Variante: ver qué usuarios tienen historial similar al dado ──────────────
// MATCH (u:User {name: "User_1"})-[:PLAYED]->(s:Song)<-[:PLAYED]-(similar:User)
// WHERE similar <> u
// WITH similar, count(s) AS en_comun
// RETURN similar.name, en_comun
// ORDER BY en_comun DESC LIMIT 10;


// ─────────────────────────────────────────────────────────────────────────────
// QUERY 7e
// Encontrar clusters de artistas altamente interconectados (comunidades
// musicales) e identificar el género dominante de cada cluster.
// ─────────────────────────────────────────────────────────────────────────────
// Sin GDS (AuraDB Free no lo tiene): detectamos comunidades por densidad real
// de colaboraciones mutuas — artistas que comparten ≥2 colaboradores en común
// Y además colaboraron directamente entre sí (vecindarios densos / triángulos).
//
// CORRECCIÓN respecto a la entrega anterior:
// La versión anterior agrupaba artistas por género (main_genre), lo que no
// detecta comunidades — solo categorías. Esta versión identifica subgrafos
// densamente conectados basándose en la estructura real del grafo.

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

// ─── Variante: triángulos de colaboración (3 artistas que se colaboraron mutuamente) ──
// Útil para identificar el núcleo más denso de cada comunidad.
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

// ─── Variante: grado de cada artista (cantidad de colaboraciones directas) ────
// Combina con lo anterior para identificar los "hubs" de cada comunidad.
// MATCH (a:Artist)-[:COLLABORATED_WITH]-(b:Artist)
// WITH a, count(b) AS grado
// RETURN a.stage_name, a.main_genre, grado
// ORDER BY grado DESC LIMIT 15;


// =============================================================================
// CONSULTAS DE SOPORTE / DIAGNÓSTICO
// (útiles para el informe y la defensa oral)
// =============================================================================

// Ver todos los géneros existentes
MATCH (g:Genre) RETURN g.name ORDER BY g.name;

// Artistas con más colaboraciones totales
MATCH (a:Artist)-[:COLLABORATED_WITH]-(b:Artist)
RETURN a.stage_name AS artista, a.main_genre AS genero, count(b) AS total_collabs
ORDER BY total_collabs DESC LIMIT 10;

// Canciones más reproducidas (top 10)
MATCH (u:User)-[:PLAYED]->(s:Song)<-[:PERFORMED]-(a:Artist)
RETURN s.title AS cancion, a.stage_name AS artista, count(u) AS reproducciones
ORDER BY reproducciones DESC LIMIT 10;

// Usuarios más activos
MATCH (u:User)-[p:PLAYED]->(:Song)
RETURN u.name AS usuario, u.plan AS plan, count(p) AS reproducciones
ORDER BY reproducciones DESC LIMIT 10;

// Artistas más seguidos
MATCH (u:User)-[:FOLLOWS]->(a:Artist)
RETURN a.stage_name AS artista, a.main_genre AS genero, count(u) AS seguidores_en_muestra
ORDER BY seguidores_en_muestra DESC LIMIT 10;

// Playlist con más canciones y sus géneros
MATCH (pl:Playlist)-[:CONTAINS]->(s:Song)<-[:PERFORMED]-(a:Artist)
RETURN pl.name AS playlist, pl.type AS tipo, pl.followers_current AS seguidores,
       count(s) AS canciones,
       collect(DISTINCT a.main_genre)[0..3] AS generos_muestra
ORDER BY canciones DESC;

// Verificar grafo conexo: todos los artistas tienen al menos 1 colaboración?
MATCH (a:Artist)
WHERE NOT (a)-[:COLLABORATED_WITH]-()
RETURN count(a) AS artistas_sin_collab;
// Si devuelve 0 → grafo 100% conexo en la red de colaboraciones

// Ver el subgrafo de un artista puente (ejemplo: Shakira)
MATCH (a:Artist {stage_name: "Shakira"})-[:COLLABORATED_WITH]-(b:Artist)
RETURN a.stage_name AS origen, b.stage_name AS colaborador,
       a.main_genre AS genero_origen, b.main_genre AS genero_colaborador;
