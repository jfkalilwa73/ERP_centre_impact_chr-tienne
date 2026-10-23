<?php

namespace App\Http\Requests\Famille;

use Illuminate\Foundation\Http\FormRequest;

class StoreFamilleImpactRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    protected function prepareForValidation(): void
    {
        $this->merge($this->champsSuivi());
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:20'],
            'nom' => ['required', 'string', 'max:100'],
            'zone' => ['nullable', 'string', 'max:100'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90', 'required_with:longitude'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180', 'required_with:latitude'],
            'description' => ['nullable', 'string'],
            'actif' => ['sometimes', 'boolean'],
            ...$this->reglesSuivi(),
        ];
    }

    protected function champsSuivi(): array
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

        return $values;
    }

    protected function reglesSuivi(): array
    {
        return [
            'responsable_id' => ['nullable', 'uuid', 'exists:personne,id_personne'],
            'adjoint_id' => ['nullable', 'uuid', 'exists:personne,id_personne', 'different:responsable_id'],
            'capacite_max' => ['nullable', 'integer', 'min:1'],
            'jour_reunion' => ['nullable', 'string', 'max:20'],
            'heure_reunion' => ['nullable', 'date_format:H:i'],
            'lieu_reunion' => ['nullable', 'string'],
        ];
    }
}
