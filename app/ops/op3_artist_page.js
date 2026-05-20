'use strict';
// OP-3: Página de artista con estadísticas — 2 motores (MongoDB + Neo4j)
// Cassandra NO participa aquí: las estadísticas de reproducciones del artista
// son costosas de calcular en tiempo real desde historial_artista para una
// vista de perfil. Se muestran en el reporte mensual (OP-5).
const mongo = require('../db/mongodb');
const neo   = require('../db/neo4j');

async function op3_artistPage(artistName) {
  console.log(`\n🎤 OP-3: Página de artista — ${artistName}`);

  // ── Paso 1: MongoDB — perfil + discografía ────────────────────────────────
  const artista = await mongo.getArtistByName(artistName);
  if (!artista) throw new Error(`Artista "${artistName}" no encontrado en MongoDB.`);

  const albums = await mongo.getAlbumsByArtistId(artista._id);
  console.log(`   [MongoDB]  ${albums.length} álbumes encontrados`);

  // ── Paso 2: Neo4j — red de colaboraciones ────────────────────────────────
  const [colaboradores, centralidad] = await Promise.all([
    neo.colaboradoresDirectos(artistName),
    neo.centralidadArtista(artistName),
  ]);
  console.log(`   [Neo4j]    ${colaboradores.length} colaboradores directos | centralidad: ${centralidad}`);

  return {
    perfil: {
      nombre:    artista.stage_name,
      genero:    artista.main_genre,
      pais:      artista.country,
      followers: artista.followers,
    },
    discografia: albums.map(a => ({ album: a.title, anio: a.release_year, genero: a.genre })),
    red_colaboraciones: {
      grado_centralidad: centralidad,
      colaboradores_directos: colaboradores.map(c => ({
        artista: c.colaborador,
        genero:  c.genero,
        cancion: c.cancion,
        tipo:    c.tipo,
      })),
    },
  };
}

module.exports = op3_artistPage;
