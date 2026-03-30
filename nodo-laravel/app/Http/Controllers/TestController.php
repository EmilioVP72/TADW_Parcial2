<?php
namespace App\Http\Controllers;

use OpenApi\Attributes as OA;

class TestController {
    #[OA\Get(
        path: '/test',
        summary: 'Test endpoint',
        responses: [
            new OA\Response(response: 200, description: 'Success')
        ]
    )]
    public function test() {}
}
