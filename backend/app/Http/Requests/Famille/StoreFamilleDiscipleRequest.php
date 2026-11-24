<?php

namespace App\Http\Requests\Famille;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFamilleDiscipleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $valeurs = [];
        foreach ([
            'periodeDebut' => 'periode_debut',
            'periodeFin' => 'periode_fin',
            'responsableId' => 'responsable_id',
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
            'nom' => ['required', 'string', 'max:100'],
            'periode_debut' => ['required', 'date'],
            'periode_fin' => ['nullable', 'date', 'after_or_equal:periode_debut'],
            'responsable_id' => ['nullable', 'uuid'],
            'statut' => ['sometimes', 'string', Rule::in(['actif', 'termine', 'archive'])],
        ];
    }
}