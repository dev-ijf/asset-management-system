<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $settingId = $this->route('setting')?->id;

        return [
            'key' => [
                'required',
                'string',
                'max:255',
                Rule::unique('settings', 'key')->ignore($settingId),
            ],
            'group' => ['nullable', 'string', 'max:100'],
            'type' => ['required', 'string', Rule::in(['string', 'integer', 'boolean', 'float', 'array'])],
            'value' => ['nullable'],
            'description' => ['nullable', 'string', 'max:255'],
            'is_public' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * Konversi value sesuai tipe agar konsisten saat disimpan.
     */
    public function castedValue(): mixed
    {
        $type = $this->input('type');
        $value = $this->input('value');

        return match ($type) {
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOL),
            'integer' => (int) $value,
            'float' => (float) $value,
            'array' => $this->toArrayValue($value),
            default => (string) $value,
        };
    }

    private function toArrayValue($value): array
    {
        if (is_array($value)) {
            return $value;
        }

        // Izinkan input JSON untuk array.
        $decoded = json_decode($value ?? '', true);

        return is_array($decoded) ? $decoded : [];
    }
}
