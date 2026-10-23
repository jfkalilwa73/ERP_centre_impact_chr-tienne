<?php

namespace App\Http\Requests\Sprint1;

use Illuminate\Foundation\Http\FormRequest;

class StoreRegroupementRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    protected function prepareForValidation(): void
    {
        $values = [];
        foreach ([
            'nomFamille' => 'nom_famille',
            'telephonePrincipal' => 'telephone_principal',
            'responsableLegalId' => 'responsable_legal_id',
        ] as $alias => $field) {
            if ($this->exists($alias)) {
                $value = $this->input($alias);
                $values[$field] = $value === '' ? null : $value;
            }
        }
        $this->merge($values);
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
