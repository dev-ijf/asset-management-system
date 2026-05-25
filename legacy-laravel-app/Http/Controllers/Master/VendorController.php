<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\VendorContract;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class VendorController extends Controller
{
    public function index(): View
    {
        $contracts = VendorContract::orderBy('vendor_name')->get();

        return view('masters.vendors', [
            'title' => 'Vendor & Kontrak',
            'contracts' => $contracts,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'vendor_name' => ['required', 'string', 'max:255'],
            'contract_number' => ['nullable', 'string', 'max:255'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'sla_response_hours' => ['nullable', 'integer', 'min:0'],
            'sla_resolution_hours' => ['nullable', 'integer', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        VendorContract::create($data);

        return back()->with('success', 'Vendor/kontrak berhasil ditambahkan.');
    }

    public function update(Request $request, VendorContract $vendor_contract): RedirectResponse
    {
        $data = $request->validate([
            'vendor_name' => ['required', 'string', 'max:255'],
            'contract_number' => ['nullable', 'string', 'max:255'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'sla_response_hours' => ['nullable', 'integer', 'min:0'],
            'sla_resolution_hours' => ['nullable', 'integer', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $vendor_contract->update($data);

        return back()->with('success', 'Vendor/kontrak berhasil diperbarui.');
    }

    public function destroy(VendorContract $vendor_contract): RedirectResponse
    {
        $vendor_contract->delete();

        return back()->with('success', 'Vendor/kontrak berhasil dihapus.');
    }
}
