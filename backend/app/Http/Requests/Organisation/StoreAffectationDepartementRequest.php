<?php

namespace App\Http\Requests\Organisation;

use Illuminate\Foundation\Http\FormRequest;

class StoreAffectationDepartementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }
    protected function prepareForValidation(): void
    {
        $this->merge([
            'id_departement' => $this->input('idDepartement', $this->input('id_departement')),
            'date_debut' => $this->input('dateDebut', $this->input('date_debut')),
            'date_fin' => $this->input('dateFin', $this->input('date_fin')),
        ]);
    }

    public function rules(): array
    {
        return [
            'id_departement' => ['required', 'uuid'],
            'fonction' => ['nullable', 'string', 'max:100'],
            'date_debut' => ['nullable', 'date'],
            'date_fin' => ['nullable', 'date', 'after_or_equal:date_debut'],
        ];
    }
}