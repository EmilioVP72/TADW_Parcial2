<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Persona extends Model
{
    use HasFactory;
    protected $table = 'personas';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['nombre', 'apellido_paterno', 'apellido_materno', 'curp', 'correo'];
}