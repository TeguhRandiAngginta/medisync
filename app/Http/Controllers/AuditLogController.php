<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $tab = $request->query('tab', 'akun');

        $logs = AuditLog::with('user.role')
            ->where('module', $tab)
            ->latest()
            ->get();

        return Inertia::render('AuditLogs/Index', [
            'logs' => $logs,
            'currentTab' => $tab
        ]);
    }
}