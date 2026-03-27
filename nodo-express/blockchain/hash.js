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