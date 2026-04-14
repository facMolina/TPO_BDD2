// ============================================================================
// SCRIPT DE INICIALIZACIÓN - STREAMING MUSICAL (MONGOSH)
// ============================================================================

// Seleccionamos explícitamente la base de datos
db = db.getSiblingDB('ing-datos-II');
console.log(`\n✅ Conectado a la base de datos: ${db.getName()}`);

// ============================================================================
console.log("\n🧹 PASO 1: Limpiando colecciones existentes...");
db.users.drop();
db.artists.drop();
db.albums.drop();
db.songs.drop();
db.plays.drop();
db.playlists.drop();
console.log("✅ Base de datos limpia.");

// ============================================================================
console.log("\n🎵 PASO 2: Cargando Catálogo Maestro...");

const musicCatalog = [
  // Pop & Pop Rock
  { artist: "The Weeknd", genre: "Pop", country: "CA", album: "After Hours", year: 2020, songs: ["Alone Again", "Too Late", "Hardest To Love", "Scared To Live", "Snowchild", "Escape From LA", "Heartless", "Blinding Lights"] },
  { artist: "Taylor Swift", genre: "Pop", country: "US", album: "1989", year: 2014, songs: ["Welcome To New York", "Blank Space", "Style", "Out Of The Woods", "All You Had To Do Was Stay", "Shake It Off", "Bad Blood"] },
  { artist: "Dua Lipa", genre: "Pop", country: "UK", album: "Future Nostalgia", year: 2020, songs: ["Future Nostalgia", "Don't Start Now", "Cool", "Physical", "Levitating", "Pretty Please", "Hallucinate"] },
  { artist: "Ed Sheeran", genre: "Pop", country: "UK", album: "Divide", year: 2017, songs: ["Eraser", "Castle on the Hill", "Dive", "Shape of You", "Perfect", "Galway Girl", "Happier"] },
  { artist: "Ariana Grande", genre: "Pop", country: "US", album: "Thank U, Next", year: 2019, songs: ["imagine", "needy", "NASA", "bloodline", "fake smile", "bad idea", "thank u, next"] },
  { artist: "Bruno Mars", genre: "Pop", country: "US", album: "24K Magic", year: 2016, songs: ["24K Magic", "Chunky", "Perm", "That's What I Like", "Versace on the Floor", "Straight Up & Down", "Too Good to Say Goodbye"] },
  { artist: "Billie Eilish", genre: "Pop", country: "US", album: "When We All Fall Asleep", year: 2019, songs: ["bad guy", "xanny", "you should see me in a crown", "all the good girls go to hell", "wish you were gay", "when the party's over", "bury a friend"] },
  { artist: "Harry Styles", genre: "Pop", country: "UK", album: "Harry's House", year: 2022, songs: ["Music for a Sushi Restaurant", "Late Night Talking", "Grapejuice", "As It Was", "Daylight", "Little Freak", "Matilda"] },
  { artist: "Adele", genre: "Pop", country: "UK", album: "25", year: 2015, songs: ["Hello", "Send My Love", "I Miss You", "When We Were Young", "Remedy", "Water Under the Bridge", "River Lea"] },
  { artist: "Coldplay", genre: "Pop Rock", country: "UK", album: "A Rush of Blood to the Head", year: 2002, songs: ["Politik", "In My Place", "God Put a Smile upon Your Face", "The Scientist", "Clocks", "Daylight", "Green Eyes"] },
  { artist: "Imagine Dragons", genre: "Pop Rock", country: "US", album: "Night Visions", year: 2012, songs: ["Radioactive", "Tiptoe", "It's Time", "Demons", "On Top of the World", "Amsterdam", "Hear Me"] },
  { artist: "Maroon 5", genre: "Pop", country: "US", album: "Songs About Jane", year: 2002, songs: ["Harder to Breathe", "This Love", "Shiver", "She Will Be Loved", "Tangled", "The Sun", "Must Get Out"] },
  { artist: "Katy Perry", genre: "Pop", country: "US", album: "Teenage Dream", year: 2010, songs: ["Teenage Dream", "Last Friday Night", "California Gurls", "Firework", "Peacock", "Circle the Drain", "The One That Got Away"] },
  { artist: "Lady Gaga", genre: "Pop", country: "US", album: "The Fame Monster", year: 2009, songs: ["Bad Romance", "Alejandro", "Monster", "Speechless", "Dance In The Dark", "Telephone", "So Happy I Could Die"] },
  { artist: "Miley Cyrus", genre: "Pop", country: "US", album: "Plastic Hearts", year: 2020, songs: ["WTF Do I Know", "Plastic Hearts", "Angels Like You", "Prisoner", "Gimme What I Want", "Night Crawling", "Midnight Sky"] },
  { artist: "Sam Smith", genre: "Pop", country: "UK", album: "In the Lonely Hour", year: 2014, songs: ["Money on My Mind", "Good Thing", "Stay with Me", "Leave Your Lover", "I'm Not the Only One", "I've Told You Now", "Like I Can"] },
  { artist: "Olivia Rodrigo", genre: "Pop", country: "US", album: "SOUR", year: 2021, songs: ["brutal", "traitor", "drivers license", "1 step forward, 3 steps back", "deja vu", "good 4 u", "enough for you"] },
  { artist: "Justin Bieber", genre: "Pop", country: "CA", album: "Purpose", year: 2015, songs: ["Mark My Words", "I'll Show You", "What Do You Mean?", "Sorry", "Love Yourself", "Company", "No Pressure"] },
  { artist: "Shawn Mendes", genre: "Pop", country: "CA", album: "Illuminate", year: 2016, songs: ["Ruin", "Mercy", "Treat You Better", "Three Empty Words", "Don't Be a Fool", "Like This", "No Promises"] },
  { artist: "Charlie Puth", genre: "Pop", country: "US", album: "Voicenotes", year: 2018, songs: ["The Way I Am", "Attention", "LA Girls", "How Long", "Done for Me", "Patient", "If You Leave Me Now"] },

  // Urbano & Latino
  { artist: "Bad Bunny", genre: "Urbano", country: "PR", album: "Un Verano Sin Ti", year: 2022, songs: ["Moscow Mule", "Después de la Playa", "Me Porto Bonito", "Tití Me Preguntó", "Un Ratito", "Yo No Soy Celoso", "Tarot"] },
  { artist: "J Balvin", genre: "Urbano", country: "CO", album: "Colores", year: 2020, songs: ["Amarillo", "Azul", "Rojo", "Rosa", "Morado", "Verde", "Negro"] },
  { artist: "Daddy Yankee", genre: "Reggaeton", country: "PR", album: "Barrio Fino", year: 2004, songs: ["Intro", "King Daddy", "Dale Caliente", "No Me Dejes Solo", "Gasolina", "Corazones", "Lo Que Paso, Paso"] },
  { artist: "Karol G", genre: "Urbano", country: "CO", album: "Mañana Será Bonito", year: 2023, songs: ["Mientras Me Curo Del Cora", "X Si Volvemos", "Pero Tú", "Besties", "Gucci Los Paños", "TQG", "Tus Gafitas"] },
  { artist: "Rosalía", genre: "Urbano", country: "ES", album: "MOTOMAMI", year: 2022, songs: ["SAOKO", "CANDY", "LA FAMA", "BULERÍAS", "CHICKEN TERIYAKI", "HENTAI", "BIZCOCHITO"] },
  { artist: "Rauw Alejandro", genre: "Urbano", country: "PR", album: "VICE VERSA", year: 2021, songs: ["Todo De Ti", "Sexo Virtual", "Nubes", "Cúrame", "Aquel Nap ZzZz", "Desenfocao", "La Old Skul"] },
  { artist: "Feid", genre: "Urbano", country: "CO", album: "Feliz Cumpleaños Ferxxo", year: 2022, songs: ["Intro", "Castigo", "Feliz Cumpleaños Ferxxo", "Nieve", "Ferxxo 100", "Belixe", "XQ Te Pones Así"] },
  { artist: "Ozuna", genre: "Urbano", country: "PR", album: "Aura", year: 2018, songs: ["Aura", "Me Dijeron", "Vaina Loca", "Devuélveme", "Quiero Más", "Tu Olor", "Ibiza"] },
  { artist: "Maluma", genre: "Urbano", country: "CO", album: "Papi Juancho", year: 2020, songs: ["Medallo City", "Bella-K", "Hawái", "Cielo a un Diablo", "Perdón", "La Cura", "Luz Verde"] },
  { artist: "Shakira", genre: "Pop Latino", country: "CO", album: "Fijación Oral", year: 2005, songs: ["En Tus Pupilas", "La Pared", "La Tortura", "Obtener un Sí", "Día Especial", "Escondite Inglés", "No"] },
  { artist: "Duki", genre: "Trap", country: "AR", album: "Desde el Fin del Mundo", year: 2021, songs: ["Sudor y Trabajo", "Pintao", "Chico Estrella", "Volando Bajito", "Cuanto", "Cascada", "Malbec"] },
  { artist: "Bizarrap", genre: "Urbano", country: "AR", album: "Music Sessions", year: 2023, songs: ["Quevedo: Bzrp Music Sessions", "Shakira: Bzrp Music Sessions", "Villano Antillano: Bzrp Music Sessions", "Duki: Bzrp Music Sessions", "Tiago PZK: Bzrp Music Sessions", "Nathy Peluso: Bzrp Music Sessions", "L-Gante: Bzrp Music Sessions"] },
  { artist: "YSY A", genre: "Trap", country: "AR", album: "Hecho a Mano", year: 2019, songs: ["Desfilar Mis Penas", "Buenos Aires Es Tarima", "Para Sacármelo", "Alma", "Vuelta a la Luna", "Bailando Te", "No Dejo de Pensar"] },
  { artist: "Trueno", genre: "Hip Hop", country: "AR", album: "Bien o Mal", year: 2022, songs: ["Hoop Hoop", "Fuck El Police", "Dance Crip", "Solo Por Vos", "Lo Tengo", "Panamá", "Tierra Zanta"] },
  { artist: "Wos", genre: "Hip Hop", country: "AR", album: "Caravana", year: 2019, songs: ["Canguro", "Fresco", "Pantano", "Melón Vino", "Luz Delito", "Okupa", "No Va a Bajar"] },
  { artist: "Emilia", genre: "Pop", country: "AR", album: ".MP3", year: 2023, songs: ["Facts.mp3", "Jagger.mp3", "Jet_Set.mp3", "Iconic.mp3", "La_Original.mp3", "GTA.mp3", "Exclusive.mp3"] },
  { artist: "TINI", genre: "Pop", country: "AR", album: "Cupido", year: 2023, songs: ["Cupido", "Te Pido", "Muñecas", "El Último Beso", "Carne y Hueso", "La Loto", "Las Jordans"] },
  { artist: "Maria Becerra", genre: "Pop", country: "AR", album: "La Nena de Argentina", year: 2022, songs: ["Perreo Furioso", "Automático", "Cuando Hacemos El Amor", "Ojalá", "Adiós", "Hasta Que La Muerte", "Doble Vida"] },
  { artist: "Milo J", genre: "Urbano", country: "AR", album: "111", year: 2023, songs: ["Tu Manta", "M.A.I", "Sincera", "Toy en el Mic", "No Soy Eterno", "A1", "Carencias de Cordura"] },
  { artist: "Peso Pluma", genre: "Corridos", country: "MX", album: "GÉNESIS", year: 2023, songs: ["ROSA PASTEL", "LUNA", "77", "RUBICON", "CARNAL", "GAVILÁN II", "VVS"] },

  // Hip Hop & R&B
  { artist: "Drake", genre: "Hip Hop", country: "CA", album: "Scorpion", year: 2018, songs: ["Survival", "Nonstop", "Elevate", "Emotionless", "God's Plan", "I'm Upset", "8 Out Of 10"] },
  { artist: "Kendrick Lamar", genre: "Hip Hop", country: "US", album: "DAMN.", year: 2017, songs: ["BLOOD.", "DNA.", "YAH.", "ELEMENT.", "FEEL.", "LOYALTY.", "PRIDE."] },
  { artist: "Travis Scott", genre: "Hip Hop", country: "US", album: "ASTROWORLD", year: 2018, songs: ["STARGAZING", "CAROUSEL", "SICKO MODE", "R.I.P. SCREW", "STOP TRYING TO BE GOD", "NO BYSTANDERS", "SKELETONS"] },
  { artist: "Post Malone", genre: "Hip Hop", country: "US", album: "Hollywood's Bleeding", year: 2019, songs: ["Hollywood's Bleeding", "Saint-Tropez", "Enemies", "Allergic", "A Thousand Bad Times", "Circles", "Die for Me"] },
  { artist: "SZA", genre: "R&B", country: "US", album: "SOS", year: 2022, songs: ["SOS", "Kill Bill", "Seek & Destroy", "Low", "Love Language", "Blind", "Used"] },
  { artist: "Frank Ocean", genre: "R&B", country: "US", album: "Blonde", year: 2016, songs: ["Nikes", "Ivy", "Pink + White", "Be Yourself", "Solo", "Skyline To", "Self Control"] },
  { artist: "J. Cole", genre: "Hip Hop", country: "US", album: "2014 Forest Hills Drive", year: 2014, songs: ["Intro", "January 28th", "Wet Dreamz", "03' Adolescence", "A Tale of 2 Citiez", "Fire Squad", "St. Tropez"] },
  { artist: "Tyler, The Creator", genre: "Hip Hop", country: "US", album: "IGOR", year: 2019, songs: ["IGOR'S THEME", "EARFQUAKE", "I THINK", "EXACTLY WHAT YOU RUN FROM", "RUNNING OUT OF TIME", "NEW MAGIC WAND", "A BOY IS A GUN*"] },
  { artist: "Kanye West", genre: "Hip Hop", country: "US", album: "Graduation", year: 2007, songs: ["Good Morning", "Champion", "Stronger", "I Wonder", "Good Life", "Can't Tell Me Nothing", "Barry Bonds"] },
  { artist: "Eminem", genre: "Hip Hop", country: "US", album: "The Eminem Show", year: 2002, songs: ["White America", "Business", "Cleanin' Out My Closet", "Square Dance", "The Kiss", "Soldier", "Say Goodbye Hollywood"] },
  { artist: "Snoop Dogg", genre: "Hip Hop", country: "US", album: "Doggystyle", year: 1993, songs: ["Bathtub", "G Funk Intro", "Gin and Juice", "Tha Shiznit", "Lodi Dodi", "Murder Was the Case", "Serial Killa"] },
  { artist: "50 Cent", genre: "Hip Hop", country: "US", album: "Get Rich or Die Tryin'", year: 2003, songs: ["Intro", "What Up Gangsta", "Patiently Waiting", "Many Men", "In Da Club", "High All the Time", "Blood Hound"] },
  { artist: "Jay-Z", genre: "Hip Hop", country: "US", album: "The Blueprint", year: 2001, songs: ["The Ruler's Back", "Takeover", "Izzo", "Girls, Girls, Girls", "Jigga That Nigga", "U Don't Know", "Hola' Hovito"] },
  { artist: "Rihanna", genre: "R&B", country: "BB", album: "ANTI", year: 2016, songs: ["Consideration", "James Joint", "Kiss It Better", "Work", "Desperado", "Woo", "Needed Me"] },
  { artist: "Beyoncé", genre: "R&B", country: "US", album: "Lemonade", year: 2016, songs: ["Pray You Catch Me", "Hold Up", "Don't Hurt Yourself", "Sorry", "6 Inch", "Daddy Lessons", "Love Drought"] },
  { artist: "Doja Cat", genre: "Hip Hop", country: "US", album: "Planet Her", year: 2021, songs: ["Woman", "Naked", "Payday", "Get Into It", "Need to Know", "I Don't Do Drugs", "Love To Dream"] },
  { artist: "Nicki Minaj", genre: "Hip Hop", country: "TT", album: "The Pinkprint", year: 2014, songs: ["All Things Go", "I Lied", "The Crying Game", "Get On Your Knees", "Feeling Myself", "Only", "Want Some More"] },
  { artist: "Cardi B", genre: "Hip Hop", country: "US", album: "Invasion of Privacy", year: 2018, songs: ["Get Up 10", "Drip", "Bickenhead", "Bodak Yellow", "Be Careful", "Best Life", "I Like It"] },
  { artist: "Megan Thee Stallion", genre: "Hip Hop", country: "US", album: "Good News", year: 2020, songs: ["Shots Fired", "Circles", "Cry Baby", "Do It On The Tip", "Sugar Baby", "Movie", "Freaky Girls"] },
  { artist: "Mac Miller", genre: "Hip Hop", country: "US", album: "Swimming", year: 2018, songs: ["Come Back to Earth", "Hurt Feelings", "What's the Use?", "Perfecto", "Self Care", "Wings", "Ladders"] },

  // Rock, Indie & Clásicos
  { artist: "Queen", genre: "Rock", country: "UK", album: "A Night at the Opera", year: 1975, songs: ["Death on Two Legs", "Lazing on a Sunday Afternoon", "I'm in Love with My Car", "You're My Best Friend", "'39", "Sweet Lady", "Seaside Rendezvous", "Bohemian Rhapsody"] },
  { artist: "The Beatles", genre: "Rock", country: "UK", album: "Abbey Road", year: 1969, songs: ["Come Together", "Something", "Maxwell's Silver Hammer", "Oh! Darling", "Octopus's Garden", "I Want You", "Here Comes the Sun"] },
  { artist: "Pink Floyd", genre: "Rock", country: "UK", album: "The Dark Side of the Moon", year: 1973, songs: ["Speak to Me", "Breathe", "On the Run", "Time", "The Great Gig in the Sky", "Money", "Us and Them"] },
  { artist: "Arctic Monkeys", genre: "Indie Rock", country: "UK", album: "AM", year: 2013, songs: ["Do I Wanna Know?", "R U Mine?", "One for the Road", "Arabella", "I Want It All", "No. 1 Party Anthem", "Mad Sounds"] },
  { artist: "The Strokes", genre: "Indie Rock", country: "US", album: "Is This It", year: 2001, songs: ["Is This It", "The Modern Age", "Soma", "Barely Legal", "Someday", "Alone, Together", "Last Nite"] },
  { artist: "Nirvana", genre: "Grunge", country: "US", album: "Nevermind", year: 1991, songs: ["Smells Like Teen Spirit", "In Bloom", "Come as You Are", "Breed", "Lithium", "Polly", "Territorial Pissings"] },
  { artist: "Guns N' Roses", genre: "Rock", country: "US", album: "Appetite for Destruction", year: 1987, songs: ["Welcome to the Jungle", "It's So Easy", "Nightrain", "Out ta Get Me", "Mr. Brownstone", "Paradise City", "My Michelle"] },
  { artist: "Metallica", genre: "Metal", country: "US", album: "Master of Puppets", year: 1986, songs: ["Battery", "Master of Puppets", "The Thing That Should Not Be", "Welcome Home", "Disposable Heroes", "Leper Messiah", "Orion"] },
  { artist: "AC/DC", genre: "Rock", country: "AU", album: "Back in Black", year: 1980, songs: ["Hells Bells", "Shoot to Thrill", "What Do You Do for Money Honey", "Given the Dog a Bone", "Let Me Put My Love into You", "Back in Black", "You Shook Me All Night Long"] },
  { artist: "Red Hot Chili Peppers", genre: "Rock", country: "US", album: "Californication", year: 1999, songs: ["Around the World", "Parallel Universe", "Scar Tissue", "Otherside", "Get on Top", "Californication", "Easily"] },
  { artist: "Linkin Park", genre: "Nu Metal", country: "US", album: "Hybrid Theory", year: 2000, songs: ["Papercut", "One Step Closer", "With You", "Points of Authority", "Crawling", "Runaway", "In the End"] },
  { artist: "Green Day", genre: "Punk Rock", country: "US", album: "American Idiot", year: 2004, songs: ["American Idiot", "Jesus of Suburbia", "Holiday", "Boulevard of Broken Dreams", "Are We the Waiting", "St. Jimmy", "Give Me Novacaine"] },
  { artist: "Foo Fighters", genre: "Rock", country: "US", album: "The Colour and the Shape", year: 1997, songs: ["Doll", "Monkey Wrench", "Hey, Johnny Park!", "My Poor Brain", "Wind Up", "Up in Arms", "My Hero", "Everlong"] },
  { artist: "Radiohead", genre: "Alternative", country: "UK", album: "OK Computer", year: 1997, songs: ["Airbag", "Paranoid Android", "Subterranean Homesick Alien", "Exit Music", "Let Down", "Karma Police", "Fitter Happier"] },
  { artist: "Muse", genre: "Alternative", country: "UK", album: "Black Holes and Revelations", year: 2006, songs: ["Take a Bow", "Starlight", "Supermassive Black Hole", "Map of the Problematique", "Soldier's Poem", "Invincible", "Assassin"] },
  { artist: "The Killers", genre: "Alternative", country: "US", album: "Hot Fuss", year: 2004, songs: ["Jenny Was a Friend of Mine", "Mr. Brightside", "Smile Like You Mean It", "Somebody Told Me", "All These Things That I've Done", "Andy, You're a Star", "On Top"] },
  { artist: "Gorillaz", genre: "Alternative", country: "UK", album: "Demon Days", year: 2005, songs: ["Intro", "Last Living Souls", "Kids with Guns", "O Green World", "Dirty Harry", "Feel Good Inc.", "El Mañana"] },
  { artist: "Daft Punk", genre: "Electronic", country: "FR", album: "Random Access Memories", year: 2013, songs: ["Give Life Back to Music", "The Game of Love", "Giorgio by Moroder", "Within", "Instant Crush", "Lose Yourself to Dance", "Touch", "Get Lucky"] },
  { artist: "Oasis", genre: "Rock", country: "UK", album: "(What's the Story) Morning Glory?", year: 1995, songs: ["Hello", "Roll with It", "Wonderwall", "Don't Look Back in Anger", "Hey Now!", "Some Might Say", "Cast No Shadow"] },
  { artist: "Soda Stereo", genre: "Rock Latino", country: "AR", album: "Canción Animal", year: 1990, songs: ["En el Séptimo Día", "Un Millón de Años Luz", "Canción Animal", "1990", "Sueles Dejarme Solo", "De Música Ligera", "Hombre al Agua"] }
];

let allSongsData = []; 

musicCatalog.forEach((data, index) => {
  let artistRes = db.artists.insertOne({
    stage_name: data.artist,
    main_genre: data.genre,
    country: data.country,
    followers: Math.floor(Math.random() * 20000000) + 100000
  });
  let artistId = artistRes.insertedId;

  let albumRes = db.albums.insertOne({
    title: data.album,
    artist_id: artistId,
    release_year: data.year,
    genre: data.genre
  });
  let albumId = albumRes.insertedId;

  data.songs.forEach(songTitle => {
    let song = {
      title: songTitle,
      artist_ids: [artistId],
      album_id: albumId,
      duration_ms: 150000 + Math.floor(Math.random() * 100000), 
      genres: [data.genre],
      bpm: 80 + Math.floor(Math.random() * 60),
      popularity: Math.floor(Math.random() * 100)
    };
    let songRes = db.songs.insertOne(song);
    
    allSongsData.push({
      id: songRes.insertedId,
      title: songTitle,
      artist_id: artistId,
      artist_name: data.artist,
      album_name: data.album,
      genres: [data.genre]
    });
  });
});
console.log(`✅ Insertados 80 Artistas, 80 Álbumes y ${allSongsData.length} Canciones reales.`);

// ============================================================================
console.log("\n👤 PASO 3: Generando 200 Usuarios...");
let usersIds = [];
for (let i = 1; i <= 200; i++) {
  let isPremium = (i % 5 === 0);
  let res = db.users.insertOne({ 
    name: "User_" + i, 
    country: ["AR", "US", "ES", "CO", "MX"][Math.floor(Math.random() * 5)],
    plan: isPremium ? "premium" : "free", 
    favorite_genres: [musicCatalog[Math.floor(Math.random() * 80)].genre],
    followed_artists: [] 
  });
  usersIds.push(res.insertedId);
}
console.log("✅ Insertados 200 Usuarios.");

// ============================================================================
console.log("\n📻 PASO 4: Generando Playlists base...");
const playlistTypes = ["editorial", "algoritmica", "usuario"];
for(let i = 1; i <= 5; i++) {
    let p_songs = [];
    for(let j=0; j<20; j++) {
        p_songs.push(allSongsData[Math.floor(Math.random() * allSongsData.length)].id);
    }

    db.playlists.insertOne({
        name: `Mix Genial ${i}`,
        type: playlistTypes[Math.floor(Math.random() * playlistTypes.length)],
        songs: p_songs,
        followers_current: 1000 + Math.floor(Math.random() * 50000),
        followers_last_month: 800 + Math.floor(Math.random() * 40000),
        description: `Lista generada automáticamente N°${i}`
    });
}
console.log("✅ Playlists creadas.");

// ============================================================================
console.log("\n▶️ PASO 5: Generando 50.000 Reproducciones (Batches)...");
let now = new Date();
let totalPlays = 50000;
let batchSize = 10000; 
let playsInserted = 0;

for (let b = 0; b < totalPlays / batchSize; b++) {
  let playsBatch = [];
  
  for (let i = 1; i <= batchSize; i++) {
    let user_id = usersIds[Math.floor(Math.random() * usersIds.length)];
    let s_data = allSongsData[Math.floor(Math.random() * allSongsData.length)];
    
    let randomTime = new Date(now.getTime() - (Math.random() * 10 * 24 * 60 * 60 * 1000)); 
    
    playsBatch.push({
      timestamp: randomTime,
      user_id: user_id,
      song_id: s_data.id,
      artist_id: s_data.artist_id,
      song_title: s_data.title,
      artist_name: s_data.artist_name,
      album_name: s_data.album_name,
      genres: s_data.genres,
      device: ["mobile", "desktop", "web", "smart_speaker"][Math.floor(Math.random() * 4)],
      context: ["playlist", "album", "search", "radio"][Math.floor(Math.random() * 4)],
      completed: Math.random() > 0.3 
    });
  }
  
  db.plays.insertMany(playsBatch);
  playsInserted += batchSize;
  console.log(`   ⏳ Progreso: ${playsInserted} / ${totalPlays} reproducciones insertadas...`);
}
console.log("✅ PASO 5 Completado.");
console.log("\n🚀 SCRIPT FINALIZADO: Base de datos inicializada con éxito.");