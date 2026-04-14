# APIs de Nodos Blockchain Distribuida

Este documento describe las rutas API implementadas en cada nodo de la red Blockchain (Express, Laravel, Next.js). Todas manejan el proceso de propagación de transacciones, minería, y consenso de la red P2P.

## 1. Nodo Express (`nodo-express`)

El nodo construido con **Node.js + Express** contiene los endpoints descritos en su archivo `routes/api.js`. Es el puerto principal de entrada en algunas configuraciones y mantiene estado en memoria además de registrar directamente en Supabase.

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/status` | Devuelve el estado actual de salud del nodo y el número de bloques que tiene en su cadena local. |
| `GET` | `/api/blockchain` | Retorna el listado completo de los bloques de la cadena local. |
| `POST` | `/api/transactions` | Recibe una transacción (datos de grado), la agrega a la mempool (transacciones pendientes) y la propaga (`broadcast`) a los nodos vecinos en la red si no viene previamente propagada. |
| `POST` | `/api/blockchain/mine` | Mina un nuevo bloque en la red con las transacciones en la mempool utilizando Proof of Work, propaga el nuevo bloque y persiste los datos del grado junto con el hash en Supabase. |
| `GET` | `/api/blockchain/validate` | Re-calcula los hashes de todos los bloques en la cadena local para verificar que no haya sido alterada ("manipulada"). |
| `POST` | `/api/nodes/register` | Agrega un nuevo nodo vecino (o varios) a la lista local para la topología de la red P2P. |
| `GET` | `/api/nodes` | Retorna el arreglo de nodos vecinos guardados en memoria del servidor. |
| `GET` | `/api/blockchain/resolve` | Ejecuta el algoritmo de *Consenso*. Consulta la longitud de la cadena de todos los nodos vecinos (`/api/blockchain`). Si hay alguna más grande (la más larga gana), reemplaza la cadena local con esa. |
| `POST` | `/api/blockchain/receive-block` | Recibe un bloque minado por otro nodo. Valida el proof of work (que el hash comience con `00` y sea válido correspondientemente al hash anterior) y si cumple las condiciones lo anexa a la cadena local. |

---

## 2. Nodo Laravel (`nodo-laravel`)

El nodo manejado en el framework **Laravel** gestiona la lógica a través del `GradoController`. Expone un grupo de utilidades similares bajo el grupo de rutas `api.php`.

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/blockchain` | Retorna el estado completo del blockchain que conoce este nodo particular. |
| `POST` | `/api/blockchain/mine` | Consolida y mina un nuevo bloque usando las transacciones en memoria, logrando el consenso local y esparciendo el mismo a la red. |
| `GET` | `/api/blockchain/validate` | Realiza el chequeo de la consistencia e integridad entre un bloque y otro revisando `hash_actual` y `hash_anterior`. |
| `GET` | `/api/blockchain/resolve` | Implementación de consenso en Laravel, conectándose también a los nodos de Express/Next para obtener sus cadenas y tomar la cadena más fiable o más larga. |
| `POST` | `/api/blockchain/receive-block` | Punto de enlace para que Express o Next JS transmitan un nuevo bloque minado hacia la instancia corriendo de Laravel. |
| `POST` | `/api/transactions` | Añade una transacción y asegura su distribución al resto del clúster sin generar duplicados infintos en el broadcast. |
| `POST` | `/api/nodes/register` | Endpoint de registro de nodos pares. |
| `GET` | `/api/nodes` | Trae la configuración de pares registrados actualmente accesibles para Laravel. |

---

## 3. Nodo Next.js (`nodo-nextjs`)

Este nodo, construido con `App Router` dentro de la carpeta `app/api/.../route.ts` , actúa como un actor completo en el sistema distribuido a la vez que se desempeña como un frontend completo.

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/status` | Devuelve información sobre el estado del nodo y si se encuentra accesible en la red. |
| `GET` | `/api/blockchain` | Obtiene el array listado con la información sobre los bloques procesados por éste nodo. |
| `POST` | `/api/blockchain/mine` | Cierra las transacciones pendientes mediante PoW. Transmite los datos mediante el P2P. |
| `POST` | `/api/blockchain/receive-block` | Recibe el llamado desde Laravel o Express cada vez que estos resuelven un minado y el bloque requiere sumarse al store en la parte de Next.js. |
| `GET` | `/api/blockchain/resolve` | Aplica la regla del consenso validando todas las cadenas desde los peers registrados para llegar a la fuente única de la verdad con la cadena más larga. |
| `POST`/`GET`| `/api/transactions` | Manejo de las transacciones compartidas con la validación para luego ser procesadas por el subconjunto P2P. |
| `POST` | `/api/nodes/register` | Agrega nodos permitiendo escalar en vivo mediante añadir enlaces desde el front end o peticiones API sin reconstruir. |
| `GET` | `/api/docs` | Contiene auto-documentación y un vistazo de Swagger / OpenAPI de los endpoints implementados en NextJS. |

---

> **Nota:** Se adjuntarán los recursos y colecciones de Postman para poder testear cómodamente cada uno de los nodos levantados concurrentemente en el proyecto.
