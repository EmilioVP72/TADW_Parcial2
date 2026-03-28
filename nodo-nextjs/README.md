# Nodo Next.js — Puerto 8012

Nodo blockchain descentralizado para gestión de grados académicos. Implementa la arquitectura de red P2P con algoritmo de consenso Proof of Work y sincronización distribuida de bloques.

## Características principales

- **Dashboard interactivo**: Interfaz React con Tailwind CSS para interactuar con el nodo
- **API REST**: Endpoints para minado, consenso, transacciones y consultas
- **Blockchain**: Sistema de hashing SHA-256 con Proof of Work
- **Base de datos Supabase**: Persistencia de personas, instituciones y grados
- **Red distribuida**: Propagación de transacciones y bloques entre peers
- **Consenso**: Algoritmo para seleccionar la cadena más larga válida

## Estructura del proyecto

```
app/
  api/
    chain/route.ts          # GET - Retorna todas las transacciones minadas
    transactions/route.ts   # POST - Crea nuevas transacciones
    mine/route.ts          # POST - Ejecuta Proof of Work
    status/route.ts        # GET - Estado del nodo
    nodes/
      resolve/route.ts     # GET - Algoritmo de consenso
  page.tsx                  # Dashboard interactivo
  layout.tsx
  globals.css
lib/
  supabase.ts              # Cliente Supabase
  blockchain.ts            # Funciones de blockchain (PoW, validación)
```

## Endpoints API

### GET `/api/chain`
Retorna todos los bloques de la cadena local ordenados por `creado_en`.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "persona_id": "uuid",
    "institucion_id": "uuid",
    "titulo_obtenido": "Ingeniero en Sistemas",
    "hash_actual": "00a1b2c3...",
    "hash_anterior": "00x9y8z7...",
    "nonce": 2541,
    "creado_en": "2026-03-27T10:30:00Z"
  }
]
```

### POST `/api/transactions`
Crea una nueva transacción (grado pendiente de minado).

**Request body:**
```json
{
  "nombre": "Juan",
  "apellido_paterno": "Pérez",
  "institucion_nombre": "Universidad Nacional",
  "titulo_obtenido": "Licenciado en Informática"
}
```

**Proceso:**
1. Inserta persona en tabla `personas`
2. Inserta institución en tabla `instituciones`
3. Inserta registro en `grados` con `hash_actual: ""`, `nonce: 0`
4. Propaga a todos los peers

**Response (201):**
```json
{
  "id": "uuid",
  "persona_id": "uuid",
  "institucion_id": "uuid",
  "titulo_obtenido": "Licenciado en Informática",
  "hash_actual": "",
  "hash_anterior": null,
  "nonce": 0
}
```

### POST `/api/mine`
Ejecuta Proof of Work sobre las transacciones pendientes.

**Proceso:**
1. Consulta transacciones con `hash_actual = ""`
2. Para cada transacción:
   - Ejecuta `proofOfWork()` (busca nonce donde hash comienza con "00")
   - Actualiza `hash_actual`, `hash_anterior`, `nonce`
   - Encadena: el hash anterior de la siguiente transacción es el hash actual de la anterior
3. Propaga a otros nodos para sincronización

**Response (200):**
```json
{
  "mensaje": "Bloque minado exitosamente",
  "bloques_minados": 3
}
```

**Response (400):**
```json
{
  "error": "No hay transacciones pendientes para minar"
}
```

### GET `/api/status`
Retorna información del nodo.

**Response (200):**
```json
{
  "nodo": "nodo-nextjs",
  "puerto": 8012,
  "framework": "Next.js",
  "peers": ["http://peer1:3000", "http://peer2:3000"]
}
```

### GET `/api/nodes/resolve`
Implementa el algoritmo de consenso.

**Proceso:**
1. Obtiene cadena local
2. Consulta cadena de cada peer
3. Compara todas usando `esCAdenaMasLarga()`
4. Si encuentra cadena más larga y válida:
   - Elimina todos los registros de `grados`
   - Inserta bloques de la cadena ganadora
5. Si cadena local es la más larga, no realiza cambios

**Response (200) - Cadena local es la más larga:**
```json
{
  "mensaje": "La cadena local ya es la más larga",
  "reemplazada": false
}
```

**Response (200) - Cadena reemplazada:**
```json
{
  "mensaje": "Cadena reemplazada por una más larga",
  "reemplazada": true,
  "bloques": 15
}
```

## Dashboard (`/`)

Interfaz React interactiva con tres secciones:

### Sección 1: Estado y acciones
- Título: "Nodo Next.js — Puerto 8012"
- Botón "Minar bloque": POST a `/api/mine`, muestra progreso y resultado
- Botón "Resolver consenso": GET a `/api/nodes/resolve`, muestra si se sincronizó

### Sección 2: Cadena de bloques
- Botón "Actualizar cadena": GET a `/api/chain`
- Muestra cada bloque como tarjeta con:
  - Número de bloque
  - Título obtenido
  - Hash actual (primeros 20 caracteres)
  - Hash anterior (primeros 20 caracteres)
  - Nonce
- Mensaje si cadena está vacía

### Sección 3: Nueva transacción
- Formulario con campos:
  - Nombre
  - Apellido paterno
  - Institución
  - Título obtenido
- Botón "Enviar transacción": POST a `/api/transactions`
- Actualiza cadena automáticamente después de enviar
- Muestra mensajes de éxito o error

## Funciones blockchain (`lib/blockchain.ts`)

### `calcularHash()`
Calcula SHA-256 de un bloque concatenando:
```
personaId | institucionId | tituloObtenido | fechaFin | hashAnterior | nonce
```

### `proofOfWork()`
Incrementa nonce hasta encontrar hash que comienza con "00".

**Retorna:**
```json
{
  "nonce": 2541,
  "hash": "00a1b2c3d4e5f6..."
}
```

### `validarCadena()`
Valida integridad de toda la cadena:
- Verifica hash_actual de cada bloque
- Verifica hash_anterior coincida con hash_actual del bloque anterior
- Para bloque génesis: verifica hash_anterior sea nulo

### `esCAdenaMasLarga()`
Compara dos cadenas:
- Cadena remota debe ser más larga
- Cadena remota debe ser válida (pasar `validarCadena()`)

### `propagarANodos()`
POST a todos los peers en `PEER_NODES`.
- Lee variable de entorno: `PEER_NODES` (separado por comas)
- Captura silenciosamente errores de peers caídos

## Base de datos (Supabase)

### Tabla `personas`
```sql
CREATE TABLE personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR NOT NULL,
  apellido_paterno VARCHAR NOT NULL
);
```

### Tabla `instituciones`
```sql
CREATE TABLE instituciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR NOT NULL UNIQUE
);
```

### Tabla `grados`
```sql
CREATE TABLE grados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID REFERENCES personas(id),
  institucion_id UUID REFERENCES instituciones(id),
  titulo_obtenido VARCHAR NOT NULL,
  hash_actual VARCHAR NOT NULL DEFAULT '',
  hash_anterior VARCHAR,
  nonce INTEGER NOT NULL DEFAULT 0,
  creado_en TIMESTAMP DEFAULT NOW()
);
```

## Ejecución

### Con Docker Compose
```bash
docker-compose up --build
```

Accede a `http://localhost:3000`

### Localmente
```bash
npm install
npm run dev
```

Accede a `http://localhost:3000`

## Variables de entorno

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-clave-anonima
PEER_NODES=http://localhost:3001,http://localhost:3002
NODE_URL=http://localhost:3000
```

## Stack tecnológico

- **Framework**: Next.js 16.2.1 (Turbopack)
- **UI**: React 19.2.4 + Tailwind CSS 4
- **Base de datos**: Supabase (PostgreSQL)
- **Criptografía**: Node.js crypto (SHA-256)
- **Lenguaje**: TypeScript 5
- **Contenedor**: Docker + Alpine Linux

## Flujo típico

1. **Usuario crea transacción** → POST `/api/transactions`
   - Se inserta persona e institución en DB
   - Se crea grado pendiente con `hash_actual = ""`
   - Se propaga a peers

2. **Usuario minea bloque** → POST `/api/mine`
   - Se ejecuta Proof of Work para cada transacción pendiente
   - Se calcula nonce donde hash comienza con "00"
   - Se encadenan los hashes
   - Se propaga a peers

3. **Usuario resuelve consenso** → GET `/api/nodes/resolve`
   - Se comparan cadenas locales y remotas
   - Se selecciona la cadena más larga válida
   - Si se reemplaza, se sincroniza con otros nodos

## Licencia

MIT

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
