<?php

namespace App\Http\Controllers;

use App\Models\Grado;
use App\Models\PeerNode;
use App\Models\PendingTransaction;
use App\Services\BlockchainService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use OpenApi\Attributes as OA;

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
    #[OA\Get(
        path: '/blockchain',
        summary: 'Lista todos los grados (La Chain)',
        responses: [
            new OA\Response(response: 200, description: 'OK')
        ]
    )]
    public function index()
    {
        return response()->json(Grado::with(['persona', 'institucion', 'programa'])->orderBy('creado_en', 'asc')->get());
    }

    /**
     * Agrega una transacción a la mempool y la propaga
     */
    #[OA\Post(
        path: '/transactions',
        summary: 'Agrega una transacción a la mempool y la propaga',
        responses: [
            new OA\Response(response: 200, description: 'OK')
        ]
    )]
    public function storeTransaction(Request $request)
    {
        // Si es un broadcast de otro nodo, insertar directamente sin validación estricta
        if ($request->input('is_broadcast')) {
            $allowed = ['persona_id', 'institucion_id', 'programa_id', 'fecha_inicio', 'fecha_fin',
                        'titulo_obtenido', 'numero_cedula', 'firmado_por', 'titulo_tesis', 'menciones'];
            $data = $request->only($allowed);
            $tx = PendingTransaction::create($data);
            return response()->json(['message' => 'Transacción recibida (broadcast)', 'data' => $tx], 201);
        }

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

        $tx = PendingTransaction::create($request->all());

        if (!$request->input('is_broadcast')) {
            // Propagar transacción
            $nodos = PeerNode::all();
            $payload = $tx->toArray();
            $payload['is_broadcast'] = true;

            foreach ($nodos as $nodo) {
                try {
                    Http::timeout(3)->post($nodo->url . '/api/transactions', $payload);
                } catch (\Exception $e) {
                    // Ignore timeout
                }
            }
        }

        return response()->json(['message' => 'Transacción agregada a pendientes y propagada', 'data' => $tx], 201);
    }

    /**
     * Mina las transacciones pendientes en un nuevo bloque
     */
    #[OA\Post(
        path: '/blockchain/mine',
        summary: 'Mina las transacciones pendientes en un nuevo bloque',
        responses: [
            new OA\Response(response: 200, description: 'OK')
        ]
    )]
    public function mine()
    {
        $pendientes = PendingTransaction::all();
        
        if ($pendientes->isEmpty()) {
            return response()->json(['message' => 'No hay transacciones pendientes para minar'], 400);
        }

        try {
            return DB::transaction(function () use ($pendientes) {
                $ultimoGrado = Grado::orderBy('creado_en', 'desc')->lockForUpdate()->first();
                $hashAnterior = $ultimoGrado ? $ultimoGrado->hash_actual : "0";

                $minedBlocks = [];
                
                foreach ($pendientes as $tx) {
                    $nuevoGrado = new Grado($tx->toArray());
                    // Laravel no auto-asigna UUID si lo pasamos sin mapearlo bien en este caso? Sí, lo hace en migraciones.
                    $nuevoGrado->hash_anterior = $hashAnterior;
                    
                    // PROOF OF WORK (Minado modificado para 3 ceros en BlockchainService localmente si aplica)
                    $resultadoMinado = $this->blockchain->mineBlock($nuevoGrado);
                    
                    $nuevoGrado->hash_actual = $resultadoMinado['hash'];
                    $nuevoGrado->nonce = $resultadoMinado['nonce'];
                    $nuevoGrado->save();
                    
                    $hashAnterior = $nuevoGrado->hash_actual;
                    $minedBlocks[] = $nuevoGrado;

                    // Propagar bloque minado
                    $nodos = PeerNode::all();
                    foreach ($nodos as $nodo) {
                        try {
                            Http::timeout(3)->post($nodo->url . '/api/blockchain/receive-block', $nuevoGrado->toArray());
                        } catch (\Exception $e) {
                            // Ignore error
                        }
                    }
                }

                // Limpiar transacciones
                PendingTransaction::truncate();

                return response()->json([
                    'message' => 'Bloques minados con éxito',
                    'blocks' => $minedBlocks
                ], 201);
            });
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al minar: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Recibe un bloque minado por otro nodo y lo valida
     */
    #[OA\Post(
        path: '/blockchain/receive-block',
        summary: 'Recibe un bloque minado por otro nodo y lo valida',
        responses: [
            new OA\Response(response: 200, description: 'OK')
        ]
    )]
    public function receiveBlock(Request $request)
    {
        $blockData = $request->all();
        
        $ultimoGrado = Grado::orderBy('creado_en', 'desc')->first();
        $ultimoHash = $ultimoGrado ? $ultimoGrado->hash_actual : "0";

        if ($blockData['hash_anterior'] !== $ultimoHash) {
            return response()->json(['message' => 'Bloque rechazado (hash anterior incorrecto)'], 400);
        }

        if (substr($blockData['hash_actual'], 0, 3) !== "000" && substr($blockData['hash_actual'], 0, 2) !== "00") {
            // Aceptamos 000 y 00 temporalmente por si un nodo Express sigue en 00.
            return response()->json(['message' => 'Bloque rechazado (Proof of Work inválido)'], 400);
        }
        
        // Asignamos al grado e insertamos
        $grado = new Grado($blockData);
        
        $hashRecalculado = $this->blockchain->calculateHash($grado);
        if ($hashRecalculado !== $grado->hash_actual) {
            return response()->json(['message' => 'Bloque rechazado (hash modificado)'], 400);
        }

        $grado->save();
        PendingTransaction::truncate(); // Asumimos que resolvimos algo de la mempool

        return response()->json(['message' => 'Bloque aceptado e insertado'], 201);
    }

    /**
     * Algoritmo de Consenso: Reemplaza la cadena con la más larga de los vecinos
     */
    #[OA\Get(
        path: '/blockchain/resolve',
        summary: 'Algoritmo de Consenso: Reemplaza la cadena con la más larga de los vecinos',
        responses: [
            new OA\Response(response: 200, description: 'OK')
        ]
    )]
    public function resolve()
    {
        $nodos = PeerNode::all();
        $cadenaLocal = Grado::orderBy('creado_en', 'asc')->get();
        $maxLen = $cadenaLocal->count();
        $cadenaGanadora = null;

        foreach ($nodos as $nodo) {
            try {
                $response = Http::timeout(5)->get($nodo->url . '/api/blockchain');
                if ($response->successful()) {
                    $cadenaVecina = $response->json();
                    if (count($cadenaVecina) > $maxLen) {
                        $maxLen = count($cadenaVecina);
                        $cadenaGanadora = $cadenaVecina;
                    }
                }
            } catch (\Exception $e) {
                // Ignore
            }
        }

        if ($cadenaGanadora) {
            DB::transaction(function () use ($cadenaGanadora) {
                Grado::truncate();
                foreach ($cadenaGanadora as $bloque) {
                    $g = new Grado();
                    $g->fill($bloque);
                    if(isset($bloque['hash_actual'])) $g->hash_actual = $bloque['hash_actual'];
                    if(isset($bloque['hash_anterior'])) $g->hash_anterior = $bloque['hash_anterior'];
                    if(isset($bloque['nonce'])) $g->nonce = $bloque['nonce'];
                    if(isset($bloque['creado_en'])) $g->creado_en = $bloque['creado_en'];
                    if(isset($bloque['id'])) $g->id = $bloque['id'];
                    $g->save();
                }
            });
            return response()->json([
                'message' => 'Cadena reemplazada por consenso',
                'new_length' => count($cadenaGanadora)
            ], 200);
        }

        return response()->json([
            'message' => 'La cadena local es la ganadora',
            'length' => $maxLen
        ], 200);
    }

    /**
     * Valida la integridad de la cadena local
     */
    #[OA\Get(
        path: '/blockchain/validate',
        summary: 'Valida la integridad de la cadena local',
        responses: [
            new OA\Response(response: 200, description: 'OK')
        ]
    )]
    public function validateChain()
    {
        $grados = Grado::orderBy('creado_en', 'asc')->get();
        $reporte = [];
        $esValida = true;

        for ($i = 0; $i < count($grados); $i++) {
            $bloqueActual = $grados[$i];
            
            $hashRecalculado = $this->blockchain->calculateHash($bloqueActual);
            if ($bloqueActual->hash_actual !== $hashRecalculado) {
                $esValida = false;
                $reporte[] = "Error: Hash inválido en el bloque ID {$bloqueActual->id}. Los datos fueron alterados.";
            }

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

    /**
     * Registra un nuevo nodo vecino
     */
    #[OA\Post(
        path: '/nodes/register',
        summary: 'Registra un nuevo nodo vecino',
        responses: [
            new OA\Response(response: 200, description: 'OK')
        ]
    )]
    public function registerNode(Request $request)
    {
        $request->validate([
            'url' => 'nullable|url',
            'nodes' => 'nullable|array',
            'nodes.*' => 'url',
        ]);

        if ($request->has('nodes')) {
            foreach ($request->nodes as $node_url) {
                PeerNode::firstOrCreate(['url' => $node_url]);
            }
        } elseif ($request->has('url')) {
            PeerNode::firstOrCreate(['url' => $request->url]);
        } else {
            return response()->json(['message' => 'Falta campo url o nodes'], 400);
        }

        return response()->json(['message' => 'Nodo registrado exitosamente'], 201);
    }

    /**
     * Lista los nodos vecinos registrados
     */
    #[OA\Get(
        path: '/nodes',
        summary: 'Lista los nodos vecinos registrados',
        responses: [
            new OA\Response(response: 200, description: 'OK')
        ]
    )]
    public function getNodes()
    {
        return response()->json(PeerNode::all());
    }
}