<?php

namespace App\Http\Requests\Famille;

use Illuminate\Foundation\Http\FormRequest;

class StoreRegroupementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $valeurs = [];
        foreach ([
            'nomFamille' => 'nom_famille',
            'telephonePrincipal' => 'telephone_principal',
            'responsableLegalId' => 'responsable_legal_id',
        ] as $alias => $champ) {
            if ($this->exists($alias)) {
                $valeur = $this->input($alias);
                $valeurs[$champ] = $valeur === '' ? null : $valeur;
            }
        }
        $this->merge($valeurs);
    }

    public function rules(): array
    {
        return [
            'nom_famille' => ['required', 'string', 'max:150'],
            'adresse' => ['nullable', 'string'],
            'telephone_principal' => ['nullable', 'string', 'max:20'],
            'responsable_legal_id' => ['nullable', 'uuid', 'exists:personne,id_personne'],
        ];
    }
}