'use strict';
// =============================================================================
// Configuración de conexiones — carga credenciales desde .env
// =============================================================================

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const neo4j    = require('neo4j-driver');
const cassandra = require('cassandra-driver');
const { MongoClient } = require('mongodb');

// ─── Validar variables obligatorias ──────────────────────────────────────────
const required = ['NEO4J_URI', 'NEO4J_USER', 'NEO4J_PASSWORD', 'MONGO_URI', 'CASSANDRA_TOKEN', 'CASSANDRA_BUNDLE_PATH'];
const missing  = required.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error('❌ Faltan variables de entorno:', missing.join(', '));
  console.error('   Copiá .env.example → .env y completá las credenciales.');
  process.exit(1);
}

// ─── Neo4j ───────────────────────────────────────────────────────────────────
const neo4jDriver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

// ─── MongoDB ─────────────────────────────────────────────────────────────────
const mongoClient = new MongoClient(process.env.MONGO_URI);
let mongoDB = null;

async function getMongoDB() {
  if (!mongoDB) {
    await mongoClient.connect();
    mongoDB = mongoClient.db(process.env.MONGO_DB || 'ing-datos-II');
  }
  return mongoDB;
}

// ─── Cassandra (DataStax Astra) ───────────────────────────────────────────────
const cassandraClient = new cassandra.Client({
  cloud:       { secureConnectBundle: require('path').resolve(process.env.CASSANDRA_BUNDLE_PATH) },
  credentials: { username: 'token', password: process.env.CASSANDRA_TOKEN },
});
const KEYSPACE = process.env.CASSANDRA_KEYSPACE || 'streaming';

// ─── Conexión inicial ─────────────────────────────────────────────────────────
let connected = false;

async function connect() {
  if (connected) return;
  try {
    await Promise.all([
      neo4jDriver.verifyConnectivity(),
      getMongoDB(),
      cassandraClient.connect(),
    ]);
    connected = true;
    console.log('✅ Conectado a Neo4j, MongoDB y Cassandra.');
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('neo4j') || msg.includes('ServiceUnavailable')) {
      throw new Error(`Neo4j no disponible: ${msg}`);
    } else if (msg.includes('mongo') || msg.includes('ENOTFOUND')) {
      throw new Error(`MongoDB no disponible: ${msg}`);
    } else if (msg.includes('secure-connect') || msg.includes('ENOENT')) {
      throw new Error(`Cassandra: archivo secure-connect-bundle no encontrado en ${process.env.CASSANDRA_BUNDLE_PATH}`);
    }
    throw err;
  }
}

async function disconnect() {
  await Promise.allSettled([
    neo4jDriver.close(),
    mongoClient.close(),
    cassandraClient.shutdown(),
  ]);
}

module.exports = { neo4jDriver, getMongoDB, cassandraClient, KEYSPACE, connect, disconnect };
