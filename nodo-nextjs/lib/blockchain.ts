import "server-only"

import { createHash } from "crypto"

declare global {
  var registeredNodes: string[] | undefined;
}

export function getPeerNodes(): string[] {
  if (!globalThis.registeredNodes) {
    const envNodes = process.env.PEER_NODES ? process.env.PEER_NODES.split(",").map((n: string) => n.trim()).filter(Boolean) : [];
    globalThis.registeredNodes = envNodes;
  }
  return globalThis.registeredNodes || [];
}

export function addPeerNode(url: string) {
  const nodes = getPeerNodes();
  if (!nodes.includes(url)) {
    nodes.push(url);
  }
}

/**
 * Tipo de un bloque en la blockchain de grados.
 * Corresponde a la tabla grados de Supabase.
 */
export interface GradoBloque {
  id: string
  persona_id: string
  institucion_id: string
  programa_id: string
  fecha_inicio: string
  fecha_fin: string
  titulo_obtenido: string
  numero_cedula: string
  titulo_tesis: string
  menciones: string | null
  hash_actual: string
  hash_anterior: string | null
  nonce: number
  firmado_por: string | null
  creado_en: string
}

/**
 * Calcula el SHA-256 de un bloque concatenando sus valores con |.
 * Valores: personaId | institucionId | tituloObtenido | fechaFin | hashAnterior | nonce
 */
export function calcularHash(
  personaId: string,
  institucionId: string,
  tituloObtenido: string,
  fechaFin: string,
  hashAnterior: string | null,
  nonce: number
): string {
  const data = [
    personaId,
    institucionId,
    tituloObtenido,
    fechaFin,
    hashAnterior || "",
    nonce.toString(),
  ].join("|")

  return createHash("sha256").update(data).digest("hex")
}

/**
 * Realiza Proof of Work incrementando el nonce hasta encontrar un hash que comience con "00".
 * Retorna { nonce, hash }.
 */
export function proofOfWork(
  personaId: string,
  institucionId: string,
  tituloObtenido: string,
  fechaFin: string,
  hashAnterior: string | null
): { nonce: number; hash: string } {
  let nonce = 0
  let hash = calcularHash(
    personaId,
    institucionId,
    tituloObtenido,
    fechaFin,
    hashAnterior,
    nonce
  )

  while (!hash.startsWith("000")) {
    nonce++
    hash = calcularHash(
      personaId,
      institucionId,
      tituloObtenido,
      fechaFin,
      hashAnterior,
      nonce
    )
  }

  return { nonce, hash }
}

/**
 * Valida la integridad de una cadena de bloques.
 * Para cada bloque (excepto el primero):
 * - Verifica que hash_actual coincida con el recalculado.
 * - Verifica que hash_anterior coincida con hash_actual del bloque anterior.
 */
export function validarCadena(bloques: GradoBloque[]): boolean {
  if (bloques.length === 0) {
    return true
  }

  // Validar el bloque génesis: no debe tener hash_anterior.
  const genesis = bloques[0]
  const hashGenesis = calcularHash(
    genesis.persona_id,
    genesis.institucion_id,
    genesis.titulo_obtenido,
    genesis.fecha_fin,
    null,
    genesis.nonce
  )

  if (genesis.hash_actual !== hashGenesis) {
    console.error("Error: hash_actual del bloque génesis no coinc de")
    return false
  }

  // Validar resto de bloques.
  for (let i = 1; i < bloques.length; i++) {
    const bloque = bloques[i]
    const bloqueAnterior = bloques[i - 1]

    // Verificar que hash_anterior coincida con hash_actual del bloque anterior.
    if (bloque.hash_anterior !== bloqueAnterior.hash_actual) {
      console.error(
        `Error: hash_anterior del bloque ${i} no coincide con hash_actual del bloque anterior`
      )
      return false
    }

    // Recalcular hash_actual y verificar que coincida.
    const hashRecalculado = calcularHash(
      bloque.persona_id,
      bloque.institucion_id,
      bloque.titulo_obtenido,
      bloque.fecha_fin,
      bloque.hash_anterior,
      bloque.nonce
    )

    if (bloque.hash_actual !== hashRecalculado) {
      console.error(
        `Error: hash_actual del bloque ${i} no coincide con el recalculado`
      )
      return false
    }
  }

  return true
}

/**
 * Verifica si una cadena remota es más larga que la local y es válida.
 */
export function esCAdenaMasLarga(
  cadenaLocal: GradoBloque[],
  cadenaRemota: GradoBloque[]
): boolean {
  // La cadena remota debe ser más larga.
  if (cadenaRemota.length <= cadenaLocal.length) {
    return false
  }

  // La cadena remota debe ser válida.
  if (!validarCadena(cadenaRemota)) {
    return false
  }

  return true
}

/**
 * Propaga un mensaje (transacción, bloque, etc.) a todos los nodos peer.
 * Lee PEER_NODES como una lista separada por comas.
 * Los errores de peers caídos se capturan silenciosamente.
 */
export async function propagarANodos(
  endpoint: string,
  body: Record<string, unknown>
): Promise<void> {
  const peerNodes = getPeerNodes()
  if (peerNodes.length === 0) {
    // Sin nodos pares, no hay a qué propagar.
    return
  }

  const promises = peerNodes.map(async (peerUrl) => {
    try {
      const url = `${peerUrl}${endpoint}`
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(3000),
      })

      if (!response.ok) {
        console.warn(`Advertencia: nodo ${peerUrl} retornó estado ${response.status}`)
      }
    } catch (error) {
      // Capturar silenciosamente errores de nodos caídos.
      console.warn(`Advertencia: no se pudo conectar a ${peerUrl}`)
    }
  })

  await Promise.all(promises)
}
