<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;

class NamedArraySheet implements FromCollection, WithHeadings, WithTitle
{
    public function __construct(
        private readonly string $title,
        private readonly array $headings,
        private readonly array $rows
    ) {
    }

    public function headings(): array
    {
        return $this->headings;
    }

    public function collection(): Collection
    {
        return collect($this->rows);
    }

    public function title(): string
    {
        return $this->title;
    }
}
