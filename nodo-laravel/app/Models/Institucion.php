<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Institucion extends Model
{
    protected $table = 'instituciones';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['nombre', 'pais', 'estado'];
}
