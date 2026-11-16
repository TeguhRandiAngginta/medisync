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
        
        $systemCash = 0.0;
        $systemQris = 0.0;
        $systemTransfer = 0.0;

        foreach ($sales as $sale) {
            $method = (string) $sale->payment_method;

            if (str_contains($method, '+')) {
                // Rekonsiliasi pembayaran split, misal "Cash: 50000 + QRIS: 25000" atau "Cash (50000) + QRIS (25000)"
                preg_match_all('/(Cash|QRIS|Transfer)\s*(?::|\()?\s*(?:Rp\.?\s*)?([\d\.,]+)\)?/i', $method, $matches, PREG_SET_ORDER);
                
                if (!empty($matches)) {
                    foreach ($matches as $match) {
                        $mType = strtoupper($match[1]);
                        $mAmount = (float) str_replace(['.', ','], '', $match[2]);
                        
                        if ($mType === 'CASH') {
                            $systemCash += max(0, $mAmount - (float) $sale->change_amount);
                        } elseif ($mType === 'QRIS') {
                            $systemQris += $mAmount;
                        } elseif ($mType === 'TRANSFER') {
                            $systemTransfer += $mAmount;
                        }
                    }
                } else {
                    // Fallback jika hanya nama metode "Cash + QRIS" tanpa nominal angka spesifik
                    $parts = array_map('trim', explode('+', $method));
                    $count = count($parts);
                    $portion = $count > 0 ? ((float) $sale->total_amount / $count) : 0;
                    foreach ($parts as $p) {
                        $pUpper = strtoupper($p);
                        if (str_contains($pUpper, 'CASH')) {
                            $systemCash += $portion;
                        } elseif (str_contains($pUpper, 'QRIS')) {
                            $systemQris += $portion;
                        } elseif (str_contains($pUpper, 'TRANSFER')) {
                            $systemTransfer += $portion;
                        }
                    }
                }
            } else {
                $mUpper = strtoupper(trim($method));
                if ($mUpper === 'CASH') {
                    $systemCash += max(0, (float) $sale->paid_amount - (float) $sale->change_amount);
                } elseif ($mUpper === 'QRIS') {
                    $systemQris += (float) $sale->paid_amount;
                } elseif ($mUpper === 'TRANSFER') {
                    $systemTransfer += (float) $sale->paid_amount;
                }
            }
        }

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