-- =============================================================================
-- CONSULTAS CQL — TP2 Tema 8: Streaming Musical
-- DataStax Astra — keyspace: streaming
-- Req 3 (Sección 3.1, 3.2, 3.3) — 11 consultas + justificaciones
-- =============================================================================
-- Verificación previa:
--   SELECT COUNT(*) FROM streaming.reproducciones_usuario;   -- ~5000
--   SELECT COUNT(*) FROM streaming.reproducciones_cancion;   -- ~5000
--   SELECT COUNT(*) FROM streaming.metricas_horarias;        -- varía
--   SELECT COUNT(*) FROM streaming.charts_diarios;           -- varía por país/fecha
--   SELECT COUNT(*) FROM streaming.historial_artista;        -- ~5000
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 3.1 — Registro de eventos de reproducción
-- ─────────────────────────────────────────────────────────────────────────────

-- REQ 3.1 — Punto 1: Registro de un evento de reproducción
-- Se inserta simultáneamente en las tablas que lo necesitan:

INSERT INTO streaming.reproducciones_usuario
  (usuario_id, timestamp, cancion_id, artista_id, song_title, genero, duracion_seg, completada, dispositivo, contexto, pais)
VALUES
  ('User_1', '2026-05-20 14:32:00+0000', 'The Weeknd::Blinding Lights', 'The Weeknd',
   'Blinding Lights', 'Pop', 200, true, 'mobile', 'playlist', 'AR');

INSERT INTO streaming.reproducciones_cancion
  (cancion_id, timestamp, usuario_id, artista_id, completada, pais, duracion_seg)
VALUES
  ('The Weeknd::Blinding Lights', '2026-05-20 14:32:00+0000', 'User_1', 'The Weeknd', true, 'AR', 200);

INSERT INTO streaming.historial_artista
  (artista_id, anio_mes, timestamp, cancion_id, usuario_id, completada, duracion_seg)
VALUES
  ('The Weeknd', '2026-05', '2026-05-20 14:32:00+0000', 'The Weeknd::Blinding Lights', 'User_1', true, 200);


-- QUERY 3.1.a — Historial de reproducciones de un usuario en la última semana
-- Partition key: usuario_id → O(1) sin scan global
-- Clustering: timestamp DESC → los más recientes primero sin re-ordenar
SELECT usuario_id, timestamp, song_title, artista_id, dispositivo, contexto, completada
FROM streaming.reproducciones_usuario
WHERE usuario_id = 'User_1'
  AND timestamp >= '2026-05-13 00:00:00+0000';

-- Probar también con: User_5, User_10, User_100


-- QUERY 3.1.b — Total de reproducciones de una canción en las últimas 24 horas
-- Partition key: cancion_id → O(1) por canción
-- Rango de timestamp limita el scan al período pedido
SELECT COUNT(*) AS reproducciones_24h
FROM streaming.reproducciones_cancion
WHERE cancion_id = 'The Weeknd::Blinding Lights'
  AND timestamp >= '2026-05-19 00:00:00+0000';

-- Probar con: 'Bad Bunny::Moscow Mule', 'Shakira::La Tortura'


-- QUERY 3.1.c — Tasa de skip de una canción en el último mes
-- Paso 1: obtener todos los registros del período para la canción
SELECT completada
FROM streaming.reproducciones_cancion
WHERE cancion_id = 'The Weeknd::Blinding Lights'
  AND timestamp >= '2026-04-20 00:00:00+0000';
-- La aplicación calcula: total = COUNT(*), skips = COUNT(completada = false)
-- tasa_skip = skips / total


-- QUERY 3.1.d — Reproducciones de todas las canciones de un artista en el mes actual
-- Partition key: (artista_id, anio_mes) → evita partición ilimitada por artista
SELECT artista_id, anio_mes, timestamp, cancion_id, usuario_id, completada, duracion_seg
FROM streaming.historial_artista
WHERE artista_id = 'The Weeknd'
  AND anio_mes = '2026-05';

-- Probar con: 'Bad Bunny', 'Shakira', 'Drake'


-- ─────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 3.2 — Charts y métricas de popularidad
-- ─────────────────────────────────────────────────────────────────────────────

-- QUERY 3.2.a — Actualizar métricas horarias al registrar una reproducción
-- COUNTER: incremento atómico distribuido, no se puede usar INSERT
-- La aplicación ejecuta esto junto con el INSERT en reproducciones_*

UPDATE streaming.metricas_horarias
SET reproducciones = reproducciones + 1
WHERE cancion_id = 'The Weeknd::Blinding Lights'
  AND fecha = '2026-05-20'
  AND hora = 14;

-- Si la reproducción no se completó (skip), también:
UPDATE streaming.metricas_horarias
SET skips = skips + 1
WHERE cancion_id = 'The Weeknd::Blinding Lights'
  AND fecha = '2026-05-20'
  AND hora = 14;


-- QUERY 3.2.b — Top 50 canciones de un país para una fecha determinada
-- Partition key: (pais, fecha) → O(1) — toda la partición es el chart de ese día
-- Clustering: reproducciones DESC → el orden ya está garantizado por Cassandra
SELECT pais, fecha, reproducciones, cancion_id, artista_id, song_title
FROM streaming.charts_diarios
WHERE pais = 'AR'
  AND fecha = '2026-05-20'
LIMIT 50;

-- Probar también con: pais = 'US', 'CO', 'MX', 'ES'


-- QUERY 3.2.c — Curva horaria de reproducciones de una canción en un día dado
-- Partition key: (cancion_id, fecha) → limita la partición a max 24 filas/día
-- Solución al hot-partition: si "Blinding Lights" tiene 50M repros/día,
-- la partición solo tiene 24 filas (una por hora), no 50M filas.
SELECT hora, reproducciones, skips
FROM streaming.metricas_horarias
WHERE cancion_id = 'The Weeknd::Blinding Lights'
  AND fecha = '2026-05-20';


-- QUERY 3.2.d — Canciones con crecimiento explosivo: +300% respecto al mismo día semana anterior
-- Cassandra no tiene JOINs entre particiones: se hacen 2 queries en la app y se compara.

-- Paso 1 — reproducciones HOY:
SELECT COUNT(*) AS repros_hoy
FROM streaming.reproducciones_cancion
WHERE cancion_id = 'The Weeknd::Blinding Lights'
  AND timestamp >= '2026-05-20 00:00:00+0000'
  AND timestamp <  '2026-05-21 00:00:00+0000';

-- Paso 2 — reproducciones el MISMO DÍA de la semana anterior:
SELECT COUNT(*) AS repros_semana_anterior
FROM streaming.reproducciones_cancion
WHERE cancion_id = 'The Weeknd::Blinding Lights'
  AND timestamp >= '2026-05-13 00:00:00+0000'
  AND timestamp <  '2026-05-14 00:00:00+0000';

-- La app calcula: crecimiento = (hoy - anterior) / anterior
-- Si crecimiento > 3.0 → crecimiento explosivo (>300%)


-- ─────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 3.3 — Análisis de comportamiento de escucha
-- ─────────────────────────────────────────────────────────────────────────────

-- QUERY 3.3.a — Género musical dominante de un usuario en el último mes
-- Cassandra devuelve cancion_id por usuario → la app cruza con MongoDB para obtener el género
-- No se puede GROUP BY en Cassandra sin que el campo esté en la PK.
SELECT usuario_id, timestamp, cancion_id, artista_id, genero
FROM streaming.reproducciones_usuario
WHERE usuario_id = 'User_1'
  AND timestamp >= '2026-04-20 00:00:00+0000';
-- La app agrupa por 'genero', cuenta ocurrencias, devuelve el más frecuente.


-- QUERY 3.3.b — Horario de mayor actividad de un usuario (en qué horas del día escucha más)
-- Se obtienen todos los timestamps y la app extrae la hora con Date.getHours()
SELECT timestamp
FROM streaming.reproducciones_usuario
WHERE usuario_id = 'User_1'
  AND timestamp >= '2026-04-20 00:00:00+0000';
-- La app agrupa por hora (0-23) y devuelve la hora con más reproducciones.


-- QUERY 3.3.c — Tiempo total de escucha de un usuario en la última semana
-- duracion_seg está almacenado en cada fila → suma directa posible en CQL
SELECT SUM(duracion_seg) AS tiempo_total_segundos
FROM streaming.reproducciones_usuario
WHERE usuario_id = 'User_1'
  AND timestamp >= '2026-05-13 00:00:00+0000';
-- La app convierte: segundos → horas/minutos para mostrar al usuario.


-- =============================================================================
-- CONSULTAS DE DIAGNÓSTICO
-- =============================================================================

-- Ver reproducciones de hoy en AR (verificar charts)
SELECT pais, fecha, COUNT(*) as registros
FROM streaming.charts_diarios
WHERE pais = 'AR' AND fecha = '2026-05-20';

-- Ver métricas de una canción popular
SELECT cancion_id, fecha, hora, reproducciones, skips
FROM streaming.metricas_horarias
WHERE cancion_id = 'The Weeknd::Blinding Lights'
  AND fecha = '2026-05-20';

-- Últimas 5 reproducciones de un usuario
SELECT usuario_id, timestamp, song_title, artista_id
FROM streaming.reproducciones_usuario
WHERE usuario_id = 'User_1'
LIMIT 5;
