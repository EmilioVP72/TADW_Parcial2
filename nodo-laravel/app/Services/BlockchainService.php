<?php
namespace App\Services;

class BlockchainService {
    protected $difficulty = "00";

    public function calculateHash($grado) {
        $string = $grado->persona_id . 
                      $grado->institucion_id . 
                      $grado->programa_id . 
                      $grado->numero_cedula . 
                      $grado->hash_anterior . 
                      $grado->nonce;

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