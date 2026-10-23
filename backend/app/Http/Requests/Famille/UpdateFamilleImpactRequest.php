<?php

namespace App\Http\Requests\Famille;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFamilleImpactRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return [
            'code' => ['sometimes', 'required', 'string', 'max:20'],
            'nom' => ['sometimes', 'required', 'string', 'max:100'],
            'zone' => ['sometimes', 'nullable', 'string', 'max:100'],
            'latitude' => ['sometimes', 'nullable', 'numeric', 'between:-90,90', 'required_with:longitude'],
            'longitude' => ['sometimes', 'nullable', 'numeric', 'between:-180,180', 'required_with:latitude'],
            'description' => ['sometimes', 'nullable', 'string'],
            'actif' => ['sometimes', 'boolean'],
            'responsable_id' => ['sometimes', 'nullable', 'uuid', 'exists:personne,id_personne'],
            'adjoint_id' => ['sometimes', 'nullable', 'uuid', 'exists:personne,id_personne', 'different:responsable_id'],
            'capacite_max' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'jour_reunion' => ['sometimes', 'nullable', 'string', 'max:20'],
            'heure_reunion' => ['sometimes', 'nullable', 'date_format:H:i'],
            'lieu_reunion' => ['sometimes', 'nullable', 'string'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $values = [];
        foreach ([
            'responsableId' => 'responsable_id',
            'adjointId' => 'adjoint_id',
            'capaciteMax' => 'capacite_max',
            'jourReunion' => 'jour_reunion',
            'heureReunion' => 'heure_reunion',
            'lieuReunion' => 'lieu_reunion',
        ] as $alias => $field) {
            if (! $this->exists($alias)) {
                continue;
            }
            $value = $this->input($alias);
            $values[$field] = $value === '' ? null : $value;
        }
        $this->merge($values);
    }
}
