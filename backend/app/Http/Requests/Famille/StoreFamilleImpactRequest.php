<?php

namespace App\Http\Requests\Famille;

use Illuminate\Foundation\Http\FormRequest;

class StoreFamilleImpactRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:20'],
            'nom' => ['required', 'string', 'max:100'],
            'zone' => ['nullable', 'string', 'max:100'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90', 'required_with:longitude'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180', 'required_with:latitude'],
            'description' => ['nullable', 'string'],
            'actif' => ['sometimes', 'boolean'],
        ];
    }
}
