import axios from "axios";

let nodes = [];

export function registerNodes(newNodes) {
  newNodes.forEach(node => {
    if (!nodes.includes(node)) {
      nodes.push(node);
    }
  });
}

export function getNodes() {
  return nodes;
}

export async function broadcastTransaction(tx) {
  for (const node of nodes) {
    try {
      await axios.post(`${node}/api/transactions`, tx);
      console.log("Enviado a:", node);
    } catch (err) {
      console.log("Error enviando a nodo:", node);
    }
  }
}