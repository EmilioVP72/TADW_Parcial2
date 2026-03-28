<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PendingTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'persona_id',
        'institucion_id',
        'programa_id',
        'fecha_inicio',
        'fecha_fin',
        'titulo_obtenido',
        'numero_cedula',
        'firmado_por',
        'titulo_tesis',
        'menciones'
    ];
}
