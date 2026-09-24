<?php

namespace App\Http\Resources\Acces;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DroitResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'user_id' => $this['user_id'],
            'permission_code' => $this['permission_code'],
            'autorise' => $this['autorise'],
            'roles_source' => $this['roles_source'],
        ];
    }
}