<?php

namespace App\Http\Resources\Acces;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DroitResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'compteId' => (string) $this['user_id'],
            'permissionCode' => $this['permission_code'],
            'autorise' => $this['autorise'],
            'rolesSource' => $this['roles_source'],
        ];
    }
}