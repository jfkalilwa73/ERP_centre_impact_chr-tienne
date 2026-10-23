<?php

namespace App\Http\Requests\Famille;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFamilleImpactRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return [
            'code' => ['sometimes', 'required', 'string', 'max:20'],
            'nom' => ['sometimes', 'required', 'string', 'max:100'],
            'zone' => ['sometimes', 'nullable', 'string', 'max:100'],
            'latitude' => ['sometimes', 'nullable', 'numeric', 'between:-90,90', 'required_with:longitude'],
            'longitude' => ['sometimes', 'nullable', 'numeric', 'between:-180,180', 'required_with:latitude'],
            'description' => ['sometimes', 'nullable', 'string'],
            'actif' => ['sometimes', 'boolean'],
        ];
    }
}
