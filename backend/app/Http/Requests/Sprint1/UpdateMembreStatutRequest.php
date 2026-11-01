<?php

namespace App\Http\Requests\Sprint1;

use App\Services\Sprint1\MembreService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMembreStatutRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    protected function prepareForValidation(): void
    {
        if ($this->exists('statutMembre')) {
            $this->merge(['statut_membre' => $this->input('statutMembre')]);
        }
    }

    public function rules(): array
    {
        return [
            'statut_membre' => ['required', 'string', Rule::in(MembreService::STATUTS)],
            'motif' => ['nullable', 'string'],
        ];
    }
}
