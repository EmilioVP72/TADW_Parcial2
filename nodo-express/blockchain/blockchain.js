let chain = [];
let pendingTransactions = [];

export function getChain() {
  return chain;
}

export function addTransaction(tx) {
  pendingTransactions.push(tx);
}

export function getPendingTransactions() {
  return pendingTransactions;
}

export function addBlock(block) {
  chain.push(block);
  pendingTransactions = [];
}