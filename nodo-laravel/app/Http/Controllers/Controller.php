<?php

namespace App\Http\Controllers;

use OpenApi\Attributes as OA;

#[OA\Info(
    version: "1.0.0",
    description: "API para interactuar con el Nodo Blockchain en Laravel.",
    title: "Blockchain API"
)]
#[OA\Server(
    url: "http://localhost:8010/api",
    description: "Local API Server"
)]
abstract class Controller
{
    //
}
