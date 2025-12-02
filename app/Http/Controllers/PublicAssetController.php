<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use Illuminate\View\View;

class PublicAssetController extends Controller
{
    public function show(Asset $asset): View
    {
        $asset->load([
            'status','class','category','location','department','user','personInCharge','warranty',
            'photos',
        ]);

        return view('pages.landing.asset-show', [
            'asset' => $asset,
        ]);
    }
}
