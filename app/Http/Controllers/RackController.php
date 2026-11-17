<?php

namespace App\Http\Controllers;

use App\Models\Rack;
use App\Models\LocationType;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Support\ReferenceUsage;

class RackController extends Controller
{
    public function index(Request $request)
    {
        $trashed = $request->boolean('trashed', false);

        if ($trashed) {
            $racks = Rack::onlyTrashed()->with('locationType')->latest('deleted_at')->orderByDesc('id')->paginate(25)->withQueryString();
        } else {
            $racks = Rack::with('locationType')->latest()->orderByDesc('id')->paginate(25)->withQueryString();
        }

        return Inertia::render('Racks/Index', [
            'racks'       => $racks,
            'trashed'     => $trashed,
            'trashedCount' => Rack::onlyTrashed()->count(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Racks/Create', [
            'locationTypes' => LocationType::all()
        ]);
    }

    public function store(Request $request)
    {
        if ($request->filled('code')) {
            $request->merge(['code' => strtoupper($request->code)]);
        }

        $validated = $request->validate([
            'location_type_id' => 'required|exists:location_types,id',
            'code'             => 'required|string|max:50|unique:racks',
            'name'             => 'required|string|max:255',
            'description'      => 'nullable|string',
        ]);

        $rack = Rack::create([
            'branch_id'        => $request->user()->branch_id ?? 1,
            'location_type_id' => $validated['location_type_id'],
            'code'             => strtoupper($validated['code']),
            'name'             => $validated['name'],
            'description'      => $validated['description'] ?? null,
            'is_active'        => true,
        ]);

        AuditLog::record('rak', 'CREATE', "Menambahkan lokasi rak baru: {$rack->name} ({$rack->code})");

        return redirect()->route('racks.index')->with('success', "Lokasi rak {$rack->name} ({$rack->code}) berhasil ditambahkan!");
    }

    public function edit(Rack $rack)
    {
        return Inertia::render('Racks/Edit', [
            'rackEdit'      => $rack,
            'locationTypes' => LocationType::all()
        ]);
    }

    public function update(Request $request, Rack $rack)
    {
        $validated = $request->validate([
            'location_type_id' => 'required|exists:location_types,id',
            'code'             => 'required|string|max:50|unique:racks,code,' . $rack->id,
            'name'             => 'required|string|max:255',
            'description'      => 'nullable|string',
            'is_active'        => 'boolean',
        ]);

        $rack->update([
            'branch_id'        => $request->user()->branch_id ?? $rack->branch_id ?? 1,
            'location_type_id' => $validated['location_type_id'],
            'code'             => strtoupper($validated['code']),
            'name'             => $validated['name'],
            'description'      => $validated['description'] ?? null,
            'is_active'        => $request->is_active ?? false,
        ]);

        AuditLog::record('rak', 'UPDATE', "Memperbarui data lokasi rak: {$rack->name}");

        return redirect()->route('racks.index')->with('success', "Data lokasi rak {$rack->name} berhasil diperbarui!");
    }

    public function destroy(Rack $rack)
    {
        if ($usage = ReferenceUsage::blocker('rack', $rack->id)) {
            return back()->withErrors(['message' => ReferenceUsage::message('Lokasi rak', $rack->name, $usage)]);
        }

        DB::beginTransaction();
        try {
            $rackName = $rack->name;
            $rack->delete(); // soft delete

            AuditLog::record('rak', 'DELETE', "Memindahkan lokasi rak '{$rackName}' ke keranjang sampah.");
            DB::commit();

            return redirect()->route('racks.index')->with('success', "Lokasi rak {$rackName} berhasil dipindahkan ke tong sampah.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal menghapus: ' . $e->getMessage()]);
        }
    }

    public function restore($id)
    {
        DB::beginTransaction();
        try {
            $rack = Rack::onlyTrashed()->findOrFail($id);
            $rack->restore();

            AuditLog::record('rak', 'RESTORE', "Memulihkan lokasi rak: {$rack->name} ({$rack->code})");
            DB::commit();

            return redirect()->route('racks.index', ['trashed' => true])
                ->with('success', "Lokasi rak {$rack->name} berhasil dipulihkan.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal memulihkan: ' . $e->getMessage()]);
        }
    }

    public function forceDelete($id)
    {
        DB::beginTransaction();
        try {
            $rack = Rack::onlyTrashed()->findOrFail($id);

            // Cegah force delete jika masih ada obat (termasuk yang soft-deleted) di rak ini
            $medicineCount = \App\Models\Medicine::withTrashed()->where('rack_id', $rack->id)->count();
            if ($medicineCount > 0) {
                DB::rollBack();
                return back()->withErrors([
                    'message' => "Aksi Ditolak: Lokasi rak '{$rack->name}' ({$rack->code}) tidak dapat dihapus secara permanen karena masih terhubung dengan {$medicineCount} data katalog obat pada tabel 'medicines' (termasuk obat di dalam Trash)."
                ]);
            }

            $rackName = $rack->name;
            $rack->forceDelete();

            AuditLog::record('rak', 'FORCE DELETE', "Menghapus PERMANEN lokasi rak: {$rackName}");
            DB::commit();

            return redirect()->route('racks.index', ['trashed' => true])
                ->with('success', "Lokasi rak {$rackName} berhasil dihapus secara permanen.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal hapus permanen: ' . $e->getMessage()]);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'exists:racks,id',
        ]);

        // Yang masih dipakai data aktif dilewati (lihat ReferenceUsage); sisanya dipindahkan ke trash.
        DB::beginTransaction();
        try {
            $racks = Rack::whereIn('id', $validated['ids'])->get();
            $deleted = 0;
            $failed = [];
            foreach ($racks as $rack) {
                if ($usage = ReferenceUsage::blocker('rack', $rack->id)) {
                    $failed[] = "{$rack->name} ({$usage})";
                    continue;
                }
                $rack->delete();
                $deleted++;
            }

            if ($deleted === 0 && count($failed) > 0) {
                DB::rollBack();
                return back()->withErrors(['message' => 'Seluruh lokasi rak terpilih masih dipakai dan tidak dapat dihapus: ' . implode('; ', $failed) . '. Pindahkan atau hapus data yang memakainya terlebih dahulu.']);
            }

            $skipNote = count($failed) > 0 ? ' Dilewati karena masih dipakai: ' . implode('; ', $failed) . '.' : '';
            AuditLog::record('rak', 'BULK_DELETE', 'Memindahkan ' . $deleted . ' lokasi rak ke keranjang sampah.');
            DB::commit();

            return redirect()->route('racks.index')->with('success', $deleted . ' lokasi rak berhasil dipindahkan ke tong sampah.' . $skipNote);
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal hapus massal: ' . $e->getMessage()]);
        }
    }

    public function bulkRestore(Request $request)
    {
        $validated = $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'integer',
        ]);

        DB::beginTransaction();
        try {
            $racks = Rack::onlyTrashed()->whereIn('id', $validated['ids'])->get();
            foreach ($racks as $rack) {
                $rack->restore();
            }
            AuditLog::record('rak', 'BULK_RESTORE', 'Memulihkan ' . count($racks) . ' lokasi rak dari keranjang sampah.');
            DB::commit();

            return redirect()->route('racks.index', ['trashed' => true])
                ->with('success', count($racks) . ' lokasi rak berhasil dipulihkan.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal pulihkan massal: ' . $e->getMessage()]);
        }
    }

    public function bulkForceDelete(Request $request)
    {
        $validated = $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'integer',
        ]);

        DB::beginTransaction();
        try {
            $racks = Rack::onlyTrashed()->whereIn('id', $validated['ids'])->get();
            $deletedCount = 0;
            $failedNames = [];

            foreach ($racks as $rack) {
                $medicineCount = \App\Models\Medicine::withTrashed()->where('rack_id', $rack->id)->count();
                if ($medicineCount > 0) {
                    $failedNames[] = "{$rack->name} ({$medicineCount} obat pada medicines)";
                    continue;
                }

                $name = $rack->name;
                $rack->forceDelete();
                AuditLog::record('rak', 'FORCE DELETE', "Menghapus PERMANEN lokasi rak: {$name} (bulk)");
                $deletedCount++;
            }

            if (count($failedNames) > 0 && $deletedCount === 0) {
                DB::rollBack();
                return back()->withErrors([
                    'message' => 'Seluruh lokasi rak terpilih tidak dapat dihapus permanen karena masih terhubung dengan katalog obat: ' . implode('; ', $failedNames) . ' (termasuk obat di dalam Trash).'
                ]);
            }

            DB::commit();

            $message = "{$deletedCount} lokasi rak berhasil dihapus secara permanen.";
            if (count($failedNames) > 0) {
                $message .= ' Namun ' . count($failedNames) . ' lokasi rak dilewati karena masih terhubung dengan katalog obat: ' . implode('; ', $failedNames) . '.';
            }

            return redirect()->route('racks.index', ['trashed' => true])->with('success', $message);
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal hapus permanen massal: ' . $e->getMessage()]);
        }
    }
}
