<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\PersonInCharge;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class PersonInChargeController extends Controller
{
    public function index(): View
    {
        return view('masters.simple', [
            'title' => 'Penanggung Jawab',
            'routeName' => 'people-in-charge',
            'items' => PersonInCharge::orderBy('name')->get(),
            'fields' => [
                ['name' => 'name', 'label' => 'Nama', 'required' => true],
                ['name' => 'email', 'label' => 'Email'],
                ['name' => 'phone', 'label' => 'Telepon'],
                ['name' => 'notes', 'label' => 'Catatan', 'type' => 'textarea'],
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'notes' => ['nullable', 'string'],
        ]);

        PersonInCharge::create($data);

        return back()->with('success', 'Penanggung jawab berhasil ditambahkan.');
    }

    public function update(Request $request, PersonInCharge $people_in_charge): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'notes' => ['nullable', 'string'],
        ]);

        $people_in_charge->update($data);

        return back()->with('success', 'Penanggung jawab berhasil diperbarui.');
    }

    public function destroy(PersonInCharge $people_in_charge): RedirectResponse
    {
        $people_in_charge->delete();

        return back()->with('success', 'Penanggung jawab berhasil dihapus.');
    }
}
