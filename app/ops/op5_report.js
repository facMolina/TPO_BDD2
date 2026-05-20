'use strict';
// OP-5: Reporte mensual de artista — 3 motores
// Flujo paralelo: Cassandra + MongoDB + Neo4j → ensamblar respuesta
const cass  = require('../db/cassandra');
const mongo = require('../db/mongodb');
const neo   = require('../db/neo4j');

async function op5_report(artistName, anioMes) {
  const mes = anioMes || new Date().toISOString().slice(0, 7);
  console.log(`\n📊 OP-5: Reporte mensual — ${artistName} · ${mes}`);

  // ── Los 3 motores se consultan en paralelo para minimizar latencia ─────────
  const [historialRaw, artistaMongo, colaboradoresNeo] = await Promise.all([
    cass.historialArtistaMes(artistName, mes),
    mongo.getArtistByName(artistName),
    neo.colaboradoresDirectos(artistName),
  ]);

  if (!artistaMongo) throw new Error(`Artista "${artistName}" no encontrado en MongoDB.`);

  // ── Cassandra: agregar métricas del mes ───────────────────────────────────
  const porCancion = {};
  for (const r of historialRaw) {
    const cid = r.cancion_id;
    if (!porCancion[cid]) porCancion[cid] = { cancion_id: cid, repros: 0, skips: 0, duracion_total: 0 };
    porCancion[cid].repros++;
    if (!r.completada) porCancion[cid].skips++;
    porCancion[cid].duracion_total += (r.duracion_seg || 0);
  }
  const metricas = Object.values(porCancion).map(c => ({
    cancion:       c.cancion_id.split('::')[1] || c.cancion_id,
    reproducciones: c.repros,
    tasa_skip:     c.repros > 0 ? (c.skips / c.repros).toFixed(3) : '0.000',
    duracion_total_min: (c.duracion_total / 60).toFixed(1),
    // Revenue simulado: $0.004 por reproducción completada (modelo Spotify-like)
    revenue_usd:   ((c.repros - c.skips) * 0.004).toFixed(2),
  })).sort((a, b) => b.reproducciones - a.reproducciones);
  console.log(`   [Cassandra] ${historialRaw.length} eventos → ${metricas.length} canciones con métricas`);

  // ── MongoDB: discografía ──────────────────────────────────────────────────
  const albums = await mongo.getAlbumsByArtistId(artistaMongo._id);
  console.log(`   [MongoDB]   ${albums.length} álbumes en discografía`);

  // ── Neo4j: centralidad y colaboradores del mes ────────────────────────────
  const centralidad = await neo.centralidadArtista(artistName);
  console.log(`   [Neo4j]     ${colaboradoresNeo.length} colaboradores | centralidad: ${centralidad}`);

  // Evolución de colaboraciones: en nuestro dataset son estáticas, pero se
  // documentan todas las existentes como "activas en el mes"
  const nuevosCols = colaboradoresNeo.slice(0, 5); // muestra top 5

  const totalRevenue = metricas.reduce((sum, c) => sum + parseFloat(c.revenue_usd), 0);

  return {
    artista:  artistName,
    mes,
    resumen:  {
      total_reproducciones: historialRaw.length,
      canciones_activas:    metricas.length,
      revenue_total_usd:    totalRevenue.toFixed(2),
      grado_centralidad_red: centralidad,
    },
    metricas_por_cancion: metricas,
    discografia:          albums.map(a => ({ album: a.title, anio: a.release_year })),
    red_colaboraciones:   {
      total_colaboradores: colaboradoresNeo.length,
      muestra:            nuevosCols.map(c => ({ artista: c.colaborador, genero: c.genero })),
    },
  };
}

module.exports = op5_report;
