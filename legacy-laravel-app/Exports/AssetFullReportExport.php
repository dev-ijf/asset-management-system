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
            new NamedArraySheet('Assets', [
                'Kode','Nama','Status','Kategori','Lokasi','Dept','User','PIC','Garansi','Dibuat'
            ], $this->assets),
            new NamedArraySheet('Movements', [
                'Waktu','Kode Aset','Nama Aset','Dari Lokasi','Ke Lokasi','Dari Dept','Ke Dept','Dari User','Ke User','Catatan'
            ], $this->movements),
            new NamedArraySheet('Disposals', [
                'Waktu','Kode Aset','Nama Aset','Alasan','Catatan','Status'
            ], $this->disposals),
            new NamedArraySheet('Audits', [
                'Waktu','Kode Aset','Nama Aset','Status Audit','Lokasi','Catatan'
            ], $this->audits),
        ];
    }
}
