<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CatalogoSeeder extends Seeder
{
    public function run(): void
    {
        $niveles = [
            ['id' => 1, 'nombre' => 'Técnico'],
            ['id' => 2, 'nombre' => 'Licenciatura'],
            ['id' => 3, 'nombre' => 'Maestría'],
            ['id' => 4, 'nombre' => 'Doctorado'],
            ['id' => 5, 'nombre' => 'Especialidad'],
        ];

        foreach ($niveles as $nivel) {
            DB::table('niveles_grado')->updateOrInsert(['id' => $nivel['id']], $nivel);
        }
    }
}