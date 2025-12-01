<table width="100%" cellspacing="0" cellpadding="4" border="1">
    <thead>
        <tr>
            <th>Waktu</th><th>Aset</th><th>Alasan</th><th>Catatan</th><th>Status</th>
        </tr>
    </thead>
    <tbody>
        @foreach($data as $d)
            <tr>
                <td>{{ optional($d->disposed_at)->format('d/m/Y H:i') }}</td>
                <td>{{ $d->asset?->code }}</td>
                <td>{{ $d->reason }}</td>
                <td>{{ $d->notes }}</td>
                <td>{{ $d->reversed_at ? 'Reversed' : 'Active' }}</td>
            </tr>
        @endforeach
    </tbody>
</table>
