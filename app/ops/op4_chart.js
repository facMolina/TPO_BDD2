'use strict';
// OP-4: Generación de chart diario por país — 2 motores (Cassandra → MongoDB)
const cass  = require('../db/cassandra');
const mongo = require('../db/mongodb');

async function op4_chart(pais, fechaStr) {
  const fecha = fechaStr || new Date().toISOString().slice(0, 10);
  console.log(`\n🏆 OP-4: Chart diario — ${pais} · ${fecha}`);

  // ── Paso 1: Cassandra — top 50 por reproducciones ─────────────────────────
  const chart = await cass.chartDiarioPais(pais, fecha, 50);
  console.log(`   [Cassandra] ${chart.length} canciones en el chart`);

  if (chart.length === 0) {
    return { pais, fecha, chart: [], mensaje: 'Sin datos para esta fecha/país. Ejecutá init_cassandra.js primero.' };
  }

  // ── Paso 2: MongoDB — enriquecer con datos maestros ───────────────────────
  const cancionIds = chart.map(r => r.cancion_id);
  const songs = await mongo.getSongsByIds(cancionIds);
  const songMap = {};
  for (const s of songs) { songMap[s.title] = s; }
  console.log(`   [MongoDB]   ${songs.length} canciones enriquecidas con datos maestros`);

  // chart_counters devuelve sólo cancion_id + reproducciones (tabla COUNTER, sin columnas extra).
  // Artista y título se derivan del cancion_id "ArtistName::SongTitle" y se enriquecen con MongoDB.
  const ranking = chart.map((r, i) => {
    const [artista, titulo] = r.cancion_id.split('::');
    const enriq = songMap[titulo] || {};
    return {
      posicion:       i + 1,
      cancion:        titulo  || r.cancion_id,
      artista:        artista || '—',
      reproducciones: r.reproducciones,
      genero:         enriq.genres?.[0]  || '—',
      duracion_ms:    enriq.duration_ms  || null,
      popularidad:    enriq.popularity   || null,
    };
  });

  return { pais, fecha, total_canciones: ranking.length, chart: ranking };
}

module.exports = op4_chart;
