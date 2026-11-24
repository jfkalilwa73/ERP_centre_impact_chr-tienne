<?php

namespace App\Http\Requests\Identite;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMembreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->exists('dateIntegration')) {
            $this->merge(['date_integration' => $this->input('dateIntegration')]);
        }
    }

    public function rules(): array
    {
        return [
            'date_integration' => ['required', 'date'],
        ];
    }
}