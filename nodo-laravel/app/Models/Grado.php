<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Grado extends Model
{
    protected $table = 'grados';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'persona_id',
        'institucion_id',
        'programa_id',
        'fecha_inicio',
        'fecha_fin',
        'titulo_obtenido',
        'numero_cedula',
        'titulo_tesis',
        'menciones',
        'hash_actual',
        'hash_anterior',
        'nonce',
        'firmado_por'
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function persona()
    {
        return $this->belongsTo(Persona::class);
    }
    public function institucion()
    {
        return $this->belongsTo(Institucion::class);
    }
    public function programa()
    {
        return $this->belongsTo(Programa::class);
    }
}