<?php

namespace App\Http\Requests\Acces;

use Illuminate\Foundation\Http\FormRequest;

class StoreRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:50', 'regex:/^[A-Z][A-Z0-9_]*$/'],
            'nom' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'niveau_confidentialite' => ['nullable', 'integer', 'min:1'],
            'actif' => ['nullable', 'boolean'],
        ];
    }
}