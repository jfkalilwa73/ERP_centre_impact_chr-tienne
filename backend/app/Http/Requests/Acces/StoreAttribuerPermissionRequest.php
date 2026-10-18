<?php

namespace App\Http\Requests\Acces;

use Illuminate\Foundation\Http\FormRequest;

class StoreAttribuerPermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'id_permission' => $this->input('idPermission', $this->input('id_permission')),
        ]);
    }

    public function rules(): array
    {
        return [
            'id_permission' => ['required', 'uuid'],
        ];
    }
}