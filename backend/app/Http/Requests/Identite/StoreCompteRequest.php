<?php

namespace App\Http\Requests\Identite;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCompteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'id_personne' => $this->input('idPersonne', $this->input('id_personne')),
            'password' => $this->input('motDePasse', $this->input('password')),
        ]);
    }

    public function rules(): array
    {
        return [
            'id_personne' => ['required', 'uuid'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8'],
            'statut' => ['nullable', Rule::in(['actif', 'suspendu', 'desactive'])],
        ];
    }
}