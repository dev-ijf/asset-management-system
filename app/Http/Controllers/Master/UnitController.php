<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\Unit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class UnitController extends Controller
{
    public function index(): View
    {
        return view('masters.simple', [
            'title' => 'Satuan Unit',
            'routeName' => 'units',
            'items' => Unit::orderBy('name')->get(),
            'fields' => [
                ['name' => 'name', 'label' => 'Nama', 'required' => true],
                ['name' => 'symbol', 'label' => 'Simbol', 'required' => true],
                ['name' => 'description', 'label' => 'Deskripsi', 'type' => 'textarea'],
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'symbol' => ['required', 'string', 'max:20', 'unique:units,symbol'],
            'description' => ['nullable', 'string'],
        ]);

        Unit::create($data);

        return back()->with('success', 'Satuan berhasil ditambahkan.');
    }

    public function update(Request $request, Unit $unit): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'symbol' => ['required', 'string', 'max:20', 'unique:units,symbol,'.$unit->id],
            'description' => ['nullable', 'string'],
        ]);

        $unit->update($data);

        return back()->with('success', 'Satuan berhasil diperbarui.');
    }

    public function destroy(Unit $unit): RedirectResponse
    {
        $unit->delete();

        return back()->with('success', 'Satuan berhasil dihapus.');
    }
}
