<table width="100%" cellspacing="0" cellpadding="4" border="1">
    <thead>
        <tr>
            <th>Waktu</th><th>Aset</th><th>Dari Lokasi</th><th>Ke Lokasi</th><th>Dari Dept</th><th>Ke Dept</th><th>Dari User</th><th>Ke User</th><th>Catatan</th>
        </tr>
    </thead>
    <tbody>
        @foreach($data as $m)
            <tr>
                <td>{{ optional($m->performed_at)->format('d/m/Y H:i') }}</td>
                <td>{{ $m->asset?->code }}</td>
                <td>{{ $m->fromLocation?->name }}</td>
                <td>{{ $m->toLocation?->name }}</td>
                <td>{{ $m->fromDepartment?->name }}</td>
                <td>{{ $m->toDepartment?->name }}</td>
                <td>{{ $m->fromUser?->name }}</td>
                <td>{{ $m->toUser?->name }}</td>
                <td>{{ $m->notes }}</td>
            </tr>
        @endforeach
    </tbody>
</table>
