<?php

namespace App\Http\Requests\Acces;

use Illuminate\Foundation\Http\FormRequest;

class StoreAffectationRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'id_role' => $this->input('idRole', $this->input('id_role')),
            'date_debut' => $this->input('dateDebut', $this->input('date_debut')),
            'date_fin' => $this->input('dateFin', $this->input('date_fin')),
        ]);
    }

    public function rules(): array
    {
        return [
            'id_role' => ['required', 'uuid'],
            'date_debut' => ['nullable', 'date'],
            'date_fin' => ['nullable', 'date', 'after_or_equal:date_debut'],
        ];
    }
}