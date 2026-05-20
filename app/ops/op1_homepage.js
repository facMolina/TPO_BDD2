'use strict';
// OP-1: Página de inicio personalizada — 3 motores
// Flujo: Cassandra → Neo4j → MongoDB
const cass  = require('../db/cassandra');
const neo   = require('../db/neo4j');
const mongo = require('../db/mongodb');

async function op1_homepage(usuario_id, pais) {
  console.log(`\n🏠 OP-1: Homepage para ${usuario_id} (país: ${pais})`);
  const hoy = new Date().toISOString().slice(0, 10);

  // ── Paso 1: Cassandra ──────────────────────────────────────────────────────
  const [ultimasRepros, chartHoy] = await Promise.all([
    cass.ultimasReproduccionesUsuario(usuario_id, 10),
    cass.chartDiarioPais(pais, hoy, 10),
  ]);
  console.log(`   [Cassandra] ${ultimasRepros.length} últimas repros | chart ${pais}: ${chartHoy.length} canciones`);

  // ── Paso 2: Neo4j — candidatos basados en artistas más escuchados ──────────
  const artistasMasEscuchados = [...new Set(ultimasRepros.map(r => r.artista_id))].slice(0, 3);
  const candidatosNeo4j = [];
  for (const artista of artistasMasEscuchados) {
    const relacionados = await neo.artistasRelacionados(artista, 1);
    candidatosNeo4j.push(...relacionados.map(r => r.artista));
  }
  // Excluir artistas que el usuario ya escuchó
  const yaEscuchados = new Set(ultimasRepros.map(r => r.artista_id));
  const candidatosFiltrados = [...new Set(candidatosNeo4j)].filter(a => !yaEscuchados.has(a)).slice(0, 10);
  console.log(`   [Neo4j]     ${candidatosFiltrados.length} artistas candidatos para recomendación`);

  // ── Paso 3: MongoDB — enriquecer candidatos con datos maestros ─────────────
  const [songsCandidatos, songsChart] = await Promise.all([
    mongo.getArtistsByNames(candidatosFiltrados),
    mongo.getSongsByIds(chartHoy.map(r => r.cancion_id)),
  ]);
  console.log(`   [MongoDB]   ${songsCandidatos.length} artistas enriquecidos`);

  return {
    seccion_siguiendo_escuchando: ultimasRepros.map(r => ({ cancion: r.song_title, artista: r.artista_id, dispositivo: r.dispositivo })),
    seccion_trending_pais:        chartHoy.map(r => {
      const enriq = songsChart.find(s => s.title === r.song_title);
      return { cancion: r.song_title, artista: r.artista_id, reproducciones: r.reproducciones, genero: enriq?.genres?.[0] || '—' };
    }),
    seccion_recomendados:         songsCandidatos.map(a => ({ artista: a.stage_name, genero: a.main_genre, followers: a.followers })),
  };
}

module.exports = op1_homepage;
