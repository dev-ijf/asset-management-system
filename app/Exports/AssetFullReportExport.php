<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class AssetFullReportExport implements WithMultipleSheets
{
    public function __construct(
        private readonly array $assets,
        private readonly array $movements,
        private readonly array $disposals,
        private readonly array $audits,
    ) {
    }

    public function sheets(): array
    {
        return [
            'Assets' => new ArrayReportExport([
                'Kode','Nama','Status','Kategori','Lokasi','Dept','User','PIC','Garansi','Dibuat'
            ], $this->assets),
            'Movements' => new ArrayReportExport([
                'Waktu','Aset','Dari Lokasi','Ke Lokasi','Dari Dept','Ke Dept','Dari User','Ke User','Catatan'
            ], $this->movements),
            'Disposals' => new ArrayReportExport([
                'Waktu','Aset','Alasan','Catatan','Status'
            ], $this->disposals),
            'Audits' => new ArrayReportExport([
                'Waktu','Aset','Status','Lokasi','Catatan'
            ], $this->audits),
        ];
    }
}
