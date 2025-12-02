<?php

namespace App\Http\Controllers;

use App\Models\AssetApprovalRequest;
use App\Services\Workflow\ApprovalService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ApprovalController extends Controller
{
    public function __construct(private readonly ApprovalService $approvals)
    {
    }

    public function approve(Request $request, AssetApprovalRequest $approval): RedirectResponse
    {
        $this->approvals->approve($approval, $request->input('notes'));
        return back()->with('success', 'Permintaan disetujui.');
    }

    public function reject(Request $request, AssetApprovalRequest $approval): RedirectResponse
    {
        $this->approvals->reject($approval, $request->input('notes'));
        return back()->with('success', 'Permintaan ditolak.');
    }
}
