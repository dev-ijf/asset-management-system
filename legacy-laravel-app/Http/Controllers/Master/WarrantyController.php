<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\Warranty;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class WarrantyController extends Controller
{
    public function index(): View
    {
        return view('masters.simple', [
            'title' => 'Masa Garansi',
            'routeName' => 'warranties',
            'items' => Warranty::orderBy('duration_months')->get(),
            'fields' => [
                ['name' => 'name', 'label' => 'Nama', 'required' => true],
                ['name' => 'duration_months', 'label' => 'Durasi (bulan)', 'type' => 'number', 'required' => true],
                ['name' => 'notes', 'label' => 'Catatan', 'type' => 'textarea'],
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'duration_months' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string'],
        ]);

        Warranty::create($data);

        return back()->with('success', 'Garansi berhasil ditambahkan.');
    }

    public function update(Request $request, Warranty $warranty): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'duration_months' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string'],
        ]);

        $warranty->update($data);

        return back()->with('success', 'Garansi berhasil diperbarui.');
    }

    public function destroy(Warranty $warranty): RedirectResponse
    {
        $warranty->delete();

        return back()->with('success', 'Garansi berhasil dihapus.');
    }
}
