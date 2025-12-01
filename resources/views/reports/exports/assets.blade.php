<table width="100%" cellspacing="0" cellpadding="4" border="1">
    <thead>
        <tr>
            <th>Kode</th><th>Nama</th><th>Status</th><th>Kategori</th><th>Lokasi</th><th>Dept</th><th>User</th><th>PIC</th><th>Garansi</th><th>Dibuat</th>
        </tr>
    </thead>
    <tbody>
        @foreach($data as $asset)
            <tr>
                <td>{{ $asset->code }}</td>
                <td>{{ $asset->name }}</td>
                <td>{{ $asset->status?->name }}</td>
                <td>{{ $asset->category?->name }}</td>
                <td>{{ $asset->location?->name }}</td>
                <td>{{ $asset->department?->name }}</td>
                <td>{{ $asset->user?->name }}</td>
                <td>{{ $asset->personInCharge?->name }}</td>
                <td>{{ $asset->warranty?->name }}</td>
                <td>{{ optional($asset->created_at)->format('d/m/Y') }}</td>
            </tr>
        @endforeach
    </tbody>
</table>
