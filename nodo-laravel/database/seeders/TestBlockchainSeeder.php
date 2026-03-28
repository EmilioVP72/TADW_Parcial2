<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Persona;
use App\Models\Institucion;
use App\Models\Programa;

class TestBlockchainSeeder extends Seeder
{
    public function run()
    {
        $persona = Persona::updateOrCreate(
            ['curp' => 'CURP12345678901234'],
            [
                'nombre' => 'Emilio',
                'apellido_paterno' => 'Vazquez',
                'correo' => 'test@example.com'
            ]
        );

        $inst = Institucion::updateOrCreate(
            ['nombre' => 'Universidad Celaya'],
            [
                'pais' => 'México',
                'estado' => 'Guanajuato'
            ]
        );

        $prog = Programa::updateOrCreate(
            ['nombre' => 'Ingeniería en Sistemas'],
            ['nivel_grado_id' => 2]
        );

        $this->command->info("--- DATOS LISTOS PARA MINAR ---");
        $this->command->info("Persona ID: {$persona->id}");
        $this->command->info("Institucion ID: {$inst->id}");
        $this->command->info("Programa ID: {$prog->id}");
    }
}