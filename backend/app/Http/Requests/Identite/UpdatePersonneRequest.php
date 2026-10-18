<?php

namespace App\Http\Requests\Identite;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePersonneRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $aliases = [];

        foreach ([
            'dateNaissance' => 'date_naissance',
            'photoUrl' => 'photo_url',
        ] as $alias => $field) {
            if ($this->exists($alias) || $this->exists($field)) {
                $aliases[$field] = $this->input($alias, $this->input($field));
            }
        }

        $this->merge($aliases);
    }

    public function rules(): array
    {
        return [
            'nom' => ['sometimes', 'required', 'string', 'max:100'],
            'prenom' => ['sometimes', 'required', 'string', 'max:100'],
            'date_naissance' => ['sometimes', 'nullable', 'date'],
            'sexe' => ['sometimes', 'nullable', Rule::in(['M', 'F'])],
            'telephone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'adresse' => ['sometimes', 'nullable', 'string'],
            'photo_url' => ['sometimes', 'nullable', 'string', 'max:500'],
            'statut' => ['sometimes', 'nullable', Rule::in(['actif', 'inactif', 'archive'])],
        ];
    }
}
