<?php

namespace App\Http\Requests\Famille;

use Illuminate\Foundation\Http\FormRequest;

class StoreCompositionFamilleDiscipleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $valeurs = [];
        foreach ([
            'idPersonne' => 'id_personne',
            'dateAccueil' => 'date_accueil',
            'departementOrigineId' => 'departement_origine_id',
        ] as $alias => $champ) {
            if ($this->exists($alias)) {
                $valeurs[$champ] = $this->input($alias);
            }
        }
        $this->merge($valeurs);
    }

    public function rules(): array
    {
        return [
            'id_personne' => ['required', 'uuid'],
            'date_accueil' => ['nullable', 'date'],
            'departement_origine_id' => ['nullable', 'uuid'],
            'nouveauVenu' => ['sometimes', 'boolean'],
        ];
    }
}