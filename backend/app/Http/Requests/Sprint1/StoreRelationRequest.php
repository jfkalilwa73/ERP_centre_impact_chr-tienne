<?php

namespace App\Http\Requests\Sprint1;

use App\Services\Sprint1\RegroupementService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRelationRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    protected function prepareForValidation(): void
    {
        $values = [];
        foreach ([
            'idPersonne1' => 'id_personne_1',
            'idPersonne2' => 'id_personne_2',
            'typeRelation' => 'type_relation',
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
            'id_personne_1' => ['required', 'uuid', 'exists:personne,id_personne'],
            'id_personne_2' => ['required', 'uuid', 'exists:personne,id_personne', 'different:id_personne_1'],
            'type_relation' => ['required', 'string', Rule::in(RegroupementService::TYPES)],
        ];
    }
}
