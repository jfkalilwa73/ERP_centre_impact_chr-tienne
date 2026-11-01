<?php

namespace App\Http\Requests\Pilotage;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePilotageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'activites' => ['sometimes', 'array'],
            'activitesFamille' => ['sometimes', 'array'],
            'budget' => ['sometimes', 'array'],
            'objectifs' => ['sometimes', 'array'],
            'plans' => ['sometimes', 'array'],
            'rapports' => ['sometimes', 'array'],
            'projets' => ['sometimes', 'array'],
            'risques' => ['sometimes', 'array'],
            'decisions' => ['sometimes', 'array'],
            'equipe' => ['sometimes', 'array'],
            'circulations' => ['sometimes', 'array'],
            'demandes' => ['sometimes', 'array'],
        ];
    }
}
