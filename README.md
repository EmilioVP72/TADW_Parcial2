# 🌐 Red Blockchain Distribuida - Examen TADW

Este proyecto consiste en una red Blockchain descentralizada compuesta por 3 nodos independientes desarrollados en diferentes frameworks (**Laravel**, **Express** y **Next.js**). La red utiliza **Docker** para garantizar la paridad del entorno y **Supabase** como persistencia de datos compartida.

---

## 🚀 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

* **Docker** y **Docker Compose**
* **Git**
* Una cuenta en **Supabase** (para las variables de entorno)

---

## 🛠️ Estructura de la Red

| Servicio   | Framework            | Puerto Local | Host Interno (Docker)            |
| ---------- | -------------------- | ------------ | -------------------------------- |
| **Nodo 1** | Laravel 11 (PHP 8.4) | `8010`       | `http://blockchain-laravel:8010` |
| **Nodo 2** | Express (Node 18)    | `8011`       | `http://blockchain-express:8011` |
| **Nodo 3** | Next.js (Node 20)    | `8012`       | `http://blockchain-next:8012`    |

---

## ⚡ Instalación y Despliegue

Sigue estos pasos para levantar el entorno completo:

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPO>
cd BlockChain
```

---

### 2. Configuración de Variables de Entorno (.env)

Cada nodo requiere su propio archivo `.env`. Copia los ejemplos y configura las credenciales de Supabase:

* **Laravel**:
  Entra a `nodo-laravel/` y configura el `.env` (especialmente `DB_CONNECTION=pgsql`).

* **Express / Next.js**:
  Configura las keys de Supabase:

  * `SUPABASE_URL`
  * `SUPABASE_ANON_KEY`

---

### 3. Construir y Levantar con Docker

Desde la raíz del proyecto (donde está el `docker-compose.yml`):

```bash
docker-compose up --build
```

---

### 4. Inicialización de Laravel (Solo la primera vez)

Una vez que los contenedores estén corriendo, abre una nueva terminal y ejecuta:

```bash
docker exec blockchain-laravel php artisan key:generate
docker exec blockchain-laravel php artisan migrate
```

---

## 🔗 Comunicación entre Nodos

Al estar dentro de la misma red de Docker (`blockchain-net`), los nodos pueden comunicarse usando sus nombres de servicio.

**Ejemplo:**

Si el nodo de Laravel quiere consultar el estado del nodo de Express:

```
http://blockchain-express:8011
```

---

## 📝 Reglas del Examen (Protocolo de Consenso)

Para que la Blockchain sea válida, todos los nodos deben implementar la misma lógica de Hashing:

* **Algoritmo:** SHA-256

* **Estructura del Bloque:**

  * `index`
  * `timestamp`
  * `data` (JSON)
  * `previous_hash`
  * `hash`
  * `nonce`

* **Dificultad (Proof of Work - PoW):**
  El hash generado debe comenzar con `"00"` (dos ceros).

* **Inmutabilidad:**
  Si un bloque es alterado en Supabase, el siguiente nodo debe marcar la cadena como **INVÁLIDA** al comparar los hashes vinculados.

---

## 🛡️ Solución de Problemas Comunes

### Permisos (Linux / CachyOS)

Si Docker no puede escribir en las carpetas:

```bash
sudo chown -R $USER:$USER .
```

---

### Error de Node Native Bindings

Si Next.js da error de Tailwind:

```bash
rm -rf node_modules package-lock.json
docker-compose up --build
```

---

### Puertos Ocupados

Asegúrate de que los puertos `8000`, `3000` y `3001` no estén siendo usados por otras aplicaciones.

---

### Endpoints sugeridos:

#### 🔹 Estado del nodo

```
GET /api/status
```

#### 🔹 Obtener blockchain completa

```
GET /api/chain
```

#### 🔹 Minar un nuevo bloque

```
POST /api/mine
```

#### 🔹 Validar la cadena

```
GET /api/validate
```

#### 🔹 Agregar transacción (opcional)

```
POST /api/transactions
```

---

