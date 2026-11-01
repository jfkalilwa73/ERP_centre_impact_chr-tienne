<?php

namespace App\Http\Requests\Sprint1;

use App\Services\Sprint1\MembreService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMembreRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    protected function prepareForValidation(): void
    {
        $values = [];
        foreach ([
            'dateIntegration' => 'date_integration',
            'statutMembre' => 'statut_membre',
            'familleImpactId' => 'famille_impact_id',
        ] as $alias => $field) {
            if ($this->exists($alias)) {
                $values[$field] = $this->input($alias);
            }
        }
        $this->merge($values);
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
