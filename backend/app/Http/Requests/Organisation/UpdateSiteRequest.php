<?php

namespace App\Http\Requests\Organisation;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSiteRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'code' => ['sometimes', 'required', 'string', 'max:20'],
            'nom' => ['sometimes', 'required', 'string', 'max:100'],
            'telephone' => ['sometimes', 'required', 'string', 'max:20'],
            'adresse' => ['sometimes', 'nullable', 'string'],
            'ville' => ['sometimes', 'nullable', 'string', 'max:100'],
            'pays' => ['sometimes', 'nullable', 'string', 'max:100'],
            'actif' => ['sometimes', 'boolean'],
        ];
    }
}
