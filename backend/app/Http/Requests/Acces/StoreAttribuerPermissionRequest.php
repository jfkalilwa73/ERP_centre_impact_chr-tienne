<?php

namespace App\Http\Requests\Acces;

use Illuminate\Foundation\Http\FormRequest;

class StoreAttribuerPermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_permission' => ['required', 'uuid'],
        ];
    }
}