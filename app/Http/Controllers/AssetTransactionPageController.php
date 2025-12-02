<?php

namespace App\Http\Controllers;

use App\Models\AssetAudit;
use App\Models\AssetDisposal;
use App\Models\AssetMovement;
use Illuminate\View\View;

class AssetTransactionPageController extends Controller
{
    public function movements(): View
    {
        $status = request('status');
        $items = AssetMovement::with(['asset', 'fromLocation', 'toLocation', 'fromDepartment', 'toDepartment', 'fromUser', 'toUser'])
            ->when($status, fn($q) => $q->where('status', $status))
            ->latest()
            ->paginate(config('system.ui.table_page_size', 20))
            ->withQueryString();

        return view('assets.movements', compact('items', 'status'));
    }

    public function disposals(): View
    {
        $status = request('status');
        $items = AssetDisposal::with(['asset', 'previousStatus', 'previousLocation', 'previousDepartment'])
            ->when($status, fn($q) => $q->where('status', $status))
            ->latest()
            ->paginate(config('system.ui.table_page_size', 20))
            ->withQueryString();

        return view('assets.disposals', compact('items', 'status'));
    }

    public function audits(): View
    {
        $items = AssetAudit::with(['asset', 'location'])
            ->latest()
            ->paginate(config('system.ui.table_page_size', 20));

        return view('assets.audits', compact('items'));
    }
}
