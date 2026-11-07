<?php

namespace App\Http\Controllers;

use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\Medicine;
use App\Services\InventoryService;
use App\Services\GoogleAIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
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

            $allMedicines = Medicine::where('is_active', true)->select('id', 'name')->get()->toArray();
            $medicineListJson = json_encode($allMedicines);

            $prompt = "Anda adalah sistem OCR apotek cerdas. Analisis gambar resep dokter ini. " .
                    "Daftar obat yang tersedia di database apotek kami: {$medicineListJson}. \n" .
                    "Ekstrak informasi berikut dan kembalikan HANYA format JSON murni tanpa markdown: \n" .
                    "{\n" .
                    "  \"patient_name\": \"Nama Pasien\",\n" .
                    "  \"doctor_name\": \"dr. Nama Dokter\",\n" .
                    "  \"prescription_date\": \"YYYY-MM-DD\",\n" .
                    "  \"items\": [\n" .
                    "    {\"medicine_id\": 1, \"name\": \"Nama Obat\", \"quantity\": 10, \"signa\": \"3x1 sesudah makan\"}\n" .
                    "  ]\n" .
                    "}";

            // Menggunakan GoogleAIService (bisa passing nama model apa saja di parameter ke-4)
            // Contoh: 'gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-2.5-pro'
            $parsedData = GoogleAIService::generateContent($prompt, $base64Image, $mimeType, 'gemini-2.5-flash');

            return response()->json($parsedData);

        } catch (\Throwable $e) {
            Log::error('Prescription OCR Error: ' . $e->getMessage());
            return response()->json(['message' => $e->getMessage()], 500);
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