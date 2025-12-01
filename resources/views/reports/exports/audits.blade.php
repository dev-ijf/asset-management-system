<table width="100%" cellspacing="0" cellpadding="4" border="1">
    <thead>
        <tr>
            <th>Waktu</th><th>Aset</th><th>Status</th><th>Lokasi</th><th>Catatan</th>
        </tr>
    </thead>
    <tbody>
        @foreach($data as $a)
            <tr>
                <td>{{ optional($a->audited_at)->format('d/m/Y H:i') }}</td>
                <td>{{ $a->asset?->code }}</td>
                <td>{{ ucfirst($a->status) }}</td>
                <td>{{ $a->location?->name }}</td>
                <td>{{ $a->notes }}</td>
            </tr>
        @endforeach
    </tbody>
</table>
