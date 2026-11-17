<?php

namespace App\Console\Commands;

use App\Models\Prescription;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * Pindahkan lampiran resep lama dari disk `public` (bisa diakses tanpa login lewat /storage)
 * ke disk privat `local` (hanya bisa dibuka lewat route berotorisasi).
 */
class SecurePrescriptionAttachments extends Command
{
    protected $signature = 'prescriptions:secure-attachments';

    protected $description = 'Pindahkan lampiran resep lama dari disk public ke disk privat';

    public function handle(): int
    {
        $public = Storage::disk('public');
        $private = Storage::disk('local');
        $moved = 0;
        $missing = 0;

        Prescription::withTrashed()->whereNotNull('attachment')->orderBy('id')->each(function ($prescription) use ($public, $private, &$moved, &$missing) {
            $path = $prescription->attachment;

            if ($private->exists($path)) {
                $public->delete($path); // sudah ada di disk privat; buang salinan publik
                return;
            }

            if (!$public->exists($path)) {
                $missing++;
                return;
            }

            $private->put($path, $public->get($path));
            $public->delete($path);
            $moved++;
        });

        $this->info("Dipindahkan: {$moved}. File tidak ditemukan: {$missing}.");

        return self::SUCCESS;
    }
}
