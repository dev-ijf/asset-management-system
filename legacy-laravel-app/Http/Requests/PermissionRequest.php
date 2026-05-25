<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $permissionId = $this->route('permission')?->getKey();

        return [
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('permissions', 'name')->ignore($permissionId, 'uuid'),
            ],
        ];
    }
}
