<?php

namespace App\Http\Resources\Acces;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PermissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'idPermission' => $this->id_permission,
            'code' => $this->code,
            'module' => $this->module,
            'action' => $this->action,
            'description' => $this->description,
            'actif' => (bool) $this->actif,
        ];
    }
}