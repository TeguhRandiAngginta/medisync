<?php
namespace App\Http\Controllers;

use App\Models\AuditLog;
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

        $alreadyOpen = 'Anda sudah memiliki shift yang aktif.';

        try {
            $opened = DB::transaction(function () use ($request) {
                // Kunci baris user agar dua request bersamaan (klik ganda) berjalan berurutan.
                DB::table('users')->where('id', auth()->id())->lockForUpdate()->first();

                if (CashRegister::where('user_id', auth()->id())->where('status', 'open')->exists()) {
                    return false;
                }

                $shift = CashRegister::create([
                    'user_id' => auth()->id(),
                    'opened_at' => now(),
                    'opening_amount' => $request->opening_amount,
                    'status' => 'open'
                ]);

                AuditLog::record(
                    'pos_shift',
                    'CREATE',
                    'Membuka shift kasir #' . $shift->id . ' dengan modal awal Rp ' . number_format($request->opening_amount, 0, ',', '.')
                );

                return true;
            });
        } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
            $opened = false; // index unik: shift lain terbuka di antara pengecekan dan insert
        }

        if (!$opened) {
            return redirect()->route('pos.index')->withErrors(['message' => $alreadyOpen]);
        }

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

        $result = DB::transaction(function () use ($request, &$activeShift) {
            // Kunci shift agar penutupan ganda (klik ganda) tidak dihitung dua kali.
            $activeShift = CashRegister::whereKey($activeShift->id)->where('status', 'open')->lockForUpdate()->first();
            abort_if(!$activeShift, 409, 'Shift ini sudah ditutup.');

            $sales = Sale::where('cash_register_id', $activeShift->id)->get();
            
            $systemCash = 0.0;
            $systemQris = 0.0;
            $systemTransfer = 0.0;

            foreach ($sales as $sale) {
                // Transaksi baru menyimpan rincian pembayaran terstruktur: pakai langsung.
                if (!is_null($sale->cash_amount)) {
                    $systemCash     += (float) $sale->cash_amount;
                    $systemQris     += (float) $sale->qris_amount;
                    $systemTransfer += (float) $sale->transfer_amount;
                    continue;
                }

                // Transaksi lama: rincian hanya ada di string payment_method.
                $method = (string) $sale->payment_method;

                if (str_contains($method, '+')) {
                    // Rekonsiliasi pembayaran split, misal "Cash: 50000 + QRIS: 25000" atau "Cash (50000) + QRIS (25000)"
                    preg_match_all('/(Cash|QRIS|Transfer)\s*(?::|\()?\s*(?:Rp\.?\s*)?([\d\.,]+)\)?/i', $method, $matches, PREG_SET_ORDER);
                    
                    if (!empty($matches)) {
                        foreach ($matches as $match) {
                            $mType = strtoupper($match[1]);
                            $mAmount = $this->parseAmount($match[2]);
                            
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
                        $systemQris += (float) ($sale->total_amount ?? $sale->paid_amount);
                    } elseif ($mUpper === 'TRANSFER') {
                        $systemTransfer += (float) ($sale->total_amount ?? $sale->paid_amount);
                    }
                }
            }

            // Uang di laci seharusnya = modal awal + tunai bersih penjualan (QRIS/transfer tidak masuk laci).
            $expectedCash = round((float) $activeShift->opening_amount + $systemCash, 2);
            $difference = round((float) $request->closing_amount - $expectedCash, 2);

            $activeShift->update([
                'closed_at' => now(),
                'closing_amount' => $request->closing_amount,
                'system_cash_amount' => $systemCash,
                'system_qris_amount' => $systemQris,
                'system_transfer_amount' => $systemTransfer,
                'expected_cash_amount' => $expectedCash,
                'cash_difference' => $difference,
                'notes' => $request->notes,
                'status' => 'closed'
            ]);

            $rp = fn ($n) => 'Rp ' . number_format(abs($n), 0, ',', '.');
            $label = $this->differenceLabel($difference, $rp);

            AuditLog::record(
                'pos_shift',
                'UPDATE',
                'Menutup shift kasir #' . $activeShift->id
                . ' - Modal awal: ' . $rp($activeShift->opening_amount)
                . ', Tunai penjualan: ' . $rp($systemCash)
                . ', Seharusnya di laci: ' . $rp($expectedCash)
                . ', Fisik: ' . $rp($request->closing_amount)
                . ', Selisih: ' . $label
                . ', QRIS: ' . $rp($systemQris) . ', Transfer: ' . $rp($systemTransfer)
            );

            return $label;
        });

        return redirect()->route('dashboard')->with('success', 'Shift kasir berhasil ditutup. Selisih kas: ' . $result . '.');
    }

    /** "sesuai", "kurang Rp X", atau "lebih Rp X". */
    private function differenceLabel(float $difference, callable $rp): string
    {
        if ($difference == 0.0) {
            return 'sesuai (Rp 0)';
        }

        return ($difference < 0 ? 'kurang ' : 'lebih ') . $rp($difference);
    }

    /**
     * Ubah teks nominal dari payment_method lama menjadi angka.
     * "50.000" / "1,250,000" => pemisah ribuan; "12500.5" / "12500,5" => desimal.
     */
    private function parseAmount(string $raw): float
    {
        $raw = trim($raw);

        if (preg_match('/^\d{1,3}([.,]\d{3})+$/', $raw)) {
            return (float) preg_replace('/[.,]/', '', $raw);
        }

        return (float) str_replace(',', '.', $raw);
    }
}
