# Guía de Pruebas para la Evaluación (Blockchain Distribuido)

Este documento es tu guía paso a paso para demostrarle al profesor/evaluador que tu red de Blockchain cumple con todos los requisitos del examen:
1. Nodos interconectados (Registro mutuo).
2. Propagación de Transacciones al instante (Mempool).
3. Consenso (La cadena más larga y válida manda).
4. Emisión de nuevos bloques con Proof of Work de dificultad `000` y propagación `hash_anterior`.
5. Interfaz Visual Premium en NextJS y Documentación en Swagger Laravel.

---

## Preparación de la Demostración

Asegúrate de tener todos los nodos levantados:
- **Laravel:** `http://localhost:8010`
- **Express:** `http://localhost:8011`
- **Next.js:** `http://localhost:8012`

Abre 3 pestañas en tu navegador (o Postman).
En una pestaña, abre la interfaz premium: `http://localhost:8012`.

---

## 🟢 Prueba 1: Registro Cruzado de Nodos

Para que los nodos se "hablen", deben conocer las URLs de sus compañeros. Vamos a registrarlos bidireccionalmente.

1.  **Registrar Laravel y Next.js dentro de Express:**
    - **Endpoint:** `POST http://localhost:8011/api/nodes/register`
    - **Body (JSON):**
      ```json
      {
         "nodes": ["http://blockchain-laravel:8000", "http://blockchain-next:3000"]
      }
      ```
      > [!NOTE]
      > Como corren dentro de la red Docker (`blockchain-net`), los nombres para verse entre sí son los nombres de los contenedores y sus puertos expuestos internamente (`8000` y `3000`).

2.  **Registrar Express y Next.js dentro de Laravel:**
    - Abre Swagger en `http://localhost:8010/api/documentation`
    - Busca el endpoint `/nodes/register` y envía dos peticiones, una con:
      ```json
      { "url": "http://blockchain-express:3000" }
      ```
      Y otra con:
      ```json
      { "url": "http://blockchain-next:3000" }
      ```

3.  **Registrar Express y Laravel dentro de Next.js:**
    - Ejecuta mediante Postman o Curl:
      `POST http://localhost:8012/api/nodes/register`
      ```json
      { "url": "http://blockchain-express:3000" }
      ```
      ```json
      { "url": "http://blockchain-laravel:8000" }
      ```

---

## 🟡 Prueba 2: Propagación de Transacciones (Mempool)

Demuestra que "el chisme" funciona correctamente.

1. Ve a la **Interfaz Web** (Next.js) en `http://localhost:8012`.
2. Dirígete a **"Registrar Título"**.
3. Ingresa los datos de una persona (Ej: "Juan", "Pérez", "UADE", "Ingeniería Informática") y dale a **Enviar a Mempool**.
4. Verás aparecer la transacción automáticamente a tu derecha en rojo bajo la sección **"Mempool (Pendientes)"**.
5. **Comprobación Cruzada (La Magia):**
   Abre una pestaña y consulta qué tiene Laravel:
   Haz un `GET` a tu base de datos o revisa la memoria desde Swagger para notar que Laravel *también* recibió la transacción de Juan Pérez porque Next.js se la envió (Broadcast).

---

## 🟣 Prueba 3: Proof of Work y Propagación de Bloque

Es hora de minar la transacción que quedó pendiente.

1. Desde Swagger (`http://localhost:8010/api/documentation`), ejecuta el minado de Laravel con `POST /blockchain/mine`.
2. Laravel tomará lo que está pendiente, ejecutará el **Proof of Work** pidiendo "000" como inicio del hash. 
3. Cuando termine (tardará unos segundos), te regresará el bloque. Verifica visualmente que `hash_actual` empieza con `000`.
4. En cuanto Laravel terminó, avisó de inmediato a Express y a Next.js y les envió el bloque entero.
5. **Comprobación:** Ve al navegador en `http://localhost:8012` (Next.js) y dale al botón de refrescar **"Ledger (Cadena Aprobada)"**. ¡Verás que el bloque está ahí iluminado en la pantalla de Next.js con sus hashes correctos!

---

## 🔴 Prueba 4: Validación de Malformaciones y Nodos Deshonestos

El evaluador seguramente pedirá forzar la inclusión de un bloque inválido.

1. Desde Postman, intenta hacerle un `POST` directo a Next.js (`http://localhost:8012/api/receive-block`) pero altera un hash enviando `hash_actual: "000x23..."` con un cuerpo inválido o con un `hash_anterior` que no tiene nada que ver con el bloque de Juan Pérez.
2. Observarás que el nodo te regresa `Status 400: Bloque rechazado (hash anterior incorrecto / modificado / PoW inválido)`. Ningún nodo se infecta.

---

## 🔵 Prueba 5: Algoritmo de Consenso (La cadena más larga gana)

Vamos a forzar a que un nodo se quede atrasado resolviéndolo con Consenso.

1. Envía rápidamente dos transacciones desde la web de **Next.js** y extrañamente apaga el contenedor de Laravel. (O simplemente no registres a Laravel en los nodos).
2. Dale a **Minar bloque** en la Interfaz Web.
3. Next.js mina 2 veces, generando un Ledger de 3 bloques de longitud. (Laravel sigue atascado en 1 bloque de longitud).
4. Vuelve a registrar/prender el contacto entre los nodos. 
5. Desde Swagger (Laravel), lanza el endpoint `GET /blockchain/resolve`.
6. Laravel preguntará a todos sus compañeros cuál es su longitud. Verá que Next.js tiene 3 bloques y Laravel solo 1.
7. Laravel ejecutará un borrado maestro de su base de datos local y **reemplazará instantáneamente** su base de datos con las entradas completas de Next.js, asumiendo su `hash_anterior` y hashes correctos.
8. Para verificar que copió bien, haz `GET /blockchain` en Laravel y verás la cadena sincronizada e idéntica.
