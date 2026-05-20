'use strict';
const { neo4jDriver } = require('../config');
const DB = process.env.NEO4J_DATABASE || 'ab97369a';

async function runQuery(cypher, params = {}) {
  const session = neo4jDriver.session({ database: DB });
  try {
    const result = await session.run(cypher, params);
    return result.records;
  } finally {
    await session.close();
  }
}

// Artistas relacionados por red de colaboraciones (hasta 2 saltos)
async function artistasRelacionados(stageName, maxSaltos = 2) {
  const records = await runQuery(
    `MATCH path = (a:Artist {stage_name: $name})-[:COLLABORATED_WITH*1..${maxSaltos}]-(rec:Artist)
     WHERE rec <> a
     RETURN DISTINCT rec.stage_name AS artista, rec.main_genre AS genero, min(length(path)) AS saltos
     ORDER BY saltos, artista`,
    { name: stageName }
  );
  return records.map(r => ({
    artista: r.get('artista'),
    genero:  r.get('genero'),
    saltos:  r.get('saltos').toNumber ? r.get('saltos').toNumber() : Number(r.get('saltos')),
  }));
}

// Colaboradores directos de un artista
async function colaboradoresDirectos(stageName) {
  const records = await runQuery(
    `MATCH (a:Artist {stage_name: $name})-[r:COLLABORATED_WITH]-(b:Artist)
     RETURN b.stage_name AS colaborador, b.main_genre AS genero, r.song_title AS cancion, r.collab_type AS tipo`,
    { name: stageName }
  );
  return records.map(r => ({
    colaborador: r.get('colaborador'),
    genero:      r.get('genero'),
    cancion:     r.get('cancion'),
    tipo:        r.get('tipo'),
  }));
}

// Camino más corto entre dos artistas (sin collab directa)
async function caminoEntreArtistas(nombre1, nombre2) {
  const records = await runQuery(
    `MATCH (a1:Artist {stage_name: $n1}), (a2:Artist {stage_name: $n2})
     WHERE NOT (a1)-[:COLLABORATED_WITH]-(a2)
     MATCH path = shortestPath((a1)-[:COLLABORATED_WITH*]-(a2))
     RETURN [n IN nodes(path) | n.stage_name] AS cadena, length(path) AS saltos`,
    { n1: nombre1, n2: nombre2 }
  );
  if (records.length === 0) return null;
  return {
    cadena: records[0].get('cadena'),
    saltos: records[0].get('saltos').toNumber ? records[0].get('saltos').toNumber() : Number(records[0].get('saltos')),
  };
}

// Grado de centralidad de un artista (# colaboraciones directas)
async function centralidadArtista(stageName) {
  const records = await runQuery(
    `MATCH (a:Artist {stage_name: $name})-[:COLLABORATED_WITH]-(b:Artist)
     RETURN count(b) AS grado`,
    { name: stageName }
  );
  if (records.length === 0) return 0;
  const g = records[0].get('grado');
  return g.toNumber ? g.toNumber() : Number(g);
}

module.exports = { artistasRelacionados, colaboradoresDirectos, caminoEntreArtistas, centralidadArtista };
