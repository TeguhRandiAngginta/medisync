<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
    $currentTab = $request->get('tab', 'akun');

    $logs = \App\Models\AuditLog::with(['user.role'])
        ->where('module', $currentTab)
        ->latest()
        ->get();

    return Inertia::render('AuditLogs/Index', [
        'logs' => $logs,
        'currentTab' => $currentTab,
    ]);
}
}