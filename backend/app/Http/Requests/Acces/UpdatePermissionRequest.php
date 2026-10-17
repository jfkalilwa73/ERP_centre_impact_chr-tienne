<?php

namespace App\Http\Requests\Acces;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => ['sometimes', 'required', 'string', 'max:100', 'regex:/^[a-z][a-z0-9_-]*\.[a-z][a-z0-9_-]*$/'],
            'module' => ['sometimes', 'required', 'string', 'max:50'],
            'action' => ['sometimes', 'required', 'string', 'max:50'],
            'description' => ['sometimes', 'nullable', 'string'],
            'actif' => ['sometimes', 'boolean'],
        ];
    }
}