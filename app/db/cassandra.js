'use strict';
const { cassandraClient, KEYSPACE } = require('../config');
const cassandra = require('cassandra-driver');

function exec(query, params = []) {
  return cassandraClient.execute(query, params, { prepare: true });
}

// ─── Reproducciones ───────────────────────────────────────────────────────────

async function registrarReproduccion({ usuario_id, cancion_id, artista_id, song_title, genero, duracion_seg, completada, dispositivo, contexto, pais }) {
  const ts = new Date();
  const anioMes = ts.toISOString().slice(0, 7);

  await Promise.all([
    exec(`INSERT INTO ${KEYSPACE}.reproducciones_usuario
          (usuario_id, timestamp, cancion_id, artista_id, song_title, genero, duracion_seg, completada, dispositivo, contexto, pais)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id, ts, cancion_id, artista_id, song_title, genero, duracion_seg, completada, dispositivo, contexto, pais]),

    exec(`INSERT INTO ${KEYSPACE}.reproducciones_cancion
          (cancion_id, timestamp, usuario_id, artista_id, completada, pais, duracion_seg)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [cancion_id, ts, usuario_id, artista_id, completada, pais, duracion_seg]),

    exec(`INSERT INTO ${KEYSPACE}.historial_artista
          (artista_id, anio_mes, timestamp, cancion_id, usuario_id, completada, duracion_seg)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [artista_id, anioMes, ts, cancion_id, usuario_id, completada, duracion_seg]),
  ]);

  // Actualizar métricas horarias (COUNTER) y chart del país (COUNTER)
  const fecha = cassandra.types.LocalDate.fromString(ts.toISOString().slice(0, 10));
  const hora  = ts.getHours();
  await Promise.all([
    exec(`UPDATE ${KEYSPACE}.metricas_horarias SET reproducciones = reproducciones + 1 WHERE cancion_id = ? AND fecha = ? AND hora = ?`,
      [cancion_id, fecha, hora]),
    exec(`UPDATE ${KEYSPACE}.chart_counters SET reproducciones = reproducciones + 1 WHERE pais = ? AND fecha = ? AND cancion_id = ?`,
      [pais, fecha, cancion_id]),
  ]);
  if (!completada) {
    await exec(`UPDATE ${KEYSPACE}.metricas_horarias SET skips = skips + 1 WHERE cancion_id = ? AND fecha = ? AND hora = ?`,
      [cancion_id, fecha, hora]);
  }

  return { timestamp: ts };
}

async function ultimasReproduccionesUsuario(usuario_id, limit = 10) {
  const r = await exec(
    `SELECT usuario_id, timestamp, cancion_id, artista_id, song_title, dispositivo, contexto, completada
     FROM ${KEYSPACE}.reproducciones_usuario WHERE usuario_id = ? LIMIT ?`,
    [usuario_id, limit]
  );
  return r.rows;
}

async function historialUsuarioSemana(usuario_id) {
  const desde = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const r = await exec(
    `SELECT * FROM ${KEYSPACE}.reproducciones_usuario WHERE usuario_id = ? AND timestamp >= ?`,
    [usuario_id, desde]
  );
  return r.rows;
}

async function totalReproduccionesCancion24h(cancion_id) {
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const r = await exec(
    `SELECT COUNT(*) AS total FROM ${KEYSPACE}.reproducciones_cancion WHERE cancion_id = ? AND timestamp >= ?`,
    [cancion_id, desde]
  );
  return Number(r.rows[0]['total']);
}

async function tasaSkipCancionMes(cancion_id) {
  const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const r = await exec(
    `SELECT completada FROM ${KEYSPACE}.reproducciones_cancion WHERE cancion_id = ? AND timestamp >= ?`,
    [cancion_id, desde]
  );
  const total = r.rows.length;
  if (total === 0) return { total: 0, skips: 0, tasa_skip: null };
  const skips = r.rows.filter(row => !row.completada).length;
  return { total, skips, tasa_skip: (skips / total).toFixed(3) };
}

async function historialArtistaMes(artista_id, anioMes) {
  const r = await exec(
    `SELECT * FROM ${KEYSPACE}.historial_artista WHERE artista_id = ? AND anio_mes = ?`,
    [artista_id, anioMes]
  );
  return r.rows;
}

// ─── Charts y métricas ────────────────────────────────────────────────────────

// Lee de chart_counters (COUNTER) → soporta actualizaciones en tiempo real (OP-2).
// charts_diarios sigue disponible como snapshot histórico pre-calculado.
async function chartDiarioPais(pais, fechaStr, limit = 50) {
  const fecha = cassandra.types.LocalDate.fromString(fechaStr);
  const r = await exec(
    `SELECT pais, fecha, cancion_id, reproducciones
     FROM ${KEYSPACE}.chart_counters WHERE pais = ? AND fecha = ?`,
    [pais, fecha]
  );
  // Ordenar por reproducciones DESC en aplicación (COUNTER no admite clustering key)
  const sorted = r.rows
    .map(row => ({ ...row, reproducciones: Number(row.reproducciones) }))
    .sort((a, b) => b.reproducciones - a.reproducciones)
    .slice(0, limit);
  return sorted;
}

async function curvaHorariaCancion(cancion_id, fechaStr) {
  const fecha = cassandra.types.LocalDate.fromString(fechaStr);
  const r = await exec(
    `SELECT hora, reproducciones, skips FROM ${KEYSPACE}.metricas_horarias WHERE cancion_id = ? AND fecha = ?`,
    [cancion_id, fecha]
  );
  return r.rows;
}

async function crecimientoExplosivo(cancion_id, fechaHoy) {
  const hoyInicio  = new Date(`${fechaHoy}T00:00:00Z`);
  const hoyFin     = new Date(`${fechaHoy}T23:59:59Z`);
  const anteriorInicio = new Date(hoyInicio.getTime() - 7 * 24 * 60 * 60 * 1000);
  const anteriorFin    = new Date(hoyFin.getTime()    - 7 * 24 * 60 * 60 * 1000);

  const [hoy, anterior] = await Promise.all([
    exec(`SELECT COUNT(*) AS c FROM ${KEYSPACE}.reproducciones_cancion WHERE cancion_id = ? AND timestamp >= ? AND timestamp <= ?`, [cancion_id, hoyInicio, hoyFin]),
    exec(`SELECT COUNT(*) AS c FROM ${KEYSPACE}.reproducciones_cancion WHERE cancion_id = ? AND timestamp >= ? AND timestamp <= ?`, [cancion_id, anteriorInicio, anteriorFin]),
  ]);
  const reprosHoy      = Number(hoy.rows[0]['c']);
  const reprosAnterior = Number(anterior.rows[0]['c']);
  const crecimiento    = reprosAnterior > 0 ? ((reprosHoy - reprosAnterior) / reprosAnterior) : null;
  return { cancion_id, reprosHoy, reprosAnterior, crecimiento_pct: crecimiento !== null ? (crecimiento * 100).toFixed(1) : 'N/A', explosivo: crecimiento !== null && crecimiento > 3 };
}

// ─── Comportamiento de escucha ─────────────────────────────────────────────────

async function generoDominanteUsuarioMes(usuario_id) {
  const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const r = await exec(
    `SELECT genero FROM ${KEYSPACE}.reproducciones_usuario WHERE usuario_id = ? AND timestamp >= ?`,
    [usuario_id, desde]
  );
  const conteo = {};
  for (const row of r.rows) {
    conteo[row.genero] = (conteo[row.genero] || 0) + 1;
  }
  const sorted = Object.entries(conteo).sort((a, b) => b[1] - a[1]);
  return sorted.map(([genero, plays]) => ({ genero, plays }));
}

async function horarioPicoUsuario(usuario_id) {
  const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const r = await exec(
    `SELECT timestamp FROM ${KEYSPACE}.reproducciones_usuario WHERE usuario_id = ? AND timestamp >= ?`,
    [usuario_id, desde]
  );
  const horas = new Array(24).fill(0);
  for (const row of r.rows) {
    const h = new Date(row.timestamp).getHours();
    horas[h]++;
  }
  const max = Math.max(...horas);
  const horaPico = horas.indexOf(max);
  return { hora_pico: horaPico, reproducciones: max, distribucion: horas };
}

async function tiempoTotalEscuchaSemana(usuario_id) {
  const r = await exec(
    `SELECT SUM(duracion_seg) AS total FROM ${KEYSPACE}.reproducciones_usuario
     WHERE usuario_id = ? AND timestamp >= ?`,
    [usuario_id, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)]
  );
  const seg = Number(r.rows[0]['total']) || 0;
  return { segundos: seg, minutos: (seg / 60).toFixed(1), horas: (seg / 3600).toFixed(2) };
}

module.exports = {
  registrarReproduccion,
  ultimasReproduccionesUsuario,
  historialUsuarioSemana,
  totalReproduccionesCancion24h,
  tasaSkipCancionMes,
  historialArtistaMes,
  chartDiarioPais,
  curvaHorariaCancion,
  crecimientoExplosivo,
  generoDominanteUsuarioMes,
  horarioPicoUsuario,
  tiempoTotalEscuchaSemana,
};
