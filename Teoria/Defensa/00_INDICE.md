# Guía de Defensa Oral — TP Integrador

**Tema 8 · Streaming Musical · Ingeniería de Datos II · UADE**
**Defensa: 22/06/2026**

---

## Contexto

Hay dos profesores. Uno toma la parte práctica, otro la teórica.

**Práctica**:
1. Explicar cómo funciona la app y cómo se conectan los 3 motores.
2. Te tira una query a ejecutar en el motor que él diga (puede ser cualquiera). La query es sobre el dominio de tu TP **o** sobre un caso genérico que invente (ejemplo real que le dio a un compañero: "Insertá un registro en `eventos` con partition key `municipio_001` y consultá la partición").

**Teórica** (2 preguntas):
1. Ventajas de un motor sobre otro en el modelado del TP (ej: "¿por qué MongoDB es mejor que Cassandra para tu TP?").
2. Por qué cierta característica de un motor es necesaria para tal parte del modelo (ej: "¿por qué tu OP-2 escribe primero en Cassandra y después en MongoDB?").

**Todo el foco está en: CAP de cada motor + performance + decisiones de modelado.**

---

## Mapa de archivos

| Archivo | Contenido | ⭐ = Crítico |
|---|---|---|
| `00_INDICE.md` | Este archivo — punto de entrada | |
| `01_Conexion_3_motores.md` | Cómo funciona la app + flujo OP1–OP5 + diagrama | ⭐⭐⭐ |
| `02_MongoDB.md` | MongoDB en profundidad + Q&A + queries TP/genéricas | ⭐⭐ |
| `03_Neo4j.md` | Neo4j en profundidad + Q&A + queries TP/genéricas | ⭐⭐ |
| `04_Cassandra.md` | Cassandra en profundidad + Q&A + queries TP/genéricas | ⭐⭐⭐ |
| `05_Redis_corto.md` | Repaso mínimo Redis (por si pregunta comparativa) | |
| `06_CAP_Performance.md` | Teorema CAP · replicación · particionamiento · sharding | ⭐⭐⭐ |
| `07_Comparativa_motores.md` | Por qué cada motor en cada parte del TP | ⭐⭐⭐ |
| `08_Teoria_general.md` | ACID/BASE · Big Data · principios NoSQL · polyglot · Saga/CQRS | ⭐ |
| `09_Cheat_sheet_final.md` | Hoja única para repasar el día de la defensa | ⭐⭐⭐ |

---

## Cómo usar esta guía

- **Lunes 16/06 a Jueves 19/06**: leer un archivo por día (en orden 01 → 08), revisar Q&A en voz alta como si te estuvieran preguntando.
- **Viernes 20/06**: repaso completo + practicar queries en cqlsh / mongosh / Neo4j Browser.
- **Sábado 21/06**: repasar solo el `09_Cheat_sheet_final.md`.
- **Domingo 22/06**: leer el cheat sheet una vez antes de entrar.

**Regla de oro**: si te preguntan algo que no sabés, no inventes. Decí "no lo abordamos así en el TP, pero podríamos resolverlo de esta forma..." y razoná en voz alta.

---

## Símbolos en la guía

- ⭐ = pregunta o tema **clave** (es muy probable que entre)
- 🎯 = pregunta probable según lo que dijeron los compañeros
- 💡 = explicación que sirve si el profe repregunta
- ⚠️ = error conceptual que NO querés cometer en la defensa
- 📝 = comando o query exacta para practicar
