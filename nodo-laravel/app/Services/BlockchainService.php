<?php
namespace App\Services;

class BlockchainService {
    protected $difficulty = "00";

    public function calculateHash($grado) {
        // IMPORTANTE: Este algoritmo debe ser idéntico al de Next.js (lib/blockchain.ts)
        // Formato: persona_id|institucion_id|titulo_obtenido|fecha_fin|hash_anterior|nonce
        $parts = [
            $grado->persona_id ?? '',
            $grado->institucion_id ?? '',
            $grado->titulo_obtenido ?? '',
            $grado->fecha_fin ?? '',
            $grado->hash_anterior ?? '',
            (string)($grado->nonce ?? 0),
        ];
        $string = implode('|', $parts);
        return hash('sha256', $string);
    }

    public function mineBlock($grado) {
        $nonce = 0;
        $hash = "";
        $difficulty = "00";

        while (true) {
            $grado->nonce = $nonce;
            $hash = $this->calculateHash($grado);
            
            if (str_starts_with($hash, $difficulty)) {
                return [
                    'hash' => $hash,
                    'nonce' => $nonce
                ]; 
            }
            $nonce++;
        }
    }
}