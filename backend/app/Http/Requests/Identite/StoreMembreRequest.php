<?php

namespace App\Http\Requests\Identite;

use App\Services\Identite\MembreService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMembreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $valeurs = [];
        foreach ([
            'dateIntegration' => 'date_integration',
            'statutMembre' => 'statut_membre',
            'familleImpactId' => 'famille_impact_id',
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
            'date_integration' => ['required', 'date'],
            'statut_membre' => ['sometimes', 'string', Rule::in(MembreService::STATUTS)],
            'famille_impact_id' => ['nullable', 'uuid', 'exists:famille_impact,id_famille'],
        ];
    }
}