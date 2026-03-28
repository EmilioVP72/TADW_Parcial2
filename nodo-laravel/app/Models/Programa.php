<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Programa extends Model
{
    protected $table = 'programas';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['nombre', 'nivel_grado_id'];
}