# 🔗 Blockchain Distribuido — TADW Parcial 2

Red blockchain P2P con tres nodos independientes (Laravel, Express.js y Next.js) sincronizados a través de Supabase con propagación de transacciones, Proof of Work y algoritmo de consenso (cadena más larga).

---

## 🏗️ Arquitectura

```
┌──────────────────────────────────────────────────────────┐
│                    RED DOCKER  blockchain-net             │
│                                                          │
│  ┌─────────────────┐   ┌─────────────────┐              │
│  │   blockchain-   │   │   blockchain-   │              │
│  │    laravel      │◄──►    express      │              │
│  │  :8000 (→8010)  │   │  :3000 (→8011)  │              │
│  └────────┬────────┘   └────────┬────────┘              │
│           │                     │                        │
│           └──────────┬──────────┘                        │
│                      │                                   │
│             ┌────────▼────────┐                          │
│             │  blockchain-    │                          │
│             │     next        │                          │
│             │  :3000 (→8012)  │                          │
│             └─────────────────┘                          │
└──────────────────────────────────────────────────────────┘
       ▲                ▲                 ▲
       └────────────────┴─────────────────┘
                    Supabase Cloud
                (Base de datos compartida)
```

| Nodo       | Tecnología | URL Local               | Puerto Interno |
|------------|-----------|-------------------------|----------------|
| Nodo 1     | Laravel   | http://localhost:8010    | `blockchain-laravel:8000` |
| Nodo 2     | Express   | http://localhost:8011    | `blockchain-express:3000` |
| Nodo 3     | Next.js   | http://localhost:8012    | `blockchain-next:3000`    |

---

## 🚀 Inicio Rápido

### Prerrequisitos
- Docker y Docker Compose instalados
- Archivos `.env` configurados en `nodo-laravel/` y `nodo-nextjs/.env.local`

### Levantar todos los nodos

```bash
docker-compose up -d --build
```

Esperar ~30 segundos a que todos los servicios estén listos.

### Verificar que están corriendo

```bash
docker-compose ps
```

Todos deben mostrar `Up`.

### Verificar que los nodos se conocen entre sí

> ⚠️ **Los peers ya están configurados automáticamente** en el `docker-compose.yml` mediante la variable `PEER_NODES`. No es necesario registrarlos manualmente.

```bash
# Ver peers de Next.js
curl http://localhost:8012/api/nodes/register

# Ver peers de Express
curl http://localhost:8011/api/nodes

# Ver peers de Laravel
curl http://localhost:8010/api/nodes
```

Cada uno debería devolver los dos nodos restantes.

---

## 📋 Guía de Evaluación Paso a Paso

### ✅ PRUEBA 1 — Registro Cruzado de Nodos (Conectividad P2P)

**Objetivo:** Demostrar que los nodos se conocen entre sí desde el arranque.

**Paso 1.1 — Verificar peers de Next.js:**
```bash
curl http://localhost:8012/api/nodes/register
```
**Respuesta esperada:**
```json
{
  "peers": ["http://blockchain-laravel:8000", "http://blockchain-express:3000"]
}
```

**Paso 1.2 — Verificar peers de Express:**
```bash
curl http://localhost:8011/api/nodes
```
**Respuesta esperada:**
```json
{
  "nodes": ["http://blockchain-laravel:8000", "http://blockchain-next:3000"]
}
```

**Paso 1.3 — Verificar peers de Laravel:**
```bash
curl http://localhost:8010/api/nodes
```

**Paso 1.4 — (Opcional) Registrar nodo adicional en tiempo real:**
```bash
# Registrar un nodo extra en Express (acepta array o URL individual)
curl -X POST http://localhost:8011/api/nodes/register \
  -H "Content-Type: application/json" \
  -d '{"nodes": ["http://blockchain-laravel:8000", "http://blockchain-next:3000"]}'
```
✅ **Criterio:** Los tres nodos responden con su lista de vecinos correcta.

---

### ✅ PRUEBA 2 — Propagación de Transacciones (Mempool)

**Objetivo:** Demostrar que cuando un nodo crea una transacción, todos los demás la reciben automáticamente.

**Paso 2.1 — Enviar transacción desde la interfaz web:**

1. Abrir **http://localhost:8012** en el navegador.
2. Llenar el formulario **"Registrar Título"** con datos de ejemplo:
   - Nombre: `Juan`
   - Apellido Paterno: `García`
   - Institución: `UNAM`
   - Título Obtenido: `Ingeniería en Sistemas`
3. Dar clic en **"Enviar a Mempool"**.
4. La transacción aparecerá inmediatamente en el panel **"Mempool (Pendientes)"** de la interfaz.

**Paso 2.2 — Verificar que Express también la recibió:**
```bash
# Ver transacciones pendientes en Express (en memoria)
curl http://localhost:8011/api/transactions
```

**Paso 2.3 — (Alternativa vía curl):**
```bash
curl -X POST http://localhost:8012/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Maria",
    "apellido_paterno": "Martinez",
    "institucion_nombre": "IPN",
    "titulo_obtenido": "Maestría en Redes"
  }'
```

**Paso 2.4 — Confirmar propagación en los logs:**
```bash
docker-compose logs --tail=20 nodo-laravel | grep "transactions"
docker-compose logs --tail=20 nodo-express | grep "Enviado"
```

✅ **Criterio:** Laravel y Express muestran en sus logs que recibieron la transacción via broadcast.

---

### ✅ PRUEBA 3 — Proof of Work y Emisión de Bloques

**Objetivo:** Minar las transacciones pendientes y verificar que el hash cumpla PoW (`00...`).

**Paso 3.1 — Minar desde Laravel via Swagger:**

1. Abrir **http://localhost:8010/api/documentation**
2. Buscar el endpoint `POST /blockchain/mine`
3. Ejecutarlo (sin body requerido)

**O via curl:**
```bash
curl -X POST http://localhost:8010/api/blockchain/mine \
  -H "Accept: application/json"
```

**Respuesta esperada:**
```json
{
  "message": "Bloques minados con éxito",
  "blocks": [
    {
      "titulo_obtenido": "Ingeniería en Sistemas",
      "hash_actual": "00a3f5...",
      "hash_anterior": "00df9e...",
      "nonce": 214
    }
  ]
}
```

**Verificar que `hash_actual` empieza con `00`** ← Prueba de Trabajo cumplida.

**Paso 3.2 — Verificar que el bloque llegó a Next.js:**
```bash
# Ver logs de Next.js
docker-compose logs --tail=10 nodo-nextjs | grep "receive-block"
```

Debe mostrar: `POST /api/blockchain/receive-block 201` ← bloque aceptado.

**Paso 3.3 — Ver el bloque en la interfaz:**

1. Ir a **http://localhost:8012**
2. El bloque aparecerá en el panel **"Ledger (Cadena Aprobada)"** con el hash correcto.

**Paso 3.4 — Minar también desde Next.js:**
```bash
curl -X POST http://localhost:8012/api/blockchain/mine \
  -H "Content-Type: application/json"
```

O clic en el botón **"⛏️ MINAR BLOQUES PENDIENTES"** en la interfaz web.

✅ **Criterio:** El hash del bloque empieza con `00`. El bloque se propaga a todos los nodos sin errores.

---

### ✅ PRUEBA 4 — Validación de Bloques Malformados (Seguridad)

**Objetivo:** Demostrar que ningún nodo acepta bloques con hashes inválidos o PoW incorrecto.

**Paso 4.1 — Intentar insertar bloque con hash falso:**
```bash
curl -X POST http://localhost:8012/api/blockchain/receive-block \
  -H "Content-Type: application/json" \
  -d '{
    "persona_id": "fake-uuid",
    "institucion_id": "fake-uuid-2",
    "titulo_obtenido": "Hack Attempt",
    "hash_anterior": "0000000000000000000000000000000000000000000000000000000000000000",
    "hash_actual": "abcdef1234567890abcdef1234567890",
    "nonce": 0
  }'
```
**Respuesta esperada:**
```json
{ "error": "Bloque rechazado (Proof of Work inválido)" }
```

**Paso 4.2 — Intentar insertar con hash que no cumple PoW:**
```bash
curl -X POST http://localhost:8012/api/blockchain/receive-block \
  -H "Content-Type: application/json" \
  -d '{
    "persona_id": "fake-uuid",
    "titulo_obtenido": "Hack",
    "hash_actual": "ff3d9a...",
    "nonce": 1
  }'
```
**Respuesta esperada:** Status 400 — Hash rechazado.

✅ **Criterio:** Todos los intentos de inserción fraudulenta son rechazados con código 400 y mensaje explicativo.

---

### ✅ PRUEBA 5 — Consenso P2P (La Cadena Más Larga Gana)

**Objetivo:** Demostrar el algoritmo de consenso: cuando un nodo está desactualizado, adopta la cadena más larga de la red.

**Paso 5.1 — Crear divergencia de cadenas:**

1. Enviar varias transacciones desde **http://localhost:8012**.
2. Minar varios bloques solo desde **Next.js**:
   ```bash
   # Minar 3 veces desde Next.js
   curl -X POST http://localhost:8012/api/blockchain/mine -H "Content-Type: application/json"
   curl -X POST http://localhost:8012/api/blockchain/mine -H "Content-Type: application/json"
   curl -X POST http://localhost:8012/api/blockchain/mine -H "Content-Type: application/json"
   ```

**Paso 5.2 — Verificar las longitudes actuales:**
```bash
# Longitud en Laravel
curl http://localhost:8010/api/blockchain -H "Accept: application/json" | python3 -c "import sys,json; d=json.load(sys.stdin); print('Laravel:', len(d))"

# Longitud en Next.js (solo bloques minados)
curl http://localhost:8012/api/blockchain -H "Accept: application/json" | python3 -c "import sys,json; d=json.load(sys.stdin); print('Next.js:', len([b for b in d if b['hash_actual']]))"
```

**Paso 5.3 — Ejecutar consenso en Laravel:**
```bash
# Laravel pregunta a sus vecinos por la cadena más larga
curl http://localhost:8010/api/blockchain/resolve \
  -H "Accept: application/json"
```

**Respuesta si Next.js tenía más bloques:**
```json
{
  "message": "Cadena reemplazada por consenso",
  "new_length": 7
}
```

**Respuesta si ya era la más larga:**
```json
{
  "message": "La cadena local es la ganadora",
  "length": 7
}
```

**Paso 5.4 — También en Next.js via interfaz:**

1. Ir a **http://localhost:8012**
2. Clic en **"🔄 Sincronizar Red (Consenso)"**
3. El mensaje mostrará si se adoptó una cadena más larga.

✅ **Criterio:** El nodo con la cadena más corta adopta automáticamente la cadena más larga y válida de la red.

---

## 🔎 Endpoints de Referencia

### Todos los nodos comparten esta interfaz estándar:

| Método  | Ruta                         | Descripción                                    |
|---------|------------------------------|------------------------------------------------|
| `GET`   | `/api/blockchain`            | Ver todos los bloques minados                  |
| `POST`  | `/api/blockchain/mine`       | Minar transacciones pendientes (PoW)           |
| `POST`  | `/api/blockchain/receive-block` | Recibir bloque de otro nodo (P2P)          |
| `GET`   | `/api/blockchain/resolve`    | Consenso: adoptar la cadena más larga          |
| `GET`   | `/api/blockchain/validate`   | Validar integridad de la cadena local          |
| `POST`  | `/api/transactions`          | Registrar transacción en mempool + broadcast   |
| `GET`   | `/api/transactions`          | Ver transacciones pendientes                   |
| `POST`  | `/api/nodes/register`        | Registrar nodo vecino (`url` o `nodes` array)  |
| `GET`   | `/api/nodes`                 | Listar nodos vecinos registrados               |
| `GET`   | `/api/status`                | Estado del nodo                                |

### URLs rápidas por nodo:

| Endpoint                        | Laravel            | Express            | Next.js            |
|---------------------------------|--------------------|--------------------|--------------------|
| `GET /api/blockchain`           | :8010              | :8011              | :8012              |
| `POST /api/blockchain/mine`     | :8010              | :8011              | :8012 (UI también) |
| `GET /api/blockchain/resolve`   | :8010              | :8011              | :8012 (UI también) |
| `POST /api/transactions`        | :8010              | :8011              | :8012 (UI también) |
| Swagger UI                      | :8010/api/documentation | ❌            | ❌                 |
| Interfaz Web Premium            | ❌                 | ❌                 | :8012              |

---

## 🏛️ Algoritmo de Hash Unificado

Los tres nodos calculan el hash de un bloque de forma **idéntica** para garantizar interoperabilidad:

```
SHA-256( persona_id | institucion_id | titulo_obtenido | fecha_fin | hash_anterior | nonce )
```

Donde `|` es el separador entre campos. El Proof of Work exige que el resultado empiece con `00`.

---

## 🛑 Parar los contenedores

```bash
docker-compose down
```

---

## 📁 Estructura del Proyecto

```
BlockChain/
├── docker-compose.yml       # Orquestación de los 3 nodos
├── nodo-laravel/            # Nodo 1: API REST + Swagger + BD Supabase
├── nodo-express/            # Nodo 2: API REST + Blockchain en memoria
└── nodo-nextjs/             # Nodo 3: API REST + Interfaz Web Premium
```
