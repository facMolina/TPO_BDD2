'use strict';
const { getMongoDB } = require('../config');

async function db() { return getMongoDB(); }

async function getSongsByIds(songTitles) {
  const d = await db();
  // songTitles es array de strings "artist::title" — extraemos el título para buscar en MongoDB
  const titles = songTitles.map(id => id.split('::')[1]).filter(Boolean);
  return d.collection('songs').find({ title: { $in: titles } }).toArray();
}

async function getSongsByArtistIds(artistIds) {
  const d = await db();
  return d.collection('songs').find({ artist_ids: { $in: artistIds } }).toArray();
}

async function getArtistByName(stageName) {
  const d = await db();
  return d.collection('artists').findOne({ stage_name: stageName });
}

async function getArtistsByNames(stageNames) {
  const d = await db();
  return d.collection('artists').find({ stage_name: { $in: stageNames } }).toArray();
}

async function getAlbumsByArtistId(artistId) {
  const d = await db();
  return d.collection('albums').find({ artist_id: artistId }).toArray();
}

async function updatePopularidadCancion(title, increment = 1) {
  const d = await db();
  return d.collection('songs').updateOne(
    { title },
    { $inc: { popularity: increment } }
  );
}

async function getPlaylistsConCrecimiento() {
  const d = await db();
  return d.collection('playlists').aggregate([
    { $addFields: {
        crecimiento_pct: {
          $multiply: [
            { $divide: [
                { $subtract: ['$followers_current', '$followers_last_month'] },
                '$followers_last_month'
            ]},
            100
          ]
        }
    }},
    { $sort: { crecimiento_pct: -1 } },
    { $project: { _id: 0, nombre: '$name', tipo: '$type', seguidores_actuales: '$followers_current', crecimiento_pct: { $round: ['$crecimiento_pct', 1] } } }
  ]).toArray();
}

module.exports = {
  getSongsByIds,
  getSongsByArtistIds,
  getArtistByName,
  getArtistsByNames,
  getAlbumsByArtistId,
  updatePopularidadCancion,
  getPlaylistsConCrecimiento,
};
