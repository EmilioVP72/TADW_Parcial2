<?php

namespace App\Http\Controllers;

use App\Models\Grado;
use App\Services\BlockchainService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class GradoController extends Controller
{
    protected $blockchain;

    public function __construct(BlockchainService $blockchain)
    {
        $this->blockchain = $blockchain;
    }

    /**
     * Lista todos los grados (La "Chain")
     */
    public function index()
    {
        return response()->json(Grado::with(['persona', 'institucion', 'programa'])->orderBy('creado_en', 'asc')->get());
    }

    /**
     * Almacena un nuevo grado y lo MINA en la red
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'persona_id'      => 'required|uuid',
            'institucion_id'  => 'required|uuid',
            'programa_id'     => 'required|uuid',
            'fecha_inicio'    => 'required|date',
            'fecha_fin'       => 'required|date',
            'titulo_obtenido' => 'required|string|max:255',
            'numero_cedula'   => 'required|string|unique:grados,numero_cedula',
            'firmado_por'     => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        try {
            return DB::transaction(function () use ($request) {
                // 1. Obtener el hash del último bloque para mantener la inmutabilidad
                $ultimoGrado = Grado::orderBy('creado_en', 'desc')->lockForUpdate()->first();
                $hashAnterior = $ultimoGrado ? $ultimoGrado->hash_actual : "0";

                // 2. Instanciar el nuevo grado (bloque)
                $nuevoGrado = new Grado($request->all());
                $nuevoGrado->hash_anterior = $hashAnterior;
                
                // 3. PROOF OF WORK (Minado)
                // Usamos el servicio para encontrar el nonce y el hash_actual
                $resultadoMinado = $this->blockchain->mineBlock($nuevoGrado);
                
                $nuevoGrado->hash_actual = $resultadoMinado['hash'];
                $nuevoGrado->nonce = $resultadoMinado['nonce'];
                
                $nuevoGrado->save();

                return response()->json([
                    'message' => 'Grado académico minado e insertado con éxito',
                    'data' => $nuevoGrado
                ], 201);
            });
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al minar el bloque: ' . $e->getMessage()], 500);
        }
    }

    public function validateChain()
    {
        $grados = Grado::orderBy('creado_en', 'asc')->get();
        $reporte = [];
        $esValida = true;

        for ($i = 0; $i < count($grados); $i++) {
            $bloqueActual = $grados[$i];
            
            // A. Verificar si el hash actual del bloque es correcto recalculándolo
            $hashRecalculado = $this->blockchain->calculateHash($bloqueActual);
            if ($bloqueActual->hash_actual !== $hashRecalculado) {
                $esValida = false;
                $reporte[] = "Error: Hash inválido en el bloque ID {$bloqueActual->id}. Los datos fueron alterados.";
            }

            // B. Verificar vínculo con el bloque anterior
            if ($i > 0) {
                $bloqueAnterior = $grados[$i - 1];
                if ($bloqueActual->hash_anterior !== $bloqueAnterior->hash_actual) {
                    $esValida = false;
                    $reporte[] = "Error: Ruptura de cadena en bloque ID {$bloqueActual->id}. El hash anterior no coincide.";
                }
            }
        }

        return response()->json([
            'chain_valid' => $esValida,
            'errors' => $reporte,
            'total_blocks' => count($grados)
        ]);
    }
}