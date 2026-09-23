<?php

namespace App\Http\Resources\Acces;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttribuerPermissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id_role' => $this->id_role,
            'id_permission' => $this->id_permission,
        ];
    }
}