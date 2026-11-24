<?php

namespace App\Http\Requests\Famille;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCompositionFamilleDiscipleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'actif' => ['sometimes', 'boolean'],
            'nouveauVenu' => ['sometimes', 'boolean'],
        ];
    }
}