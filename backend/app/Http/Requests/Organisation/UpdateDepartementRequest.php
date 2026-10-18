<?php

namespace App\Http\Requests\Organisation;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDepartementRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    protected function prepareForValidation(): void
    {
        if ($this->exists('idSite')) {
            $this->merge(['id_site' => $this->input('idSite')]);
        }
    }

    public function rules(): array
    {
        return [
            'code' => ['sometimes', 'required', 'string', 'max:20'],
            'nom' => ['sometimes', 'required', 'string', 'max:100'],
            'id_site' => ['sometimes', 'required', 'uuid'],
            'mission' => ['sometimes', 'nullable', 'string'],
            'actif' => ['sometimes', 'boolean'],
        ];
    }
}
