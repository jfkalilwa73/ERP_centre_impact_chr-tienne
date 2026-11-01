<?php

namespace App\Http\Requests\Acces;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->exists('niveauConfidentialite')) {
            $this->merge([
                'niveau_confidentialite' => $this->input('niveauConfidentialite'),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'code' => ['sometimes', 'required', 'string', 'max:50', 'regex:/^[A-Z][A-Z0-9_]*$/'],
            'nom' => ['sometimes', 'required', 'string', 'max:100'],
            'description' => ['sometimes', 'nullable', 'string'],
            'niveau_confidentialite' => ['sometimes', 'integer', 'min:1'],
            'actif' => ['sometimes', 'boolean'],
        ];
    }
}