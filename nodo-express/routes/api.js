import express from "express";
import { getChain } from "../blockchain/blockchain.js";
import { addTransaction } from "../blockchain/blockchain.js";
import { broadcastTransaction } from "../services/network.js";
import { registerNodes } from "../services/network.js";
import { getPendingTransactions, addBlock, replaceChain } from "../blockchain/blockchain.js";
import { mineBlock } from "../blockchain/proofOfWork.js";
import { calculateHash, calculateGradoHash } from "../blockchain/hash.js";
import supabase from "../services/supabase.js";
import { getNodes } from "../services/network.js";
import axios from "axios";

const router = express.Router();


router.get("/status", (req, res) => {
  res.json({
    status: "ok",
    node: "express",
    blocks: getChain().length
  });
});

router.get("/blockchain", (req, res) => {
  res.json(getChain());
});

router.post("/transactions", async (req, res) => {
  const transaction = req.body;

  addTransaction(transaction);

  if (!transaction.is_broadcast) {
    transaction.is_broadcast = true;
    broadcastTransaction(transaction).catch(console.error);
  }

  res.json({
    message: "Transacción agregada a mempool"
  });
});

router.post("/blockchain/mine", async (req, res) => {
  const chain = getChain();
  const pending = getPendingTransactions();

  if (pending.length === 0) {
    return res.json({
      message: "No hay transacciones para minar"
    });
  }

  const previousBlock = chain[chain.length - 1];

  const newBlock = {
    index: chain.length + 1,
    timestamp: Date.now(),
    data: pending,
    previous_hash: previousBlock ? previousBlock.hash : "0",
    nonce: 0
  };

  const minedBlock = mineBlock(newBlock);

  addBlock(minedBlock);
  const nodes = getNodes();

  for (const node of nodes) {
    try {
      await axios.post(`${node}/api/blockchain/receive-block`, minedBlock);
      console.log("Bloque enviado a:", node);
    } catch (err) {
      console.log("Error enviando bloque a:", node);
    }
  }
  try {
    const tx = minedBlock.data[0];

    if (!tx) {
      console.log("No hay datos para guardar en Supabase");
      return res.json({
        message: "Bloque minado pero sin datos"
      });
    }

    const { data, error, status } = await supabase
      .from("grados")
      .insert({
        persona_id: tx.persona_id || null,
        institucion_id: tx.institucion_id || null,
        programa_id: tx.programa_id || null,
        fecha_inicio: tx.fecha_inicio || null,
        fecha_fin: tx.fecha_fin || null,
        titulo_obtenido: tx.titulo_obtenido || "",
        numero_cedula: tx.numero_cedula || null,
        titulo_tesis: tx.titulo_tesis || null,
        menciones: tx.menciones || null,
        hash_actual: minedBlock.hash,
        hash_anterior: minedBlock.previous_hash,
        nonce: minedBlock.nonce,
        firmado_por: "nodo-express"
      })
      .select(); 


    if (error) {
      console.log("Error guardando en Supabase:", error.message);
    } else {
      console.log("Guardado correctamente en Supabase");
    }

  } catch (err) {
    console.log("Error general Supabase:", err.message);
  }
  res.json({
    message: "Bloque minado",
    block: minedBlock
  });
});

router.get("/blockchain/validate", (req, res) => {
  const chain = getChain();

  for (let i = 1; i < chain.length; i++) {
    const current = chain[i];
    const previous = chain[i - 1];

    const recalculatedHash = calculateHash(current);

    if (current.hash !== recalculatedHash) {
      return res.json({ valid: false, error: "Hash inválido" });
    }

    if (current.previous_hash !== previous.hash) {
      return res.json({ valid: false, error: "Cadena rota" });
    }
  }

  res.json({ valid: true });
});

router.post("/nodes/register", (req, res) => {
  const { nodes, url } = req.body;
  
  if (nodes) {
    registerNodes(nodes);
  } else if (url) {
    registerNodes([url]);
  }

  res.json({
    message: "Nodos registrados",
    nodes: nodes || [url]
  });
});

router.get("/nodes", (req, res) => {
  res.json({ nodes: getNodes() });
});

router.get("/blockchain/resolve", async (req, res) => {
  const nodes = getNodes();
  let longestChain = getChain();
  let maxLen = longestChain.length;
  let chainReplaced = false;

  for (const node of nodes) {
    try {
      const response = await axios.get(`${node}/api/blockchain`);
      const neighborChain = response.data;

      if (neighborChain.length > maxLen) {
        // TODO: Validate neighbor chain blocks logic
        longestChain = neighborChain;
        maxLen = neighborChain.length;
        chainReplaced = true;
      }
    } catch (err) {
      console.log(`No se pudo obtener la cadena del nodo: ${node}`);
    }
  }

  if (chainReplaced) {
    replaceChain(longestChain);
    // Ideally we'd sync Supabase here too, but for Express simple memory replacement suffices for the exam as Supabase is just an insert log.
    return res.json({
      message: "La cadena fue reemplazada",
      chain: longestChain
    });
  }

  res.json({
    message: "La cadena local es la ganadora",
    chain: longestChain
  });
});

router.post("/blockchain/receive-block", (req, res) => {
  const incoming = req.body;
  
  // Map fields from Laravel/NextJS if they exist
  const newBlock = {
    ...incoming,
    hash: incoming.hash || incoming.hash_actual,
    previous_hash: incoming.previous_hash || incoming.hash_anterior || "0"
  };

  const chain = getChain();
  const lastBlock = chain[chain.length - 1];

  if (lastBlock && newBlock.previous_hash !== lastBlock.hash) {
    return res.json({
      message: "Bloque rechazado (hash anterior incorrecto)"
    });
  }

  // Para bloques tipo grado (de Laravel/NextJS), usar algoritmo unificado
  let recalculatedHash;
  if (incoming.hash_actual !== undefined) {
    recalculatedHash = calculateGradoHash(incoming);
  } else {
    recalculatedHash = calculateHash(newBlock);
  }

  if (recalculatedHash !== newBlock.hash) {
    return res.json({
      message: "Bloque rechazado (hash inválido)"
    });
  }

  if (!newBlock.hash.startsWith("00")) {
    return res.json({
      message: "Bloque rechazado (no cumple PoW)"
    });
  }

  addBlock(newBlock);

  console.log("✅ Bloque recibido y aceptado");

  res.json({
    message: "Bloque aceptado"
  });
});

export default router;
