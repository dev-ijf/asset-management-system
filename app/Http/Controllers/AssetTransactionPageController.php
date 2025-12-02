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
        $items = AssetMovement::with(['asset', 'fromLocation', 'toLocation', 'fromDepartment', 'toDepartment', 'fromUser', 'toUser'])
            ->latest()
            ->paginate(config('system.ui.table_page_size', 20));

        return view('assets.movements', compact('items'));
    }

    public function disposals(): View
    {
        $items = AssetDisposal::with(['asset', 'previousStatus', 'previousLocation', 'previousDepartment'])
            ->latest()
            ->paginate(config('system.ui.table_page_size', 20));

        return view('assets.disposals', compact('items'));
    }

    public function audits(): View
    {
        $items = AssetAudit::with(['asset', 'location'])
            ->latest()
            ->paginate(config('system.ui.table_page_size', 20));

        return view('assets.audits', compact('items'));
    }
}
