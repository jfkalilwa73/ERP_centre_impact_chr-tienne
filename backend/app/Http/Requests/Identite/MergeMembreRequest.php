<?php

namespace App\Http\Requests\Identite;

use Illuminate\Foundation\Http\FormRequest;

class MergeMembreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->exists('idMembreSource')) {
            $this->merge(['id_membre_source' => $this->input('idMembreSource')]);
        }
    }

    public function rules(): array
    {
        return [
            'id_membre_source' => ['required', 'uuid'],
        ];
    }
}