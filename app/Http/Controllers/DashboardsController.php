<?php

namespace App\Http\Controllers;

use App\Services\Dashboard\DashboardService;
use Illuminate\View\View;

class DashboardsController extends Controller
{
    public function __construct(private readonly DashboardService $dashboard)
    {
    }

    public function index(): View
    {
        $user = auth()->user();
        $data = $this->dashboard->build($user);

        // Backward compatible variable names (dipakai view lama).
        $data['movementCount'] = $data['movementCount30'] ?? 0;
        $data['disposalCount'] = $data['activeDisposals'] ?? 0;

        return view('pages.dashboards.index', $data);
    }
}
