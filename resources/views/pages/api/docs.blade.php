@extends('layouts.custom-master')

@section('content')
<div class="container py-5">
    <div class="row justify-content-center">
        <div class="col-lg-10">
            <div class="card custom-card shadow-sm">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <div class="badge bg-primary-transparent text-primary border rounded-pill mb-2">API Reference</div>
                            <h3 class="fw-semibold mb-0">Asset Management Public API</h3>
                            <p class="text-muted mb-0">Gunakan API ini untuk integrasi ERP/CMMS/Helpdesk.</p>
                        </div>
                        <a href="{{ url('/api/v1') }}" class="btn btn-outline-primary btn-sm">Base URL: {{ url('/api/v1') }}</a>
                    </div>

                    <div class="alert alert-info">
                        <ul class="mb-0 ps-3">
                            <li>Autentikasi: header <code>X-Api-Key</code> (set di Settings → Integration)</li>
                            <li>Format: JSON, timezone UTC, gunakan UUID untuk ID.</li>
                            <li>Rate limit & logging mengikuti kebijakan server Anda.</li>
                        </ul>
                    </div>

                    <h5 class="mt-4">REST Endpoints</h5>
                    <div class="table-responsive">
                        <table class="table table-bordered align-middle">
                            <thead class="table-light">
                                <tr>
                                    <th style="width: 140px;">Method</th>
                                    <th>Endpoint</th>
                                    <th>Deskripsi</th>
                                    <th>Contoh</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><span class="badge bg-primary">GET</span></td>
                                    <td><code>/api/v1/assets</code></td>
                                    <td>List aset (filter: <code>search</code>, <code>status</code>, <code>location_id</code>, <code>department_id</code>, <code>per_page</code>).</td>
                                    <td><code>curl -H "X-Api-Key: KEY" "{{ url('/api/v1/assets?search=AST') }}"</code></td>
                                </tr>
                                <tr>
                                    <td><span class="badge bg-primary">GET</span></td>
                                    <td><code>/api/v1/assets/{asset}</code></td>
                                    <td>Detail aset beserta relasi utama.</td>
                                    <td><code>curl -H "X-Api-Key: KEY" "{{ url('/api/v1/assets/{uuid}') }}"</code></td>
                                </tr>
                                <tr>
                                    <td><span class="badge bg-success">POST</span></td>
                                    <td><code>/api/v1/assets/{asset}/movements</code></td>
                                    <td>Buat movement aset.</td>
                                    <td><code>curl -X POST -H "X-Api-Key: KEY" -H "Content-Type: application/json" -d '{"to_location_id":"UUID","notes":"Pindah"}' "{{ url('/api/v1/assets/{uuid}/movements') }}"</code></td>
                                </tr>
                                <tr>
                                    <td><span class="badge bg-success">POST</span></td>
                                    <td><code>/api/v1/assets/{asset}/disposals</code></td>
                                    <td>Catat disposal aset.</td>
                                    <td><code>curl -X POST -H "X-Api-Key: KEY" -H "Content-Type: application/json" -d '{"reason":"Rusak","notes":"-" }' "{{ url('/api/v1/assets/{uuid}/disposals') }}"</code></td>
                                </tr>
                                <tr>
                                    <td><span class="badge bg-success">POST</span></td>
                                    <td><code>/api/v1/assets/{asset}/audits</code></td>
                                    <td>Catat audit aset.</td>
                                    <td><code>curl -X POST -H "X-Api-Key: KEY" -H "Content-Type: application/json" -d '{"status":"matched","notes":"OK"}' "{{ url('/api/v1/assets/{uuid}/audits') }}"</code></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <h5 class="mt-4">Webhook Events</h5>
                    <p class="text-muted mb-2">Aktifkan di Settings → Integration. Server Anda akan menerima payload berikut:</p>
                    <ul class="mb-3">
                        <li><code>asset.created</code>, <code>asset.updated</code></li>
                        <li><code>asset.movement</code>, <code>asset.disposal</code>, <code>asset.reverse_disposal</code></li>
                        <li><code>asset.audit</code>, <code>asset.maintenance</code></li>
                    </ul>
                    <div class="border rounded p-3 bg-light">
                        <code class="d-block">POST {{ url('/your/webhook') }}</code>
                        <code class="d-block">Headers: X-Webhook-Event, X-Webhook-Signature (HMAC SHA256)</code>
                        <pre class="mb-0"><code>{
"event": "asset.movement",
"data": {
  "asset_id": "uuid",
  "asset_code": "AST-00001",
  "asset_status_id": "uuid",
  "payload": { "...": "..." }
},
"sent_at": "2025-12-12T00:00:00Z"
}</code></pre>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
