<?php

namespace App\Http\Requests\Identite;

use Illuminate\Foundation\Http\FormRequest;

class StoreAffectationFamilleRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    protected function prepareForValidation(): void
    {
        $values = [];
        foreach (['idFamille' => 'id_famille', 'dateDebut' => 'date_debut', 'dateFin' => 'date_fin'] as $alias => $field) {
            if ($this->exists($alias)) $values[$field] = $this->input($alias);
        }
        $this->merge($values);
    }

    public function rules(): array
    {
        return [
            'id_famille' => ['required', 'uuid'],
            'fonction' => ['nullable', 'string', 'max:100'],
            'date_debut' => ['nullable', 'date'],
            'date_fin' => ['nullable', 'date', 'after_or_equal:date_debut'],
        ];
    }
}
