'use strict';
// OP-2: Registro de reproducción y actualización de métricas — 3 motores
// Flujo: Cassandra (escritura principal) + MongoDB (actualización condicional)
// Neo4j NO participa: no almacena eventos individuales de reproducción.
const cass  = require('../db/cassandra');
const mongo = require('../db/mongodb');

const UMBRAL_POPULARIDAD = 10; // repros en 24h para actualizar MongoDB

async function op2_playEvent({ usuario_id, cancion_id, artista_id, song_title, genero, duracion_seg, completada, dispositivo, contexto, pais }) {
  console.log(`\n▶️  OP-2: Registro de reproducción — ${usuario_id} → ${song_title}`);

  const resultado = { cassandra: null, mongodb: null, errors: [] };

  // ── Paso 1: Cassandra — escritura principal (siempre se intenta) ───────────
  try {
    const { timestamp } = await cass.registrarReproduccion({
      usuario_id, cancion_id, artista_id, song_title, genero,
      duracion_seg, completada, dispositivo, contexto, pais,
    });
    resultado.cassandra = { status: 'ok', timestamp };
    console.log(`   [Cassandra] Evento registrado en 4 tablas. Timestamp: ${timestamp.toISOString()}`);
  } catch (err) {
    resultado.errors.push({ motor: 'cassandra', message: err.message });
    console.error(`   [Cassandra] ❌ ${err.message}`);
  }

  // ── Paso 2: MongoDB — actualización condicional por umbral ────────────────
  // Solo se actualiza si la canción superó el umbral de reproducciones en 24h.
  // Esto evita escrituras por cada evento individual (demasiado volumen).
  try {
    const repros24h = await cass.totalReproduccionesCancion24h(cancion_id);
    if (repros24h >= UMBRAL_POPULARIDAD) {
      await mongo.updatePopularidadCancion(song_title, 1);
      resultado.mongodb = { status: 'ok', repros_24h: repros24h, actualizado: true };
      console.log(`   [MongoDB]   Popularidad actualizada (${repros24h} repros en 24h ≥ umbral ${UMBRAL_POPULARIDAD})`);
    } else {
      resultado.mongodb = { status: 'ok', repros_24h: repros24h, actualizado: false };
      console.log(`   [MongoDB]   Sin actualización (${repros24h} repros < umbral ${UMBRAL_POPULARIDAD})`);
    }
  } catch (err) {
    // MongoDB es best-effort: si falla, el evento ya está en Cassandra
    resultado.errors.push({ motor: 'mongodb', message: err.message });
    console.error(`   [MongoDB]   ❌ ${err.message} (evento ya registrado en Cassandra)`);
  }

  // Neo4j no participa en escrituras individuales.
  // Solo se consulta en OP-1 para recomendaciones y en OP-3 para el grafo del artista.

  if (resultado.errors.length > 0) {
    console.warn('   ⚠️  Escrituras parciales. El evento quedó en Cassandra (eventual consistency).');
  }
  return resultado;
}

module.exports = op2_playEvent;
