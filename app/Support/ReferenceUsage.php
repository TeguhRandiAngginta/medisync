<?php

namespace App\Support;

use App\Models\Medicine;
use App\Models\Rack;
use App\Models\Supplier;

/**
 * Pemakaian data referensi oleh data aktif (belum di-trash).
 * Dipakai untuk menolak soft delete yang akan membuat relasi di UI menjadi kosong (null).
 */
class ReferenceUsage
{
    /** Deskripsi pemakaian (mis. "3 obat aktif") atau null bila tidak dipakai. */
    public static function blocker(string $kind, int $id): ?string
    {
        [$count, $label] = match ($kind) {
            'medicine_category' => [Medicine::where('medicine_category_id', $id)->count(), 'obat aktif'],
            'supplier'          => [Medicine::where('supplier_id', $id)->count(), 'obat aktif'],
            'rack'              => [Medicine::where('rack_id', $id)->count(), 'obat aktif'],
            'location_type'     => [Rack::where('location_type_id', $id)->count(), 'lokasi rak aktif'],
            'supplier_type'     => [Supplier::where('supplier_type_id', $id)->count(), 'pemasok aktif'],
        };

        return $count > 0 ? "{$count} {$label}" : null;
    }

    public static function message(string $entity, string $name, string $usage): string
    {
        return "Aksi Ditolak: {$entity} '{$name}' masih dipakai oleh {$usage}. Pindahkan atau hapus data tersebut terlebih dahulu.";
    }
}
