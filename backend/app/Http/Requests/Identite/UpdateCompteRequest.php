<?php

namespace App\Http\Requests\Identite;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCompteRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($this->route('compteId'))],
            'statut' => ['sometimes', 'required', Rule::in(['actif', 'suspendu', 'desactive'])],
            'mfaActive' => ['sometimes', 'boolean'],
        ];
    }
}
