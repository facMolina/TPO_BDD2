'use strict';
// =============================================================================
// SCRIPT DE INICIALIZACIÓN — CASSANDRA (DataStax Astra)
// TP2 Tema 8: Streaming Musical
// =============================================================================
// Uso: node init_cassandra.js
// Requiere: .env con CASSANDRA_BUNDLE_PATH, CASSANDRA_TOKEN, CASSANDRA_KEYSPACE
// =============================================================================

require('dotenv').config();
const cassandra = require('cassandra-driver');
const path      = require('path');

const BUNDLE   = path.resolve(process.env.CASSANDRA_BUNDLE_PATH || './secure-connect-streaming.zip');
const TOKEN    = process.env.CASSANDRA_TOKEN;
const KEYSPACE = process.env.CASSANDRA_KEYSPACE || 'streaming';

if (!TOKEN) {
  console.error('❌ CASSANDRA_TOKEN no definido. Copiá .env.example → .env y completalo.');
  process.exit(1);
}

const client = new cassandra.Client({
  cloud:       { secureConnectBundle: BUNDLE },
  credentials: { username: 'token', password: TOKEN },
});

// ─── Dataset (mismo que init_spotify_db.js / init_neo4j.js) ──────────────────
const musicCatalog = [
  { artist: 'The Weeknd',        genre: 'Pop',        country: 'CA', songs: ['Alone Again','Too Late','Hardest To Love','Scared To Live','Snowchild','Escape From LA','Heartless','Blinding Lights'] },
  { artist: 'Taylor Swift',      genre: 'Pop',        country: 'US', songs: ['Welcome To New York','Blank Space','Style','Out Of The Woods','All You Had To Do Was Stay','Shake It Off','Bad Blood'] },
  { artist: 'Dua Lipa',          genre: 'Pop',        country: 'UK', songs: ['Future Nostalgia','Don\'t Start Now','Cool','Physical','Levitating','Pretty Please','Hallucinate'] },
  { artist: 'Ed Sheeran',        genre: 'Pop',        country: 'UK', songs: ['Eraser','Castle on the Hill','Dive','Shape of You','Perfect','Galway Girl','Happier'] },
  { artist: 'Ariana Grande',     genre: 'Pop',        country: 'US', songs: ['imagine','needy','NASA','bloodline','fake smile','bad idea','thank u, next'] },
  { artist: 'Bruno Mars',        genre: 'Pop',        country: 'US', songs: ['24K Magic','Chunky','Perm','That\'s What I Like','Versace on the Floor','Straight Up & Down','Too Good to Say Goodbye'] },
  { artist: 'Billie Eilish',     genre: 'Pop',        country: 'US', songs: ['bad guy','xanny','you should see me in a crown','all the good girls go to hell','wish you were gay','when the party\'s over','bury a friend'] },
  { artist: 'Harry Styles',      genre: 'Pop',        country: 'UK', songs: ['Music for a Sushi Restaurant','Late Night Talking','Grapejuice','As It Was','Daylight','Little Freak','Matilda'] },
  { artist: 'Adele',             genre: 'Pop',        country: 'UK', songs: ['Hello','Send My Love','I Miss You','When We Were Young','Remedy','Water Under the Bridge','River Lea'] },
  { artist: 'Coldplay',          genre: 'Pop Rock',   country: 'UK', songs: ['Politik','In My Place','God Put a Smile upon Your Face','The Scientist','Clocks','Daylight','Green Eyes'] },
  { artist: 'Imagine Dragons',   genre: 'Pop Rock',   country: 'US', songs: ['Radioactive','Tiptoe','It\'s Time','Demons','On Top of the World','Amsterdam','Hear Me'] },
  { artist: 'Maroon 5',          genre: 'Pop',        country: 'US', songs: ['Harder to Breathe','This Love','Shiver','She Will Be Loved','Tangled','The Sun','Must Get Out'] },
  { artist: 'Katy Perry',        genre: 'Pop',        country: 'US', songs: ['Teenage Dream','Last Friday Night','California Gurls','Firework','Peacock','Circle the Drain','The One That Got Away'] },
  { artist: 'Lady Gaga',         genre: 'Pop',        country: 'US', songs: ['Bad Romance','Alejandro','Monster','Speechless','Dance In The Dark','Telephone','So Happy I Could Die'] },
  { artist: 'Miley Cyrus',       genre: 'Pop',        country: 'US', songs: ['WTF Do I Know','Plastic Hearts','Angels Like You','Prisoner','Gimme What I Want','Night Crawling','Midnight Sky'] },
  { artist: 'Sam Smith',         genre: 'Pop',        country: 'UK', songs: ['Money on My Mind','Good Thing','Stay with Me','Leave Your Lover','I\'m Not the Only One','I\'ve Told You Now','Like I Can'] },
  { artist: 'Olivia Rodrigo',    genre: 'Pop',        country: 'US', songs: ['brutal','traitor','drivers license','1 step forward, 3 steps back','deja vu','good 4 u','enough for you'] },
  { artist: 'Justin Bieber',     genre: 'Pop',        country: 'CA', songs: ['Mark My Words','I\'ll Show You','What Do You Mean?','Sorry','Love Yourself','Company','No Pressure'] },
  { artist: 'Shawn Mendes',      genre: 'Pop',        country: 'CA', songs: ['Ruin','Mercy','Treat You Better','Three Empty Words','Don\'t Be a Fool','Like This','No Promises'] },
  { artist: 'Charlie Puth',      genre: 'Pop',        country: 'US', songs: ['The Way I Am','Attention','LA Girls','How Long','Done for Me','Patient','If You Leave Me Now'] },
  { artist: 'Bad Bunny',         genre: 'Urbano',     country: 'PR', songs: ['Moscow Mule','Después de la Playa','Me Porto Bonito','Tití Me Preguntó','Un Ratito','Yo No Soy Celoso','Tarot'] },
  { artist: 'J Balvin',          genre: 'Urbano',     country: 'CO', songs: ['Amarillo','Azul','Rojo','Rosa','Morado','Verde','Negro'] },
  { artist: 'Daddy Yankee',      genre: 'Reggaeton',  country: 'PR', songs: ['Intro','King Daddy','Dale Caliente','No Me Dejes Solo','Gasolina','Corazones','Lo Que Paso, Paso'] },
  { artist: 'Karol G',           genre: 'Urbano',     country: 'CO', songs: ['Mientras Me Curo Del Cora','X Si Volvemos','Pero Tú','Besties','Gucci Los Paños','TQG','Tus Gafitas'] },
  { artist: 'Rosalía',           genre: 'Urbano',     country: 'ES', songs: ['SAOKO','CANDY','LA FAMA','BULERÍAS','CHICKEN TERIYAKI','HENTAI','BIZCOCHITO'] },
  { artist: 'Rauw Alejandro',    genre: 'Urbano',     country: 'PR', songs: ['Todo De Ti','Sexo Virtual','Nubes','Cúrame','Aquel Nap ZzZz','Desenfocao','La Old Skul'] },
  { artist: 'Feid',              genre: 'Urbano',     country: 'CO', songs: ['Intro','Castigo','Feliz Cumpleaños Ferxxo','Nieve','Ferxxo 100','Belixe','XQ Te Pones Así'] },
  { artist: 'Ozuna',             genre: 'Urbano',     country: 'PR', songs: ['Aura','Me Dijeron','Vaina Loca','Devuélveme','Quiero Más','Tu Olor','Ibiza'] },
  { artist: 'Maluma',            genre: 'Urbano',     country: 'CO', songs: ['Medallo City','Bella-K','Hawái','Cielo a un Diablo','Perdón','La Cura','Luz Verde'] },
  { artist: 'Shakira',           genre: 'Pop Latino', country: 'CO', songs: ['En Tus Pupilas','La Pared','La Tortura','Obtener un Sí','Día Especial','Escondite Inglés','No'] },
  { artist: 'Duki',              genre: 'Trap',       country: 'AR', songs: ['Sudor y Trabajo','Pintao','Chico Estrella','Volando Bajito','Cuanto','Cascada','Malbec'] },
  { artist: 'Bizarrap',          genre: 'Urbano',     country: 'AR', songs: ['Quevedo: Bzrp Music Sessions','Shakira: Bzrp Music Sessions','Villano Antillano: Bzrp Music Sessions','Duki: Bzrp Music Sessions','Tiago PZK: Bzrp Music Sessions','Nathy Peluso: Bzrp Music Sessions','L-Gante: Bzrp Music Sessions'] },
  { artist: 'YSY A',             genre: 'Trap',       country: 'AR', songs: ['Desfilar Mis Penas','Buenos Aires Es Tarima','Para Sacármelo','Alma','Vuelta a la Luna','Bailando Te','No Dejo de Pensar'] },
  { artist: 'Trueno',            genre: 'Hip Hop',    country: 'AR', songs: ['Hoop Hoop','Fuck El Police','Dance Crip','Solo Por Vos','Lo Tengo','Panamá','Tierra Zanta'] },
  { artist: 'Wos',               genre: 'Hip Hop',    country: 'AR', songs: ['Canguro','Fresco','Pantano','Melón Vino','Luz Delito','Okupa','No Va a Bajar'] },
  { artist: 'Emilia',            genre: 'Pop',        country: 'AR', songs: ['Facts.mp3','Jagger.mp3','Jet_Set.mp3','Iconic.mp3','La_Original.mp3','GTA.mp3','Exclusive.mp3'] },
  { artist: 'TINI',              genre: 'Pop',        country: 'AR', songs: ['Cupido','Te Pido','Muñecas','El Último Beso','Carne y Hueso','La Loto','Las Jordans'] },
  { artist: 'Maria Becerra',     genre: 'Pop',        country: 'AR', songs: ['Perreo Furioso','Automático','Cuando Hacemos El Amor','Ojalá','Adiós','Hasta Que La Muerte','Doble Vida'] },
  { artist: 'Milo J',            genre: 'Urbano',     country: 'AR', songs: ['Tu Manta','M.A.I','Sincera','Toy en el Mic','No Soy Eterno','A1','Carencias de Cordura'] },
  { artist: 'Peso Pluma',        genre: 'Corridos',   country: 'MX', songs: ['ROSA PASTEL','LUNA','77','RUBICON','CARNAL','GAVILÁN II','VVS'] },
  { artist: 'Drake',             genre: 'Hip Hop',    country: 'CA', songs: ['Survival','Nonstop','Elevate','Emotionless','God\'s Plan','I\'m Upset','8 Out Of 10'] },
  { artist: 'Kendrick Lamar',    genre: 'Hip Hop',    country: 'US', songs: ['BLOOD.','DNA.','YAH.','ELEMENT.','FEEL.','LOYALTY.','PRIDE.'] },
  { artist: 'Travis Scott',      genre: 'Hip Hop',    country: 'US', songs: ['STARGAZING','CAROUSEL','SICKO MODE','R.I.P. SCREW','STOP TRYING TO BE GOD','NO BYSTANDERS','SKELETONS'] },
  { artist: 'Post Malone',       genre: 'Hip Hop',    country: 'US', songs: ['Hollywood\'s Bleeding','Saint-Tropez','Enemies','Allergic','A Thousand Bad Times','Circles','Die for Me'] },
  { artist: 'SZA',               genre: 'R&B',        country: 'US', songs: ['SOS','Kill Bill','Seek & Destroy','Low','Love Language','Blind','Used'] },
  { artist: 'Frank Ocean',       genre: 'R&B',        country: 'US', songs: ['Nikes','Ivy','Pink + White','Be Yourself','Solo','Skyline To','Self Control'] },
  { artist: 'J. Cole',           genre: 'Hip Hop',    country: 'US', songs: ['Intro','January 28th','Wet Dreamz','03\' Adolescence','A Tale of 2 Citiez','Fire Squad','St. Tropez'] },
  { artist: 'Tyler, The Creator',genre: 'Hip Hop',    country: 'US', songs: ['IGOR\'S THEME','EARFQUAKE','I THINK','EXACTLY WHAT YOU RUN FROM','RUNNING OUT OF TIME','NEW MAGIC WAND','A BOY IS A GUN*'] },
  { artist: 'Kanye West',        genre: 'Hip Hop',    country: 'US', songs: ['Good Morning','Champion','Stronger','I Wonder','Good Life','Can\'t Tell Me Nothing','Barry Bonds'] },
  { artist: 'Eminem',            genre: 'Hip Hop',    country: 'US', songs: ['White America','Business','Cleanin\' Out My Closet','Square Dance','The Kiss','Soldier','Say Goodbye Hollywood'] },
  { artist: 'Snoop Dogg',        genre: 'Hip Hop',    country: 'US', songs: ['Bathtub','G Funk Intro','Gin and Juice','Tha Shiznit','Lodi Dodi','Murder Was the Case','Serial Killa'] },
  { artist: '50 Cent',           genre: 'Hip Hop',    country: 'US', songs: ['Intro','What Up Gangsta','Patiently Waiting','Many Men','In Da Club','High All the Time','Blood Hound'] },
  { artist: 'Jay-Z',             genre: 'Hip Hop',    country: 'US', songs: ['The Ruler\'s Back','Takeover','Izzo','Girls, Girls, Girls','Jigga That Nigga','U Don\'t Know','Hola\' Hovito'] },
  { artist: 'Rihanna',           genre: 'R&B',        country: 'BB', songs: ['Consideration','James Joint','Kiss It Better','Work','Desperado','Woo','Needed Me'] },
  { artist: 'Beyoncé',           genre: 'R&B',        country: 'US', songs: ['Pray You Catch Me','Hold Up','Don\'t Hurt Yourself','Sorry','6 Inch','Daddy Lessons','Love Drought'] },
  { artist: 'Doja Cat',          genre: 'Hip Hop',    country: 'US', songs: ['Woman','Naked','Payday','Get Into It','Need to Know','I Don\'t Do Drugs','Love To Dream'] },
  { artist: 'Nicki Minaj',       genre: 'Hip Hop',    country: 'TT', songs: ['All Things Go','I Lied','The Crying Game','Get On Your Knees','Feeling Myself','Only','Want Some More'] },
  { artist: 'Cardi B',           genre: 'Hip Hop',    country: 'US', songs: ['Get Up 10','Drip','Bickenhead','Bodak Yellow','Be Careful','Best Life','I Like It'] },
  { artist: 'Megan Thee Stallion',genre:'Hip Hop',    country: 'US', songs: ['Shots Fired','Circles','Cry Baby','Do It On The Tip','Sugar Baby','Movie','Freaky Girls'] },
  { artist: 'Mac Miller',        genre: 'Hip Hop',    country: 'US', songs: ['Come Back to Earth','Hurt Feelings','What\'s the Use?','Perfecto','Self Care','Wings','Ladders'] },
  { artist: 'Queen',             genre: 'Rock',       country: 'UK', songs: ['Death on Two Legs','Lazing on a Sunday Afternoon','I\'m in Love with My Car','You\'re My Best Friend','\'39','Sweet Lady','Seaside Rendezvous','Bohemian Rhapsody'] },
  { artist: 'The Beatles',       genre: 'Rock',       country: 'UK', songs: ['Come Together','Something','Maxwell\'s Silver Hammer','Oh! Darling','Octopus\'s Garden','I Want You','Here Comes the Sun'] },
  { artist: 'Pink Floyd',        genre: 'Rock',       country: 'UK', songs: ['Speak to Me','Breathe','On the Run','Time','The Great Gig in the Sky','Money','Us and Them'] },
  { artist: 'Arctic Monkeys',    genre: 'Indie Rock', country: 'UK', songs: ['Do I Wanna Know?','R U Mine?','One for the Road','Arabella','I Want It All','No. 1 Party Anthem','Mad Sounds'] },
  { artist: 'The Strokes',       genre: 'Indie Rock', country: 'US', songs: ['Is This It','The Modern Age','Soma','Barely Legal','Someday','Alone, Together','Last Nite'] },
  { artist: 'Nirvana',           genre: 'Grunge',     country: 'US', songs: ['Smells Like Teen Spirit','In Bloom','Come as You Are','Breed','Lithium','Polly','Territorial Pissings'] },
  { artist: 'Guns N\' Roses',    genre: 'Rock',       country: 'US', songs: ['Welcome to the Jungle','It\'s So Easy','Nightrain','Out ta Get Me','Mr. Brownstone','Paradise City','My Michelle'] },
  { artist: 'Metallica',         genre: 'Metal',      country: 'US', songs: ['Battery','Master of Puppets','The Thing That Should Not Be','Welcome Home','Disposable Heroes','Leper Messiah','Orion'] },
  { artist: 'AC/DC',             genre: 'Rock',       country: 'AU', songs: ['Hells Bells','Shoot to Thrill','What Do You Do for Money Honey','Given the Dog a Bone','Let Me Put My Love into You','Back in Black','You Shook Me All Night Long'] },
  { artist: 'Red Hot Chili Peppers',genre:'Rock',     country: 'US', songs: ['Around the World','Parallel Universe','Scar Tissue','Otherside','Get on Top','Californication','Easily'] },
  { artist: 'Linkin Park',       genre: 'Nu Metal',   country: 'US', songs: ['Papercut','One Step Closer','With You','Points of Authority','Crawling','Runaway','In the End'] },
  { artist: 'Green Day',         genre: 'Punk Rock',  country: 'US', songs: ['American Idiot','Jesus of Suburbia','Holiday','Boulevard of Broken Dreams','Are We the Waiting','St. Jimmy','Give Me Novacaine'] },
  { artist: 'Foo Fighters',      genre: 'Rock',       country: 'US', songs: ['Doll','Monkey Wrench','Hey, Johnny Park!','My Poor Brain','Wind Up','Up in Arms','My Hero','Everlong'] },
  { artist: 'Radiohead',         genre: 'Alternative',country: 'UK', songs: ['Airbag','Paranoid Android','Subterranean Homesick Alien','Exit Music','Let Down','Karma Police','Fitter Happier'] },
  { artist: 'Muse',              genre: 'Alternative',country: 'UK', songs: ['Take a Bow','Starlight','Supermassive Black Hole','Map of the Problematique','Soldier\'s Poem','Invincible','Assassin'] },
  { artist: 'The Killers',       genre: 'Alternative',country: 'US', songs: ['Jenny Was a Friend of Mine','Mr. Brightside','Smile Like You Mean It','Somebody Told Me','All These Things That I\'ve Done','Andy, You\'re a Star','On Top'] },
  { artist: 'Gorillaz',          genre: 'Alternative',country: 'UK', songs: ['Intro','Last Living Souls','Kids with Guns','O Green World','Dirty Harry','Feel Good Inc.','El Mañana'] },
  { artist: 'Daft Punk',         genre: 'Electronic', country: 'FR', songs: ['Give Life Back to Music','The Game of Love','Giorgio by Moroder','Within','Instant Crush','Lose Yourself to Dance','Touch','Get Lucky'] },
  { artist: 'Oasis',             genre: 'Rock',       country: 'UK', songs: ['Hello','Roll with It','Wonderwall','Don\'t Look Back in Anger','Hey Now!','Some Might Say','Cast No Shadow'] },
  { artist: 'Soda Stereo',       genre: 'Rock Latino',country: 'AR', songs: ['En el Séptimo Día','Un Millón de Años Luz','Canción Animal','1990','Sueles Dejarme Solo','De Música Ligera','Hombre al Agua'] },
];

// Construir lista plana de canciones (igual que init_neo4j.js)
const allSongs = musicCatalog.flatMap(entry =>
  entry.songs.map(title => ({
    cancion_id:  `${entry.artist}::${title}`,
    artista_id:  entry.artist,
    titulo:      title,
    genero:      entry.genre,
    pais_artista: entry.country,
  }))
);

const USERS    = Array.from({ length: 200 }, (_, i) => `User_${i + 1}`);
const PAISES   = ['AR', 'US', 'ES', 'CO', 'MX'];
const DEVICES  = ['mobile', 'desktop', 'web', 'smart_speaker'];
const CONTEXTOS = ['playlist', 'album', 'search', 'radio'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function msAgo(ms) { return new Date(Date.now() - ms); }
function daysAgo(n) { return msAgo(n * 24 * 60 * 60 * 1000); }

// ─── DDL ─────────────────────────────────────────────────────────────────────
const DDL = [
  `CREATE TABLE IF NOT EXISTS ${KEYSPACE}.reproducciones_usuario (
    usuario_id   TEXT,
    timestamp    TIMESTAMP,
    cancion_id   TEXT,
    artista_id   TEXT,
    song_title   TEXT,
    genero       TEXT,
    duracion_seg INT,
    completada   BOOLEAN,
    dispositivo  TEXT,
    contexto     TEXT,
    pais         TEXT,
    PRIMARY KEY (usuario_id, timestamp)
  ) WITH CLUSTERING ORDER BY (timestamp DESC)`,

  `CREATE TABLE IF NOT EXISTS ${KEYSPACE}.reproducciones_cancion (
    cancion_id   TEXT,
    timestamp    TIMESTAMP,
    usuario_id   TEXT,
    artista_id   TEXT,
    completada   BOOLEAN,
    pais         TEXT,
    duracion_seg INT,
    PRIMARY KEY (cancion_id, timestamp)
  ) WITH CLUSTERING ORDER BY (timestamp DESC)`,

  `CREATE TABLE IF NOT EXISTS ${KEYSPACE}.metricas_horarias (
    cancion_id     TEXT,
    fecha          DATE,
    hora           INT,
    reproducciones COUNTER,
    skips          COUNTER,
    PRIMARY KEY ((cancion_id, fecha), hora)
  ) WITH CLUSTERING ORDER BY (hora ASC)`,

  `CREATE TABLE IF NOT EXISTS ${KEYSPACE}.charts_diarios (
    pais           TEXT,
    fecha          DATE,
    reproducciones INT,
    cancion_id     TEXT,
    artista_id     TEXT,
    song_title     TEXT,
    PRIMARY KEY ((pais, fecha), reproducciones, cancion_id)
  ) WITH CLUSTERING ORDER BY (reproducciones DESC, cancion_id ASC)`,

  `CREATE TABLE IF NOT EXISTS ${KEYSPACE}.historial_artista (
    artista_id   TEXT,
    anio_mes     TEXT,
    timestamp    TIMESTAMP,
    cancion_id   TEXT,
    usuario_id   TEXT,
    completada   BOOLEAN,
    duracion_seg INT,
    PRIMARY KEY ((artista_id, anio_mes), timestamp)
  ) WITH CLUSTERING ORDER BY (timestamp DESC)`,

  // Tabla COUNTER para actualizaciones en tiempo real del chart (OP-2).
  // charts_diarios mantiene el snapshot pre-calculado; chart_counters recibe
  // cada nuevo evento y permite consultar el ranking live sin leer toda la tabla.
  `CREATE TABLE IF NOT EXISTS ${KEYSPACE}.chart_counters (
    pais           TEXT,
    fecha          DATE,
    cancion_id     TEXT,
    reproducciones COUNTER,
    PRIMARY KEY ((pais, fecha), cancion_id)
  )`,
];

// ─── Helpers de inserción ─────────────────────────────────────────────────────
async function exec(query, params = []) {
  return client.execute(query, params, { prepare: true });
}

async function createTablesAndKeyspace() {
  // En Astra el keyspace ya existe — no se puede hacer CREATE KEYSPACE
  console.log(`\n📋 Creando tablas en keyspace "${KEYSPACE}"...`);
  for (const ddl of DDL) {
    await client.execute(ddl);
  }
  console.log('✅ 6 tablas creadas (o ya existían).');
}

async function loadEvents(totalEvents = 5000) {
  console.log(`\n▶️  Generando ${totalEvents} eventos de reproducción...`);

  // Acumuladores en memoria para charts y métricas
  // key: "pais|fecha|cancion_id" → count
  const chartCount   = {};  // para charts_diarios
  // key: "cancion_id|fecha|hora" → { repros, skips }
  const metricCount  = {};

  const INSERT_REPRO_USUARIO = `INSERT INTO ${KEYSPACE}.reproducciones_usuario
    (usuario_id, timestamp, cancion_id, artista_id, song_title, genero, duracion_seg, completada, dispositivo, contexto, pais)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const INSERT_REPRO_CANCION = `INSERT INTO ${KEYSPACE}.reproducciones_cancion
    (cancion_id, timestamp, usuario_id, artista_id, completada, pais, duracion_seg)
    VALUES (?, ?, ?, ?, ?, ?, ?)`;

  const INSERT_HIST_ARTISTA = `INSERT INTO ${KEYSPACE}.historial_artista
    (artista_id, anio_mes, timestamp, cancion_id, usuario_id, completada, duracion_seg)
    VALUES (?, ?, ?, ?, ?, ?, ?)`;

  const BATCH_SIZE = 100;
  let inserted = 0;

  for (let b = 0; b < totalEvents / BATCH_SIZE; b++) {
    const promises = [];

    for (let i = 0; i < BATCH_SIZE; i++) {
      const song      = pick(allSongs);
      const userId    = pick(USERS);
      const pais      = pick(PAISES);
      const ts        = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));
      const duracion  = 120 + Math.floor(Math.random() * 180);
      const completada = Math.random() > 0.3;
      const dispositivo = pick(DEVICES);
      const contexto    = pick(CONTEXTOS);

      const fechaStr  = ts.toISOString().slice(0, 10);  // YYYY-MM-DD
      const hora      = ts.getHours();
      const anioMes   = ts.toISOString().slice(0, 7);   // YYYY-MM

      // Acumular para charts
      const chartKey = `${pais}|${fechaStr}|${song.cancion_id}`;
      chartCount[chartKey] = (chartCount[chartKey] || { cancion_id: song.cancion_id, artista_id: song.artista_id, song_title: song.titulo, pais, fecha: fechaStr, count: 0 });
      chartCount[chartKey].count++;

      // Acumular para métricas
      const metKey = `${song.cancion_id}|${fechaStr}|${hora}`;
      if (!metricCount[metKey]) metricCount[metKey] = { cancion_id: song.cancion_id, fecha: fechaStr, hora, repros: 0, skips: 0 };
      metricCount[metKey].repros++;
      if (!completada) metricCount[metKey].skips++;

      promises.push(exec(INSERT_REPRO_USUARIO, [userId, ts, song.cancion_id, song.artista_id, song.titulo, song.genero, duracion, completada, dispositivo, contexto, pais]));
      promises.push(exec(INSERT_REPRO_CANCION, [song.cancion_id, ts, userId, song.artista_id, completada, pais, duracion]));
      promises.push(exec(INSERT_HIST_ARTISTA,  [song.artista_id, anioMes, ts, song.cancion_id, userId, completada, duracion]));
    }

    await Promise.all(promises);
    inserted += BATCH_SIZE;
    process.stdout.write(`\r   ⏳ ${inserted} / ${totalEvents} eventos`);
  }
  console.log(`\n✅ ${totalEvents} eventos insertados en reproducciones_usuario, reproducciones_cancion e historial_artista.`);

  return { chartCount, metricCount };
}

async function loadMetricas(metricCount) {
  console.log('\n📊 Cargando métricas horarias (COUNTER)...');
  const UPDATE_METRICS = `UPDATE ${KEYSPACE}.metricas_horarias
    SET reproducciones = reproducciones + ?, skips = skips + ?
    WHERE cancion_id = ? AND fecha = ? AND hora = ?`;

  const entries = Object.values(metricCount);
  for (let i = 0; i < entries.length; i += 50) {
    await Promise.all(
      entries.slice(i, i + 50).map(m =>
        exec(UPDATE_METRICS, [
          cassandra.types.Long.fromNumber(m.repros),
          cassandra.types.Long.fromNumber(m.skips),
          m.cancion_id,
          cassandra.types.LocalDate.fromString(m.fecha),
          m.hora,
        ])
      )
    );
  }
  console.log(`✅ ${entries.length} filas de métricas horarias cargadas.`);
}

async function loadCharts(chartCount) {
  console.log('\n🏆 Cargando charts diarios...');
  const INSERT_CHART = `INSERT INTO ${KEYSPACE}.charts_diarios
    (pais, fecha, reproducciones, cancion_id, artista_id, song_title)
    VALUES (?, ?, ?, ?, ?, ?)`;

  const entries = Object.values(chartCount);
  for (let i = 0; i < entries.length; i += 100) {
    await Promise.all(
      entries.slice(i, i + 100).map(c =>
        exec(INSERT_CHART, [
          c.pais,
          cassandra.types.LocalDate.fromString(c.fecha),
          c.count,
          c.cancion_id,
          c.artista_id,
          c.song_title,
        ])
      )
    );
  }
  console.log(`✅ ${entries.length} filas de charts diarios cargadas.`);
}

async function loadChartCounters(chartCount) {
  console.log('\n🔢 Cargando chart_counters (COUNTER, para actualizaciones live)...');
  const UPDATE_COUNTER = `UPDATE ${KEYSPACE}.chart_counters
    SET reproducciones = reproducciones + ?
    WHERE pais = ? AND fecha = ? AND cancion_id = ?`;

  const entries = Object.values(chartCount);
  for (let i = 0; i < entries.length; i += 100) {
    await Promise.all(
      entries.slice(i, i + 100).map(c =>
        exec(UPDATE_COUNTER, [
          cassandra.types.Long.fromNumber(c.count),
          c.pais,
          cassandra.types.LocalDate.fromString(c.fecha),
          c.cancion_id,
        ])
      )
    );
  }
  console.log(`✅ ${entries.length} filas de chart_counters cargadas.`);
}

async function verify() {
  console.log('\n📊 Verificación de carga:');
  const tables = ['reproducciones_usuario', 'reproducciones_cancion', 'metricas_horarias', 'charts_diarios', 'historial_artista', 'chart_counters'];
  for (const t of tables) {
    const r = await client.execute(`SELECT COUNT(*) FROM ${KEYSPACE}.${t}`);
    console.log(`   ${t.padEnd(30)}: ${r.rows[0]['count']}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  try {
    await client.connect();
    console.log('✅ Conectado a DataStax Astra');

    await createTablesAndKeyspace();
    const { chartCount, metricCount } = await loadEvents(5000);
    await loadMetricas(metricCount);
    await loadCharts(chartCount);
    await loadChartCounters(chartCount);
    await verify();

    console.log('\n🚀 Carga Cassandra completa.');
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.message.includes('ENOENT') || err.message.includes('secure-connect')) {
      console.error('   → Asegurate de que CASSANDRA_BUNDLE_PATH apunta al archivo .zip correcto.');
    }
  } finally {
    await client.shutdown();
  }
}

main();
