<?php

namespace App\Http\Requests\Identite;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePersonneRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'date_naissance' => $this->input('dateNaissance', $this->input('date_naissance')),
            'photo_url' => $this->input('photoUrl', $this->input('photo_url')),
        ]);
    }

    public function rules(): array
    {
        return [
            'nom' => ['required', 'string', 'max:100'],
            'prenom' => ['required', 'string', 'max:100'],
            'date_naissance' => ['nullable', 'date'],
            'sexe' => ['nullable', Rule::in(['M', 'F'])],
            'telephone' => ['nullable', 'string', 'max:20'],
            'adresse' => ['nullable', 'string'],
            'photo_url' => ['nullable', 'string', 'max:500'],
            'statut' => ['nullable', Rule::in(['actif', 'inactif', 'archive'])],
        ];
    }
}