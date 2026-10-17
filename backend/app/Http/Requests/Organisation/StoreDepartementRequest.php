<?php

namespace App\Http\Requests\Organisation;

use Illuminate\Foundation\Http\FormRequest;

class StoreDepartementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }
    protected function prepareForValidation(): void
    {
        $this->merge([
            'id_site' => $this->input('idSite', $this->input('id_site')),
        ]);
    }
    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:20'],
            'nom' => ['required', 'string', 'max:100'],
            'id_site' => ['required', 'uuid'],
            'mission' => ['nullable', 'string'],
            'actif' => ['nullable', 'boolean'],
        ];
    }
}