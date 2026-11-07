<?php

namespace App\Http\Controllers;

use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\Medicine;
use App\Services\InventoryService;
use App\Services\GoogleAIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PrescriptionController extends Controller
{
    public function index()
    {
        $prescriptions = Prescription::with(['user', 'items.medicine'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Prescription/Index', [
            'prescriptions' => $prescriptions
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

    public function analyzeImage(Request $request)
    {
        try {
            $request->validate([
                'attachment' => 'required|file|mimes:jpg,jpeg,png,webp|max:5120'
            ]);
            
            $file = $request->file('attachment');
            $base64Image = base64_encode(file_get_contents($file->getPathname()));
            $mimeType = $file->getClientMimeType();

            // Prompt instruksi yang jelas agar AI mengekstrak semua baris obat secara teks mentah
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

            // Panggil GoogleAIService dengan sistem fallback multi-model
            $aiResult = GoogleAIService::generateContent($prompt, $base64Image, $mimeType);

            $extractedItems = $aiResult['items'] ?? [];
            $matchedItems = [];
            $notFoundMedicines = [];

            foreach ($extractedItems as $item) {
                // Ambil nama obat dari berbagai kemungkinan key yang dikembalikan AI
                $queryName = $item['medicine_name'] ?? ($item['name'] ?? '');
                if (empty($queryName)) continue;

                // Cari obat di database lokal berdasarkan kemiripan nama (Case-insensitive)
                $medicine = Medicine::where('is_active', true)
                    ->where(function($q) use ($queryName) {
                        $q->where('name', 'ilike', "%{$queryName}%")
                          ->orWhere('sku', 'ilike', "%{$queryName}%");
                    })
                    ->first();

                if ($medicine) {
                    // Jika obat ditemukan di database, masukkan ke daftar pilihan form
                    $matchedItems[] = [
                        'medicine_id' => $medicine->id,
                        'name'        => $medicine->name,
                        'quantity'    => (int) ($item['quantity'] ?? 1),
                        $item['signa'] ?? '3 x 1',
                    ];
                } else {
                    // Jika obat TIDAK terdaftar di database, cari alternatif terdekat sebagai saran
                    $searchKeyword = substr(trim($queryName), 0, 3);
                    $alternative = Medicine::where('is_active', true)
                        ->where('name', 'ilike', "%{$searchKeyword}%")
                        ->first();
                        
                    $altText = $alternative ? " (Saran Alternatif di Stok: {$alternative->name})" : " (Tidak ada alternatif yang mirip di inventaris)";
                    
                    // Catat ke dalam daftar obat hilang
                    $notFoundMedicines[] = "- {$queryName} (Diminta Qty: " . ($item['quantity'] ?? 1) . ", Signa: " . ($item['signa'] ?? '-') . "){$altText}";
                }
            }

            // Susun Catatan Tambahan (Warning) secara otomatis jika ada obat resep yang tidak terdaftar
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

        } catch (\Throwable $e) {
            Log::error('Prescription OCR Error: ' . $e->getMessage());
            return response()->json(['message' => 'Gagal memproses gambar dengan AI: ' . $e->getMessage()], 500);
        }
    }

    public function destroy(Prescription $prescription)
    {
        $prescription->delete();
        return redirect()->route('prescriptions.index')->with('success', 'Resep berhasil dihapus.');
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

            $prescription->items()->delete();

            foreach ($request->items as $item) {
                PrescriptionItem::create([
                    'prescription_id' => $prescription->id,
                    'medicine_id'     => $item['medicine_id'],
                    'quantity'        => $item['quantity'],
                    'signa'           => $item['signa'],
                ]);
            }

            DB::commit();
            return redirect()->route('prescriptions.index')->with('success', 'Resep berhasil diperbarui!');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal memperbarui resep: ' . $e->getMessage()]);
        }
    }
}