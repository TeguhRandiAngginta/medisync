<?php
namespace App\Http\Controllers;

use App\Models\CashRegister;
use App\Models\Sale;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class CashRegisterController extends Controller
{
    public function openShift(Request $request)
    {
        $request->validate([
            'opening_amount' => 'required|numeric|min:0'
        ]);

        $activeShift = CashRegister::where('user_id', auth()->id())
            ->where('status', 'open')
            ->first();

        if ($activeShift) {
            return redirect()->route('pos.index')->withErrors(['message' => 'Anda sudah memiliki shift yang aktif.']);
        }

        CashRegister::create([
            'user_id' => auth()->id(),
            'opened_at' => now(),
            'opening_amount' => $request->opening_amount,
            'status' => 'open'
        ]);

        return redirect()->route('pos.index')->with('success', 'Shift kasir berhasil dibuka. Selamat bekerja!');
    }

    public function closeShift(Request $request)
    {
        $request->validate([
            'closing_amount' => 'required|numeric|min:0', // Uang fisik di laci
            'notes' => 'nullable|string'
        ]);

        $activeShift = CashRegister::where('user_id', auth()->id())
            ->where('status', 'open')
            ->firstOrFail();

        $sales = Sale::where('cash_register_id', $activeShift->id)->get();
        
        $systemCash = $sales->where('payment_method', 'Cash')->sum('paid_amount') - $sales->where('payment_method', 'Cash')->sum('change_amount');
        $systemQris = $sales->where('payment_method', 'QRIS')->sum('paid_amount');
        $systemTransfer = $sales->where('payment_method', 'Transfer')->sum('paid_amount');

        $activeShift->update([
            'closed_at' => now(),
            'closing_amount' => $request->closing_amount,
            'system_cash_amount' => $systemCash,
            'system_qris_amount' => $systemQris,
            'system_transfer_amount' => $systemTransfer,
            'notes' => $request->notes,
            'status' => 'closed'
        ]);

        return redirect()->route('dashboard')->with('success', 'Shift kasir berhasil ditutup dan direkonsiliasi.');
    }
}