'use strict';
// =============================================================================
// CAPA DE PERSISTENCIA POLIGLOTA — Menú Interactivo
// TP2 Tema 8: Streaming Musical — MongoDB + Neo4j + Cassandra
// =============================================================================
// Uso: node app/index.js

const readline = require('readline');
const { connect, disconnect } = require('./config');

const op1 = require('./ops/op1_homepage');
const op2 = require('./ops/op2_play_event');
const op3 = require('./ops/op3_artist_page');
const op4 = require('./ops/op4_chart');
const op5 = require('./ops/op5_report');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(res => rl.question(q, res));

function printJson(obj) {
  console.log(JSON.stringify(obj, null, 2));
}

function menu() {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║       STREAMING PLATFORM — Capa Poliglota (TP2)         ║
║       MongoDB · Neo4j AuraDB · DataStax Astra            ║
╠══════════════════════════════════════════════════════════╣
║  1. Página de inicio personalizada      (OP-1 · 3 motores) ║
║  2. Registrar reproducción              (OP-2 · 3 motores) ║
║  3. Perfil de artista con estadísticas  (OP-3 · 2 motores) ║
║  4. Chart diario por país               (OP-4 · 2 motores) ║
║  5. Reporte mensual de artista          (OP-5 · 3 motores) ║
║  0. Salir                                                  ║
╚══════════════════════════════════════════════════════════╝`);
}

async function runOp1() {
  const usuario = await ask('  usuario_id (ej: User_1): ');
  const pais    = await ask('  pais (AR/US/CO/MX/ES): ');
  const result  = await op1(usuario.trim(), pais.trim().toUpperCase());
  console.log('\n── Resultado OP-1 ──');
  console.log(`\n🎵 Seguís escuchando (últimas 10 repros):`);
  result.seccion_siguiendo_escuchando.forEach((r, i) => console.log(`  ${i+1}. ${r.cancion} — ${r.artista} [${r.dispositivo}]`));
  console.log(`\n📈 Trending en ${pais.trim().toUpperCase()} hoy:`);
  result.seccion_trending_pais.forEach((r, i) => console.log(`  ${i+1}. ${r.cancion} — ${r.artista} (${r.reproducciones} plays)`));
  console.log(`\n💡 Recomendados para vos:`);
  result.seccion_recomendados.forEach(r => console.log(`  • ${r.artista} (${r.genero})`));
}

async function runOp2() {
  console.log('  Ingresá los datos de la reproducción:');
  const usuario_id  = await ask('  usuario_id (ej: User_1): ');
  const cancion_id  = await ask('  cancion_id (ej: Bad Bunny::Moscow Mule): ');
  const partes      = cancion_id.trim().split('::');
  const artista_id  = partes[0] || 'Desconocido';
  const song_title  = partes[1] || cancion_id.trim();
  const duracion    = parseInt(await ask('  duracion_seg (ej: 195): ')) || 180;
  const completada  = (await ask('  completada? (s/n): ')).trim().toLowerCase() === 's';
  const dispositivo = await ask('  dispositivo (mobile/desktop/web/smart_speaker): ');
  const contexto    = await ask('  contexto (playlist/album/search/radio): ');
  const pais        = await ask('  pais (AR/US/CO/MX/ES): ');
  const genero      = await ask('  genero (ej: Pop): ');

  const result = await op2({
    usuario_id: usuario_id.trim(),
    cancion_id: cancion_id.trim(),
    artista_id: artista_id.trim(),
    song_title: song_title.trim(),
    genero:     genero.trim(),
    duracion_seg: duracion,
    completada,
    dispositivo: dispositivo.trim(),
    contexto:    contexto.trim(),
    pais:        pais.trim().toUpperCase(),
  });
  console.log('\n── Resultado OP-2 ──');
  console.log(`  Cassandra: ${result.cassandra?.status || '❌ ' + (result.errors.find(e=>e.motor==='cassandra')?.message || 'error')}`);
  console.log(`  MongoDB:   ${result.mongodb?.status || '❌ ' + (result.errors.find(e=>e.motor==='mongodb')?.message || 'error')} ${result.mongodb?.actualizado ? '(popularidad actualizada)' : ''}`);
  if (result.errors.length > 0) console.warn('  ⚠️  Errores parciales:', result.errors.map(e => `${e.motor}: ${e.message}`).join('; '));
}

async function runOp3() {
  const artista = await ask('  nombre del artista (ej: Bad Bunny): ');
  const result  = await op3(artista.trim());
  console.log('\n── Resultado OP-3 ──');
  console.log(`\n🎤 ${result.perfil.nombre} (${result.perfil.genero} · ${result.perfil.pais})`);
  console.log(`   Followers: ${result.perfil.followers?.toLocaleString()}`);
  console.log(`\n📀 Discografía (${result.discografia.length} álbumes):`);
  result.discografia.forEach(a => console.log(`   ${a.anio} — ${a.album} (${a.genero})`));
  console.log(`\n🤝 Red de colaboraciones (centralidad: ${result.red_colaboraciones.grado_centralidad}):`);
  result.red_colaboraciones.colaboradores_directos.slice(0, 8).forEach(c =>
    console.log(`   ↔ ${c.artista} (${c.genero}) — "${c.cancion}" [${c.tipo}]`)
  );
}

async function runOp4() {
  const pais  = await ask('  pais (AR/US/CO/MX/ES): ');
  const fecha = await ask(`  fecha (YYYY-MM-DD, Enter para hoy ${new Date().toISOString().slice(0,10)}): `);
  const result = await op4(pais.trim().toUpperCase(), fecha.trim() || undefined);
  console.log('\n── Resultado OP-4 ──');
  console.log(`\n🏆 Chart ${result.pais} — ${result.fecha} (${result.total_canciones} canciones)`);
  result.chart.slice(0, 20).forEach(r =>
    console.log(`  ${String(r.posicion).padStart(2)}. ${r.cancion} — ${r.artista} (${r.reproducciones} plays · ${r.genero})`)
  );
  if (result.chart.length > 20) console.log(`  ... y ${result.chart.length - 20} más`);
}

async function runOp5() {
  const artista = await ask('  nombre del artista (ej: The Weeknd): ');
  const mes     = await ask(`  mes (YYYY-MM, Enter para ${new Date().toISOString().slice(0,7)}): `);
  const result  = await op5(artista.trim(), mes.trim() || undefined);
  console.log('\n── Resultado OP-5 ──');
  console.log(`\n📊 Reporte mensual — ${result.artista} · ${result.mes}`);
  console.log(`   Reproducciones totales: ${result.resumen.total_reproducciones}`);
  console.log(`   Revenue estimado:       $${result.resumen.revenue_total_usd} USD`);
  console.log(`   Centralidad en la red:  ${result.resumen.grado_centralidad_red} colaboraciones directas`);
  console.log(`\n🎵 Top canciones del mes:`);
  result.metricas_por_cancion.slice(0, 5).forEach((c, i) =>
    console.log(`   ${i+1}. ${c.cancion}: ${c.reproducciones} plays · skip ${(parseFloat(c.tasa_skip)*100).toFixed(0)}% · $${c.revenue_usd}`)
  );
  console.log(`\n🤝 Red de colaboraciones (${result.red_colaboraciones.total_colaboradores} colaboradores):`);
  result.red_colaboraciones.muestra.forEach(c => console.log(`   • ${c.artista} (${c.genero})`));
}

async function main() {
  try {
    process.stdout.write('Conectando a los 3 motores...');
    await connect();
  } catch (err) {
    console.error('\n❌', err.message);
    rl.close();
    return;
  }

  let continuar = true;
  while (continuar) {
    menu();
    const opcion = (await ask('\n  Elegí una opción: ')).trim();
    try {
      switch (opcion) {
        case '1': await runOp1(); break;
        case '2': await runOp2(); break;
        case '3': await runOp3(); break;
        case '4': await runOp4(); break;
        case '5': await runOp5(); break;
        case '0': continuar = false; break;
        default:  console.log('  Opción no válida.');
      }
    } catch (err) {
      console.error(`\n❌ Error en OP-${opcion}: ${err.message}`);
    }
    if (continuar) await ask('\n  Presioná Enter para continuar...');
  }

  rl.close();
  await disconnect();
  console.log('\n✅ Sesión cerrada. ¡Hasta luego!');
}

main();
