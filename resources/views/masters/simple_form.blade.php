<div class="row g-3">
@foreach($fields as $field)
    @php
        $value = $values[$field['name']] ?? '';
        $required = $field['required'] ?? false;
        $type = $field['type'] ?? 'text';
    @endphp
    <div class="{{ $field['col'] ?? 'col-md-6' }}">
        <label class="form-label">{{ $field['label'] }} @if($required)<span class="text-danger">*</span>@endif</label>
        @if($type === 'textarea')
            <textarea name="{{ $field['name'] }}" class="form-control" rows="3" {{ $required ? 'required' : '' }}>{{ $value }}</textarea>
        @elseif($type === 'select')
            <select name="{{ $field['name'] }}" class="form-select" {{ $required ? 'required' : '' }}>
                <option value="">-- Pilih --</option>
                @foreach($field['options'] ?? [] as $optionValue => $optionLabel)
                    <option value="{{ $optionValue }}" @selected($value == $optionValue)>{{ $optionLabel }}</option>
                @endforeach
            </select>
        @elseif($type === 'number')
            <input type="number" name="{{ $field['name'] }}" value="{{ $value }}" class="form-control" {{ $required ? 'required' : '' }}>
        @else
            <input type="text" name="{{ $field['name'] }}" value="{{ $value }}" class="form-control" {{ $required ? 'required' : '' }}>
        @endif
    </div>
@endforeach
</div>
