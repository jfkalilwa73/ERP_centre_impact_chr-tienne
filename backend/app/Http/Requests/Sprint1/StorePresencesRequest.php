<?php

namespace App\Http\Requests\Sprint1;

use Illuminate\Foundation\Http\FormRequest;

class StorePresencesRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    protected function prepareForValidation(): void
    {
        if ($this->exists('dateReunion')) {
            $this->merge(['date_reunion' => $this->input('dateReunion')]);
        }

        $lignes = collect($this->input('lignes', []))->map(function ($ligne) {
            if (! is_array($ligne)) {
                return $ligne;
            }

            return [
                'id_affectation' => $ligne['idAffectation'] ?? $ligne['id_affectation'] ?? null,
                'present' => $ligne['present'] ?? false,
                'commentaire' => ($ligne['commentaire'] ?? null) === '' ? null : ($ligne['commentaire'] ?? null),
            ];
        })->all();

        $this->merge(['lignes' => $lignes]);
    }

    public function rules(): array
    {
        return [
            'date_reunion' => ['required', 'date'],
            'lignes' => ['required', 'array', 'min:1'],
            'lignes.*.id_affectation' => ['required', 'uuid'],
            'lignes.*.present' => ['required', 'boolean'],
            'lignes.*.commentaire' => ['nullable', 'string'],
        ];
    }
}
