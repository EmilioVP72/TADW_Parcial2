import crypto from "crypto";

export function calculateHash(block) {
  const dataString = JSON.stringify({
    index: block.index,
    timestamp: block.timestamp,
    data: block.data,
    previous_hash: block.previous_hash,
    nonce: block.nonce
  });

  return crypto.createHash("sha256").update(dataString).digest("hex");
}

/**
 * Hash estándar compartido con Laravel y Next.js:
 * persona_id|institucion_id|titulo_obtenido|fecha_fin|hash_anterior|nonce
 */
export function calculateGradoHash(grado) {
  const parts = [
    grado.persona_id ?? '',
    grado.institucion_id ?? '',
    grado.titulo_obtenido ?? '',
    grado.fecha_fin ?? '',
    grado.hash_anterior ?? '',
    String(grado.nonce ?? 0),
  ];
  return crypto.createHash("sha256").update(parts.join("|")).digest("hex");
}