'use strict';
// =============================================================================
// CONSULTAS MONGODB — TP1 Tema 8: Streaming Musical
// Base de datos: ing-datos-II
// Req 4 (Sección 3.1) — 5 consultas funcionales
// =============================================================================
// Uso: node queries_mongodb.js
// Requiere: MONGO_URI en .env o variable de entorno
// =============================================================================

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const readline = require('readline');

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME   = process.env.MONGO_DB || 'ing-datos-II';

if (!MONGO_URI) {
  console.error('❌ MONGO_URI no definido. Copiá .env.example → .env y completalo.');
  process.exit(1);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// =============================================================================
// QUERY 4a
// Las 10 canciones más reproducidas globalmente en las últimas 24 horas,
// con nombre del artista y álbum.
// =============================================================================
async function query4a(db) {
  console.log('\n─── QUERY 4a: Top 10 canciones últimas 24h ───');
  const since = daysAgo(1);
  const results = await db.collection('plays').aggregate([
    { $match: { timestamp: { $gte: since } } },
    { $group: {
        _id:          '$song_id',
        song_title:   { $first: '$song_title' },
        artist_name:  { $first: '$artist_name' },
        album_name:   { $first: '$album_name' },
        reproducciones: { $sum: 1 }
    }},
    { $sort:  { reproducciones: -1 } },
    { $limit: 10 },
    { $project: {
        _id: 0,
        cancion:       '$song_title',
        artista:       '$artist_name',
        album:         '$album_name',
        reproducciones: 1
    }}
  ]).toArray();

  if (results.length === 0) {
    console.log('  Sin reproducciones en las últimas 24h. Probá con daysAgo(7) para ampliar el rango.');
  } else {
    results.forEach((r, i) => console.log(`  ${i + 1}. ${r.cancion} — ${r.artista} (${r.album}) → ${r.reproducciones} plays`));
  }
  return results;
}

// =============================================================================
// QUERY 4b  ← CORRECCIÓN TP1
// Dado un usuario, obtener su historial de reproducciones de la última semana
// AGRUPADO POR ARTISTA Y GÉNERO (ambos en el mismo $group).
//
// Error en la entrega anterior: solo se agrupaba por un campo (artista OR género).
// Corrección: _id compuesto { artista, genero } para agrupar por los dos simultáneamente.
// =============================================================================
async function query4b(db, userName = 'User_1') {
  console.log(`\n─── QUERY 4b: Historial última semana de ${userName} (por artista + género) ───`);
  const since = daysAgo(7);

  // Primero obtenemos el user_id desde la colección users
  const user = await db.collection('users').findOne({ name: userName });
  if (!user) { console.log(`  Usuario "${userName}" no encontrado.`); return []; }

  const results = await db.collection('plays').aggregate([
    { $match: { user_id: user._id, timestamp: { $gte: since } } },
    // genres es array — tomamos el primer elemento (cada canción tiene 1 género en este dataset)
    { $group: {
        _id: {
          artista: '$artist_name',
          genero:  { $arrayElemAt: ['$genres', 0] }
        },
        reproducciones: { $sum: 1 },
        canciones_distintas: { $addToSet: '$song_id' }
    }},
    { $sort: { reproducciones: -1 } },
    { $project: {
        _id: 0,
        artista:             '$_id.artista',
        genero:              '$_id.genero',
        reproducciones:       1,
        canciones_distintas: { $size: '$canciones_distintas' }
    }}
  ]).toArray();

  if (results.length === 0) {
    console.log('  Sin reproducciones en los últimos 7 días para este usuario.');
  } else {
    results.forEach(r => console.log(`  ${r.artista} (${r.genero}) → ${r.reproducciones} plays, ${r.canciones_distintas} canciones distintas`));
  }
  return results;
}

// =============================================================================
// QUERY 4c
// Canciones con alta cantidad de reproducciones pero baja tasa de completitud
// (los usuarios las cortan antes de terminar).
// Criterio: >50 reproducciones y tasa de completitud < 40%.
// =============================================================================
async function query4c(db) {
  console.log('\n─── QUERY 4c: Canciones muy reproducidas pero poco completadas ───');
  const results = await db.collection('plays').aggregate([
    { $group: {
        _id:           '$song_id',
        song_title:    { $first: '$song_title' },
        artist_name:   { $first: '$artist_name' },
        total_plays:   { $sum: 1 },
        completed_plays: { $sum: { $cond: ['$completed', 1, 0] } }
    }},
    { $addFields: {
        tasa_completitud: { $divide: ['$completed_plays', '$total_plays'] }
    }},
    { $match: {
        total_plays:      { $gt: 50 },
        tasa_completitud: { $lt: 0.4 }
    }},
    { $sort: { total_plays: -1 } },
    { $limit: 10 },
    { $project: {
        _id: 0,
        cancion:         '$song_title',
        artista:         '$artist_name',
        total_plays:      1,
        tasa_completitud: { $round: ['$tasa_completitud', 2] }
    }}
  ]).toArray();

  if (results.length === 0) {
    console.log('  No hay canciones que cumplan el criterio (>50 plays y <40% completitud).');
  } else {
    results.forEach(r => console.log(`  ${r.cancion} — ${r.artista}: ${r.total_plays} plays, ${(r.tasa_completitud * 100).toFixed(0)}% completadas`));
  }
  return results;
}

// =============================================================================
// QUERY 4d
// Playlists con mayor crecimiento de seguidores en el último mes.
// Métrica: (followers_current - followers_last_month) / followers_last_month
// =============================================================================
async function query4d(db) {
  console.log('\n─── QUERY 4d: Playlists con mayor crecimiento de seguidores ───');
  const results = await db.collection('playlists').aggregate([
    { $addFields: {
        crecimiento_absoluto:  { $subtract: ['$followers_current', '$followers_last_month'] },
        crecimiento_porcentual: {
          $multiply: [
            { $divide: [
                { $subtract: ['$followers_current', '$followers_last_month'] },
                '$followers_last_month'
            ]},
            100
          ]
        }
    }},
    { $sort: { crecimiento_porcentual: -1 } },
    { $project: {
        _id: 0,
        nombre:                '$name',
        tipo:                  '$type',
        seguidores_actuales:   '$followers_current',
        crecimiento_absoluto:   1,
        crecimiento_porcentual: { $round: ['$crecimiento_porcentual', 1] }
    }}
  ]).toArray();

  results.forEach(r => console.log(`  ${r.nombre} (${r.tipo}): +${r.crecimiento_absoluto} seguidores (${r.crecimiento_porcentual}%)`));
  return results;
}

// =============================================================================
// QUERY 4e
// Para un usuario premium, recomendar álbumes completos basados en artistas
// que escucha frecuentemente (>= 3 plays del artista en el último mes).
// =============================================================================
async function query4e(db, userName = 'User_5') {
  console.log(`\n─── QUERY 4e: Recomendación de álbumes para usuario premium ${userName} ───`);

  const user = await db.collection('users').findOne({ name: userName, plan: 'premium' });
  if (!user) { console.log(`  "${userName}" no es un usuario premium o no existe.`); return []; }

  const since = daysAgo(30);

  // Artistas más escuchados por el usuario en el último mes
  const topArtists = await db.collection('plays').aggregate([
    { $match: { user_id: user._id, timestamp: { $gte: since } } },
    { $group: { _id: '$artist_id', artist_name: { $first: '$artist_name' }, plays: { $sum: 1 } } },
    { $match: { plays: { $gte: 3 } } },
    { $sort:  { plays: -1 } },
    { $limit: 5 }
  ]).toArray();

  if (topArtists.length === 0) {
    console.log('  Sin suficiente historial para recomendar álbumes.');
    return [];
  }

  const topArtistIds = topArtists.map(a => a._id);

  // Álbumes de esos artistas que el usuario NO ha escuchado
  const listenedAlbumNames = await db.collection('plays')
    .distinct('album_name', { user_id: user._id, timestamp: { $gte: since } });

  const recommendations = await db.collection('albums').aggregate([
    { $match: { artist_id: { $in: topArtistIds }, title: { $nin: listenedAlbumNames } } },
    { $lookup: { from: 'artists', localField: 'artist_id', foreignField: '_id', as: 'artista' } },
    { $unwind: '$artista' },
    { $project: {
        _id: 0,
        album:   '$title',
        artista: '$artista.stage_name',
        anio:    '$release_year',
        genero:  '$genre'
    }}
  ]).toArray();

  if (recommendations.length === 0) {
    console.log('  El usuario ya escuchó todos los álbumes disponibles.');
  } else {
    recommendations.forEach(r => console.log(`  📀 ${r.album} — ${r.artista} (${r.anio}, ${r.genero})`));
  }
  return recommendations;
}

// =============================================================================
// Runner
// =============================================================================
async function main() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    console.log(`✅ Conectado a MongoDB Atlas: ${DB_NAME}`);

    await query4a(db);
    await query4b(db, 'User_1');
    await query4c(db);
    await query4d(db);
    await query4e(db, 'User_5');

    console.log('\n✅ Todas las queries ejecutadas correctamente.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
  }
}

main();
