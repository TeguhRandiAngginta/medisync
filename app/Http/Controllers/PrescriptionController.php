<?php

namespace App\Http\Controllers;

use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\Medicine;
use App\Models\AuditLog;
use App\Services\InventoryService;
use App\Services\GoogleAIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PrescriptionController extends Controller
{
    /** Hapus/pulihkan resep hanya untuk superadmin & apoteker (kasir hanya mencatat/menebus). */
    private function authorizeManage(): void
    {
        $slug = auth()->user()->role->slug ?? '';
        if (!in_array($slug, ['superadmin', 'apoteker'])) {
            abort(403, 'Akses Ditolak: hanya Apoteker/Superadmin yang boleh menghapus atau memulihkan resep.');
        }
    }

    private function deleteAttachment(?string $path): void
    {
        if ($path) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($path);
        }
    }

    public function index(Request $request)
    {
        $trashed = $request->boolean('trashed', false);

        $query = Prescription::with(['user', 'items.medicine'])
            ->when($trashed, fn($q) => $q->onlyTrashed(), fn($q) => $q->withoutTrashed())
            ->orderBy($trashed ? 'deleted_at' : 'created_at', 'desc');

        $prescriptions = $query->get();
        $trashedCount = Prescription::onlyTrashed()->count();

        return Inertia::render('Prescription/Index', [
            'prescriptions' => $prescriptions,
            'trashed'      => $trashed,
            'trashedCount' => $trashedCount,
        ]);
    }

    public function create()
    {
        $medicines = Medicine::where('is_active', true)
            ->select('id', 'name', 'base_unit', 'sku', 'stock')
            ->get();

        return Inertia::render('Prescription/Create', [
            'medicines' => $medicines
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'patient_name'        => 'required|string|max:255',
            'doctor_name'         => 'required|string|max:255',
            'prescription_date'   => 'required|date',
            'notes'               => 'nullable|string',
            'attachment'          => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
            'items'               => 'required|array|min:1',
            'items.*.medicine_id' => 'required|exists:medicines,id', 
            'items.*.quantity'    => 'required|integer|min:1',
            'items.*.signa'       => 'required|string|max:255',
        ]);

        DB::beginTransaction();
        try {
            $attachmentPath = null;
            if ($request->hasFile('attachment')) {
                $attachmentPath = $request->file('attachment')->store('prescriptions', 'public');
            }

            $randomNumber = str_pad(mt_rand(1, 999), 3, '0', STR_PAD_LEFT);
            $prescriptionNumber = 'RSP-' . date('Ymd') . '-' . $randomNumber;

            $prescription = Prescription::create([
                'prescription_number' => $prescriptionNumber,
                'patient_name'        => $request->patient_name,
                'doctor_name'         => $request->doctor_name,
                'prescription_date'   => $request->prescription_date,
                'notes'               => $request->notes,
                'attachment'          => $attachmentPath,
                'user_id'             => auth()->id(),
                'status'              => 'DRAFT',
            ]);

            foreach ($request->items as $item) {
                PrescriptionItem::create([
                    'prescription_id' => $prescription->id,
                    'medicine_id'     => $item['medicine_id'],
                    'quantity'        => $item['quantity'],
                    'signa'           => $item['signa'],
                ]);
            }
            if (class_exists(AuditLog::class)) {
                AuditLog::record(
                    'resep', 
                    'CREATE', 
                    "Mencatat Resep Masuk No: {$prescriptionNumber} untuk pasien {$request->patient_name} dari {$request->doctor_name}."
                );
            }

            DB::commit();
            return redirect()->route('prescriptions.index')->with('success', 'Resep berhasil dicatat! Stok akan dipotong saat resep ditebus di Kasir.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal menyimpan resep: ' . $e->getMessage()]);
        }
    }

    public function getForPos($prescription_number)
    {
        $prescription = Prescription::with('items.medicine')
            ->where('prescription_number', $prescription_number)
            ->where('status', 'DRAFT')
            ->first();

        if (!$prescription) {
            return response()->json(['message' => 'Resep tidak ditemukan atau sudah ditebus!'], 404);
        }

        return response()->json($prescription);
    }

    public function getDraftsForPos()
    {
        $drafts = Prescription::where('status', 'DRAFT')
            ->orderBy('created_at', 'asc')
            ->get(['id', 'prescription_number', 'patient_name', 'doctor_name', 'created_at']);

        return response()->json($drafts);
    }

    public function analyzeImage(Request $request)
    {
        try {
            $request->validate([
                'attachment' => 'required|file|mimes:jpg,jpeg,png,webp|max:5120'
            ]);
            
            $file = $request->file('attachment');
            $base64Image = base64_encode(file_get_contents($file->getPathname()));
            $mimeType = $file->getClientMimeType();

            $prompt = "Analisis gambar resep dokter ini secara teliti. Ekstrak seluruh daftar obat yang tertulis ke dalam format JSON murni dengan struktur persis seperti ini:
            {
                \"patient_name\": \"Nama pasien jika ada, atau string kosong\",
                \"doctor_name\": \"Nama dokter jika ada, atau string kosong\",
                \"prescription_date\": \"Format YYYY-MM-DD jika ada, atau tanggal hari ini\",
                \"notes\": \"Catatan tambahan jika ada\",
                \"items\": [
                    {
                        \"medicine_name\": \"Nama obat tertulis (contoh: Paracetamol, CTM, Amoxicillin)\",
                        \"quantity\": 15,
                        \"signa\": \"Aturan pakai yang tertulis (contoh: 3 x 1)\"
                    }
                ]
            }";

            $aiResult = GoogleAIService::generateContent($prompt, $base64Image, $mimeType);

            $extractedItems = $aiResult['items'] ?? [];
            $matchedItems = [];
            $notFoundMedicines = [];

            foreach ($extractedItems as $item) {
                $queryName = trim((string) ($item['medicine_name'] ?? ($item['name'] ?? '')));
                if ($queryName === '') continue;

                $qty  = max(1, (int) ($item['quantity'] ?? 1));
                $signa = $item['signa'] ?? '3 x 1';

                ['match' => $medicine, 'candidates' => $candidates, 'reason' => $reason] = $this->findMedicineMatch($queryName);

                if ($medicine) {
                    $matchedItems[] = [
                        'medicine_id' => $medicine->id,
                        'name'        => $medicine->name,
                        'quantity'    => $qty,
                        'signa'       => $signa,
                    ];
                } else {
                    $altText = $candidates->isNotEmpty()
                        ? " ({$reason}. Pilihan di stok: " . $candidates->take(5)->pluck('name')->implode(', ') . ')'
                        : ' (Tidak ada alternatif yang mirip di inventaris)';

                    $notFoundMedicines[] = "- {$queryName} (Diminta Qty: {$qty}, Signa: " . ($item['signa'] ?? '-') . "){$altText}";
                }
            }

            $notes = $aiResult['notes'] ?? '';
            if (!empty($notFoundMedicines)) {
                $warningNote = "⚠️ PERINGATAN SISTEM (Stok Tidak Terdaftar):\n" . implode("\n", $notFoundMedicines);
                $notes = trim($notes . "\n\n" . $warningNote);
            }

            return response()->json([
                'success'           => true,
                'patient_name'      => $aiResult['patient_name'] ?? '',
                'doctor_name'       => $aiResult['doctor_name'] ?? '',
                'prescription_date' => $aiResult['prescription_date'] ?? date('Y-m-d'),
                'items'             => $matchedItems,
                'notes'             => $notes,
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Prescription OCR Error: ' . $e->getMessage());
            return response()->json(['message' => 'Gagal memproses gambar dengan AI: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Cocokkan nama obat hasil OCR ke master obat TANPA menebak.
     * Obat hanya dipilih otomatis bila hasilnya tunggal; jika ada beberapa kandidat
     * (mis. kekuatan berbeda) atau kekuatan di resep tidak cocok, apoteker harus memilih manual.
     *
     * @return array{match: ?Medicine, candidates: \Illuminate\Support\Collection, reason: string}
     */
    private function findMedicineMatch(string $queryName): array
    {
        $q = trim(preg_replace('/\s+/', ' ', $queryName));

        // Pisahkan nama dari kekuatan/dosis ("Amoxicillin 500 mg" => nama "Amoxicillin", dosis 500).
        // Nama dicari dulu, dosis dipakai kemudian untuk menyaring kandidat.
        $nameOnly = trim(preg_replace('/\d+(?:[.,]\d+)?\s*(?:mg|mcg|gr|g|ml|iu|%)?/iu', '', $q));
        $searchTerm = mb_strlen($nameOnly) >= 3 ? $nameOnly : $q;
        $like = addcslashes($searchTerm, '%_\\'); // jangan biarkan % dan _ dari OCR menjadi wildcard

        $candidates = Medicine::where('is_active', true)
            ->where(function ($w) use ($like) {
                $w->where('name', 'ilike', "%{$like}%")
                    ->orWhere('generic_name', 'ilike', "%{$like}%")
                    ->orWhere('sku', 'ilike', $like);
            })
            ->orderBy('name')
            ->limit(10)
            ->get();

        if ($candidates->isEmpty()) {
            // Saran alternatif: kata pertama nama (minimal 3 huruf)
            $firstWord = mb_substr(preg_split('/\s+/', $q)[0] ?? '', 0, 6);
            if (mb_strlen($firstWord) >= 3) {
                $fw = addcslashes($firstWord, '%_\\');
                $candidates = Medicine::where('is_active', true)->where('name', 'ilike', "%{$fw}%")->orderBy('name')->limit(5)->get();
            }
            return ['match' => null, 'candidates' => $candidates, 'reason' => 'Nama tidak ditemukan'];
        }

        // Kekuatan/dosis yang tertulis di resep (mis. 500, 0.5) harus ada pada obat yang dipilih.
        preg_match_all('/\d+(?:[.,]\d+)?/', $q, $m);
        $numbers = $m[0] ?? [];
        if (!empty($numbers)) {
            $withStrength = $candidates->filter(function ($med) use ($numbers) {
                $haystack = $med->name . ' ' . $med->dosage_strength;
                foreach ($numbers as $n) {
                    if (!preg_match('/(?<![\d.,])' . preg_quote($n, '/') . '(?![\d])/', $haystack)) {
                        return false;
                    }
                }
                return true;
            })->values();

            if ($withStrength->isEmpty()) {
                return ['match' => null, 'candidates' => $candidates, 'reason' => 'Kekuatan/dosis pada resep tidak cocok dengan stok'];
            }
            $candidates = $withStrength;
        }

        $exact = $candidates->filter(fn ($med) => in_array(mb_strtolower($med->name), [mb_strtolower($q), mb_strtolower($searchTerm)], true))->values();
        if ($exact->count() === 1) {
            return ['match' => $exact->first(), 'candidates' => $candidates, 'reason' => ''];
        }

        if ($candidates->count() === 1) {
            return ['match' => $candidates->first(), 'candidates' => $candidates, 'reason' => ''];
        }

        return ['match' => null, 'candidates' => $candidates, 'reason' => 'Ada beberapa obat yang cocok, pilih manual'];
    }

    public function destroy(Prescription $prescription)
    {
        $this->authorizeManage();
        $prescriptionNumber = $prescription->prescription_number;

        if ($prescription->status === 'DISPENSED') {
            return back()->withErrors(['message' => "Aksi Ditolak: Resep '{$prescriptionNumber}' sudah ditebus di Kasir dan tidak dapat dihapus."]);
        }

        DB::beginTransaction();
        try {
            $prescription->items()->delete();
            $prescription->delete();

            if (class_exists(AuditLog::class)) {
                AuditLog::record(
                    'resep', 
                    'DELETE', 
                    "Memindahkan resep masuk No: {$prescriptionNumber} ke keranjang sampah."
                );
            }

            DB::commit();
            return redirect()->route('prescriptions.index')->with('success', "Resep {$prescriptionNumber} berhasil dipindahkan ke tong sampah.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal memindahkan resep: ' . $e->getMessage()]);
        }
    }

    public function restore($id)
    {
        $this->authorizeManage();
        DB::beginTransaction();
        try {
            $prescription = Prescription::onlyTrashed()->findOrFail($id);
            $prescription->restore();
            PrescriptionItem::onlyTrashed()->where('prescription_id', $prescription->id)->restore();

            if (class_exists(AuditLog::class)) {
                AuditLog::record(
                    'resep', 
                    'RESTORE', 
                    "Memulihkan arsip resep masuk No: {$prescription->prescription_number} dari keranjang sampah."
                );
            }

            DB::commit();
            return redirect()->route('prescriptions.index', ['trashed' => true])
                ->with('success', "Resep {$prescription->prescription_number} berhasil dipulihkan.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal memulihkan resep: ' . $e->getMessage()]);
        }
    }

    public function forceDelete($id)
    {
        $this->authorizeManage();
        DB::beginTransaction();
        try {
            $prescription = Prescription::onlyTrashed()->findOrFail($id);

            // Validasi: jika status DISPENSED (sudah ditebus di POS), tolak hapus permanen agar audit medis terjaga
            if ($prescription->status === 'DISPENSED') {
                DB::rollBack();
                return back()->withErrors([
                    'message' => "Aksi Ditolak: Resep '{$prescription->prescription_number}' berstatus DISPENSED (sudah pernah ditebus di Kasir) sehingga tidak dapat dihapus secara permanen."
                ]);
            }

            $number = $prescription->prescription_number;
            $attachment = $prescription->attachment;
            PrescriptionItem::onlyTrashed()->where('prescription_id', $prescription->id)->forceDelete();
            $prescription->forceDelete();
            $this->deleteAttachment($attachment);

            if (class_exists(AuditLog::class)) {
                AuditLog::record(
                    'resep', 
                    'FORCE DELETE', 
                    "Menghapus PERMANEN resep masuk No: {$number} dari database."
                );
            }

            DB::commit();
            return redirect()->route('prescriptions.index', ['trashed' => true])
                ->with('success', "Resep {$number} berhasil dihapus secara permanen.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal menghapus permanen: ' . $e->getMessage()]);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $this->authorizeManage();
        $validated = $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'exists:prescriptions,id',
        ]);

        DB::beginTransaction();
        try {
            $prescriptions = Prescription::whereIn('id', $validated['ids'])->where('status', '!=', 'DISPENSED')->get();
            foreach ($prescriptions as $p) {
                $p->items()->delete();
                $p->delete();
            }

            if (class_exists(AuditLog::class)) {
                AuditLog::record('resep', 'BULK_DELETE', 'Memindahkan ' . count($prescriptions) . ' resep masuk ke keranjang sampah.');
            }

            DB::commit();
            return redirect()->route('prescriptions.index')->with('success', count($prescriptions) . ' resep berhasil dipindahkan ke keranjang sampah.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal menghapus massal: ' . $e->getMessage()]);
        }
    }

    public function bulkRestore(Request $request)
    {
        $this->authorizeManage();
        $validated = $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'integer',
        ]);

        DB::beginTransaction();
        try {
            $prescriptions = Prescription::onlyTrashed()->whereIn('id', $validated['ids'])->get();
            foreach ($prescriptions as $p) {
                $p->restore();
                PrescriptionItem::onlyTrashed()->where('prescription_id', $p->id)->restore();
            }

            if (class_exists(AuditLog::class)) {
                AuditLog::record('resep', 'BULK_RESTORE', 'Memulihkan ' . count($prescriptions) . ' resep masuk dari keranjang sampah.');
            }

            DB::commit();
            return redirect()->route('prescriptions.index', ['trashed' => true])
                ->with('success', count($prescriptions) . ' resep berhasil dipulihkan.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal memulihkan massal: ' . $e->getMessage()]);
        }
    }

    public function bulkForceDelete(Request $request)
    {
        $this->authorizeManage();
        $validated = $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'integer',
        ]);

        DB::beginTransaction();
        try {
            $prescriptions = Prescription::onlyTrashed()->whereIn('id', $validated['ids'])->get();
            $deletedCount = 0;
            $failedNumbers = [];

            foreach ($prescriptions as $p) {
                if ($p->status === 'DISPENSED') {
                    $failedNumbers[] = "{$p->prescription_number} (status DISPENSED)";
                    continue;
                }

                $number = $p->prescription_number;
                $attachment = $p->attachment;
                PrescriptionItem::onlyTrashed()->where('prescription_id', $p->id)->forceDelete();
                $p->forceDelete();
                $this->deleteAttachment($attachment);
                AuditLog::record('resep', 'FORCE DELETE', "Menghapus PERMANEN resep masuk No: {$number} (bulk)");
                $deletedCount++;
            }

            if (count($failedNumbers) > 0 && $deletedCount === 0) {
                DB::rollBack();
                return back()->withErrors([
                    'message' => 'Seluruh resep terpilih tidak dapat dihapus permanen karena sudah pernah ditebus di Kasir: ' . implode('; ', $failedNumbers) . '.'
                ]);
            }

            DB::commit();

            $message = "{$deletedCount} resep berhasil dihapus secara permanen.";
            if (count($failedNumbers) > 0) {
                $message .= ' Namun ' . count($failedNumbers) . ' resep dilewati karena sudah ditebus: ' . implode('; ', $failedNumbers) . '.';
            }

            return redirect()->route('prescriptions.index', ['trashed' => true])->with('success', $message);
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal hapus permanen massal: ' . $e->getMessage()]);
        }
    }

    public function edit(Prescription $prescription)
    {
        if ($prescription->status !== 'DRAFT') {
            return redirect()->route('prescriptions.index')->with('error', 'Resep yang sudah ditebus tidak dapat diubah.');
        }

        $prescription->load('items.medicine');

        $medicines = Medicine::where('is_active', true)
            ->select('id', 'name', 'base_unit', 'sku', 'stock')
            ->get();

        return Inertia::render('Prescription/Edit', [
            'prescription' => $prescription,
            'medicines'    => $medicines
        ]);
    }

    public function update(Request $request, Prescription $prescription)
    {
        if ($prescription->status !== 'DRAFT') {
            return back()->withErrors(['message' => 'Resep yang sudah ditebus tidak dapat diubah.']);
        }

        $request->validate([
            'patient_name'        => 'required|string|max:255',
            'doctor_name'         => 'required|string|max:255',
            'prescription_date'   => 'required|date',
            'notes'               => 'nullable|string',
            'items'               => 'required|array|min:1',
            'items.*.medicine_id' => 'required|exists:medicines,id', 
            'items.*.quantity'    => 'required|integer|min:1',
            'items.*.signa'       => 'required|string|max:255',
        ]);

        DB::beginTransaction();
        try {
            $prescription->update([
                'patient_name'      => $request->patient_name,
                'doctor_name'       => $request->doctor_name,
                'prescription_date' => $request->prescription_date,
                'notes'             => $request->notes,
            ]);

            // forceDelete: item lama hasil edit tidak boleh hidup lagi saat resep dipulihkan dari trash.
            $prescription->items()->forceDelete();

            foreach ($request->items as $item) {
                PrescriptionItem::create([
                    'prescription_id' => $prescription->id,
                    'medicine_id'     => $item['medicine_id'],
                    'quantity'        => $item['quantity'],
                    'signa'           => $item['signa'],
                ]);
            }

            if (class_exists(AuditLog::class)) {
                AuditLog::record(
                    'resep', 
                    'UPDATE', 
                    "Mengubah rincian resep masuk No: {$prescription->prescription_number} (Pasien: {$request->patient_name}, Dokter: {$request->doctor_name})."
                );
            }

            DB::commit();
            return redirect()->route('prescriptions.index')->with('success', 'Resep berhasil diperbarui!');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal memperbarui resep: ' . $e->getMessage()]);
        }
    }
}