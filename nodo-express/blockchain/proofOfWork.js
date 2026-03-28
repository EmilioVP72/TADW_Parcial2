import { calculateHash } from "./hash.js";

export function mineBlock(block) {
  let nonce = 0;
  let hash = "";

  do {
    nonce++;
    block.nonce = nonce;
    hash = calculateHash(block);
  } while (!hash.startsWith("000"));

  return {
    ...block,
    hash,
    nonce
  };
}