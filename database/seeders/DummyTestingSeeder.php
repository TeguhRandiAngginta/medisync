<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DummyTestingSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $now = Carbon::now();
            $userId = DB::table('users')->value('id') ?? 1;
            $branchId = DB::table('branches')->value('id') ?? 1;
            $cashRegisterId = DB::table('cash_registers')->where('status', 'open')->value('id')
                ?? DB::table('cash_registers')->value('id');

            // 1. 10 DATA LOKASI RAK (5 Gudang Utama [id=2], 5 Etalase Depan [id=1])
            $rackIds = [];
            for ($i = 1; $i <= 10; $i++) {
                $isGudang = $i <= 5;
                $num = $isGudang ? $i : ($i - 5);
                $code = ($isGudang ? 'GD-' : 'ET-') . str_pad($num, 2, '0', STR_PAD_LEFT);

                $rackIds[] = DB::table('racks')->insertGetId([
                    'branch_id'        => $branchId,
                    'location_type_id' => $isGudang ? 2 : 1,
                    'code'             => $code,
                    'name'             => $isGudang ? "Gudang Penyimpanan {$num}" : "Etalase Obat {$num}",
                    'description'      => $isGudang ? "Rak penyimpanan stok cadangan nomor {$num}" : "Rak pajangan depan kasir nomor {$num}",
                    'is_active'        => true,
                    'created_at'       => $now,
                    'updated_at'       => $now,
                ]);
            }

            // 2. 10 DATA SUPPLIER / PEMASOK (5 PBF Utama [id=1], 5 Distributor Lokal [id=2])
            $suppliersData = [
                ['code' => 'PBF-01', 'type' => 1, 'name' => 'PT Kimia Farma Trading & Distribution', 'cp' => 'Budi Santoso', 'phone' => '06458231300', 'email' => 'order@kftd.co.id', 'addr' => 'Jl. Merdeka Barat No. 12'],
                ['code' => 'PBF-02', 'type' => 1, 'name' => 'PT Anugerah Argon Medica', 'cp' => 'Siti Aminah', 'phone' => '06458233018', 'email' => 'sales@anugerah-argon.com', 'addr' => 'Jl. Medan - Banda Aceh Km. 5'],
                ['code' => 'PBF-03', 'type' => 1, 'name' => 'PT Enseval Putera Megatrading', 'cp' => 'Hendra Wijaya', 'phone' => '06458237593', 'email' => 'cs.aceh@enseval.com', 'addr' => 'Jl. Industri No. 45'],
                ['code' => 'PBF-04', 'type' => 1, 'name' => 'PT Dosni Roha Indonesia', 'cp' => 'Rina Kartika', 'phone' => '06458232050', 'email' => 'order@dosniroha.com', 'addr' => 'Jl. Sultan Iskandar Muda No. 88'],
                ['code' => 'PBF-05', 'type' => 1, 'name' => 'PT Tempo Scan Pacific Tbk', 'cp' => 'Agus Pratama', 'phone' => '06458238640', 'email' => 'distribusi@temposcan.co.id', 'addr' => 'Jl. Ahmad Yani No. 19'],
                ['code' => 'LOK-01', 'type' => 2, 'name' => 'CV Parazain Mandiri Farma', 'cp' => 'Zainal Abidin', 'phone' => '06458238086', 'email' => 'parazain@gmail.com', 'addr' => 'Jl. Samudera Baru No. 7'],
                ['code' => 'LOK-02', 'type' => 2, 'name' => 'PT Millenium Pharmacon International', 'cp' => 'Dewi Lestari', 'phone' => '06458232487', 'email' => 'mpi.lokal@gmail.com', 'addr' => 'Jl. Darussalam No. 23'],
                ['code' => 'LOK-03', 'type' => 2, 'name' => 'PT Pyridam Farma Distribusi', 'cp' => 'Fajar Nugroho', 'phone' => '06458236478', 'email' => 'pyridam.aceh@gmail.com', 'addr' => 'Jl. Panglateh No. 14'],
                ['code' => 'LOK-04', 'type' => 2, 'name' => 'PT Daria Varia Laboratoria', 'cp' => 'Nadia Putri', 'phone' => '06458236486', 'email' => 'dv.distribusi@gmail.com', 'addr' => 'Jl. Teuku Umar No. 31'],
                ['code' => 'LOK-05', 'type' => 2, 'name' => 'PT Phapros Tbk Regional', 'cp' => 'Reza Pahlevi', 'phone' => '06458233379', 'email' => 'phapros.reg@gmail.com', 'addr' => 'Jl. Sukaramai No. 50'],
            ];

            $supplierIds = [];
            foreach ($suppliersData as $s) {
                $supplierIds[] = DB::table('suppliers')->insertGetId([
                    'supplier_type_id' => $s['type'],
                    'code'             => $s['code'],
                    'name'             => $s['name'],
                    'contact_person'   => $s['cp'],
                    'phone'            => $s['phone'],
                    'email'            => $s['email'],
                    'address'          => $s['addr'],
                    'is_active'        => true,
                    'created_at'       => $now,
                    'updated_at'       => $now,
                ]);
            }

            // 3. 10 DATA KATALOG OBAT
            // Category: 1=Obat Bebas, 2=Obat Bebas Terbatas, 3=Obat Keras, 4=Obat Paten
            $medicinesData = [
                ['sku' => 'OBT-001', 'barcode' => '899100100001', 'cat' => 1, 'name' => 'Paracetamol 500 mg', 'generic' => 'Paracetamol', 'form' => 'Tablet', 'strength' => '500 mg', 'rx' => false, 'unit' => 'Strip', 'buy' => 3500, 'sell' => 5000],
                ['sku' => 'OBT-002', 'barcode' => '899100100002', 'cat' => 1, 'name' => 'Promag Double Action', 'generic' => 'Hydrotalcite, Mg(OH)2', 'form' => 'Tablet Kunyah', 'strength' => '200 mg', 'rx' => false, 'unit' => 'Strip', 'buy' => 7500, 'sell' => 10000],
                ['sku' => 'OBT-003', 'barcode' => '899100100003', 'cat' => 1, 'name' => 'Enervon-C Multivitamin', 'generic' => 'Vitamin C & B Kompleks', 'form' => 'Tablet', 'strength' => '500 mg', 'rx' => false, 'unit' => 'Strip', 'buy' => 5500, 'sell' => 7500],
                ['sku' => 'OBT-004', 'barcode' => '899100100004', 'cat' => 2, 'name' => 'OBH Combi Batuk Flu', 'generic' => 'Succus Liquiritiae, Paracetamol', 'form' => 'Sirup', 'strength' => '100 ml', 'rx' => false, 'unit' => 'Botol', 'buy' => 14000, 'sell' => 18500],
                ['sku' => 'OBT-005', 'barcode' => '899100100005', 'cat' => 2, 'name' => 'Cetirizine HCl 10 mg', 'generic' => 'Cetirizine Hydrochloride', 'form' => 'Tablet', 'strength' => '10 mg', 'rx' => false, 'unit' => 'Strip', 'buy' => 4500, 'sell' => 7000],
                ['sku' => 'OBT-006', 'barcode' => '899100100006', 'cat' => 3, 'name' => 'Amoxicillin Trihydrate 500 mg', 'generic' => 'Amoxicillin', 'form' => 'Kaplet', 'strength' => '500 mg', 'rx' => true, 'unit' => 'Strip', 'buy' => 6000, 'sell' => 9000],
                ['sku' => 'OBT-007', 'barcode' => '899100100007', 'cat' => 3, 'name' => 'Amlodipine Besylate 5 mg', 'generic' => 'Amlodipine', 'form' => 'Tablet', 'strength' => '5 mg', 'rx' => true, 'unit' => 'Strip', 'buy' => 5000, 'sell' => 8000],
                ['sku' => 'OBT-008', 'barcode' => '899100100008', 'cat' => 3, 'name' => 'Cefixime Trihydrate 100 mg', 'generic' => 'Cefixime', 'form' => 'Kapsul', 'strength' => '100 mg', 'rx' => true, 'unit' => 'Strip', 'buy' => 18000, 'sell' => 25000],
                ['sku' => 'OBT-009', 'barcode' => '899100100009', 'cat' => 4, 'name' => 'Sanmol Forte 650 mg', 'generic' => 'Paracetamol', 'form' => 'Tablet', 'strength' => '650 mg', 'rx' => false, 'unit' => 'Strip', 'buy' => 4800, 'sell' => 6500],
                ['sku' => 'OBT-010', 'barcode' => '899100100010', 'cat' => 4, 'name' => 'Neurobion Forte Pink', 'generic' => 'Vitamin B1, B6, B12', 'form' => 'Tablet Salut', 'strength' => '5000 mcg', 'rx' => false, 'unit' => 'Strip', 'buy' => 32000, 'sell' => 40000],
            ];

            $medicineIds = [];
            foreach ($medicinesData as $idx => $m) {
                $medicineIds[] = DB::table('medicines')->insertGetId([
                    'medicine_category_id'  => $m['cat'],
                    'supplier_id'           => $supplierIds[$idx],
                    'rack_id'               => $rackIds[$idx],
                    'sku'                   => $m['sku'],
                    'barcode'               => $m['barcode'],
                    'name'                  => $m['name'],
                    'generic_name'          => $m['generic'],
                    'dosage_form'           => $m['form'],
                    'dosage_strength'       => $m['strength'],
                    'requires_prescription' => $m['rx'],
                    'base_unit'             => $m['unit'],
                    'min_stock'             => 10,
                    'minimum_stock'         => 10,
                    'max_stock'             => 200,
                    'selling_price'         => $m['sell'],
                    'current_stock'         => 100,
                    'stock'                 => 100,
                    'is_active'             => true,
                    'created_at'            => $now,
                    'updated_at'            => $now,
                ]);
            }

            // 4. 10 DATA FAKTUR PEMBELIAN + PURCHASE DETAILS + PRODUCT BATCHES
            $batchIds = [];
            $batchNumbers = [];
            for ($i = 0; $i < 10; $i++) {
                $num = str_pad($i + 1, 3, '0', STR_PAD_LEFT);
                $qty = 100;
                $buyPrice = $medicinesData[$i]['buy'];
                $subtotal = $qty * $buyPrice;
                $purchaseDate = $now->copy()->subDays(10 - $i);
                // Batch ke-1 dibuat mendekati kedaluwarsa (20 hari lagi) untuk uji peringatan FEFO
                $expDate = ($i === 0)
                    ? $now->copy()->addDays(20)->toDateString()
                    : $now->copy()->addMonths(12 + $i)->toDateString();
                $batchNo = 'BCH-2026-' . $num;
                $batchNumbers[] = $batchNo;

                $purchaseId = DB::table('purchases')->insertGetId([
                    'invoice_number'          => "INV-PBF-2026-{$num}",
                    'internal_receipt_number' => "RCV-2026-{$num}",
                    'supplier_id'             => $supplierIds[$i],
                    'user_id'                 => $userId,
                    'purchase_date'           => $purchaseDate->toDateString(),
                    'total_amount'            => $subtotal,
                    'status'                  => 'completed',
                    'notes'                   => 'Penerimaan stok rutin dari ' . $suppliersData[$i]['name'],
                    'created_at'              => $purchaseDate,
                    'updated_at'              => $purchaseDate,
                ]);

                $detailId = DB::table('purchase_details')->insertGetId([
                    'purchase_id'    => $purchaseId,
                    'medicine_id'    => $medicineIds[$i],
                    'batch_number'   => $batchNo,
                    'expired_date'   => $expDate,
                    'quantity'       => $qty,
                    'purchase_price' => $buyPrice,
                    'subtotal'       => $subtotal,
                    'created_at'     => $purchaseDate,
                    'updated_at'     => $purchaseDate,
                ]);

                $batchIds[] = DB::table('product_batches')->insertGetId([
                    'medicine_id'        => $medicineIds[$i],
                    'purchase_detail_id' => $detailId,
                    'batch_number'       => $batchNo,
                    'stock_quantity'     => $qty,
                    'expired_date'       => $expDate,
                    'purchase_price'     => $buyPrice,
                    'created_at'         => $purchaseDate,
                    'updated_at'         => $purchaseDate,
                ]);
            }

            // 5. 10 DATA STOCK OPNAME (STOCK ADJUSTMENTS)
            $opnameCases = [
                ['type' => 'CORRECTION', 'diff' => 2,  'note' => 'Kelebihan 2 strip saat hitung ulang rak'],
                ['type' => 'DAMAGE',     'diff' => -2, 'note' => 'Kemasan blister penyok saat bongkar muat'],
                ['type' => 'EXPIRED',    'diff' => -1, 'note' => 'Pemisahan sampel mendekati ED'],
                ['type' => 'LOST',       'diff' => -1, 'note' => 'Selisih 1 strip saat audit mingguan'],
                ['type' => 'CORRECTION', 'diff' => 0,  'note' => 'Stok fisik sesuai dengan sistem'],
                ['type' => 'CORRECTION', 'diff' => 3,  'note' => 'Ditemukan 3 strip terselip di laci etalase'],
                ['type' => 'DAMAGE',     'diff' => -1, 'note' => 'Segel strip terbuka'],
                ['type' => 'LOST',       'diff' => -2, 'note' => 'Selisih opname bulanan'],
                ['type' => 'CORRECTION', 'diff' => 0,  'note' => 'Verifikasi stok opname rutin'],
                ['type' => 'EXPIRED',    'diff' => -1, 'note' => 'Karantina stok rusak kemasan'],
            ];

            for ($i = 0; $i < 10; $i++) {
                $sysStock = 100;
                $diff = $opnameCases[$i]['diff'];
                $actStock = $sysStock + $diff;

                DB::table('stock_adjustments')->insert([
                    'medicine_id'      => $medicineIds[$i],
                    'product_batch_id' => $batchIds[$i],
                    'user_id'          => $userId,
                    'system_stock'     => $sysStock,
                    'actual_stock'     => $actStock,
                    'difference'       => $diff,
                    'type'             => $opnameCases[$i]['type'],
                    'notes'            => $opnameCases[$i]['note'],
                    'created_at'       => $now->copy()->subHours(20 - $i),
                    'updated_at'       => $now->copy()->subHours(20 - $i),
                ]);

                DB::table('product_batches')->where('id', $batchIds[$i])->update(['stock_quantity' => $actStock]);
                DB::table('medicines')->where('id', $medicineIds[$i])->update([
                    'current_stock' => $actStock,
                    'stock'         => $actStock,
                ]);
            }

            // 6. 10 DATA RESEP MASUK (PRESCRIPTIONS + PRESCRIPTION ITEMS)
            $patients = [
                ['patient' => 'Ahmad Fauzi',      'doctor' => 'dr. Aris Aji Kurniawan, Sp.PD', 'status' => 'DISPENSED', 'signa' => '3 x 1 tablet sesudah makan'],
                ['patient' => 'Siti Nurhaliza',   'doctor' => 'dr. Maya Sari, Sp.A',            'status' => 'DISPENSED', 'signa' => '2 x 1 sendok takar'],
                ['patient' => 'Rudi Hartono',     'doctor' => 'dr. Hendra Gunawan, Sp.JP',      'status' => 'DISPENSED', 'signa' => '1 x 1 tablet pagi hari'],
                ['patient' => 'Cut Nyak Meutia',  'doctor' => 'dr. Rahmat Hidayat',             'status' => 'DISPENSED', 'signa' => '3 x 1 kapsul habiskan'],
                ['patient' => 'Bambang Pamungkas','doctor' => 'dr. Aris Aji Kurniawan, Sp.PD', 'status' => 'DISPENSED', 'signa' => '2 x 1 tablet bila demam'],
                ['patient' => 'Nurlaila Sari',    'doctor' => 'dr. Fitria Ramadhani',           'status' => 'DRAFT',     'signa' => '3 x 1 tablet sesudah makan'],
                ['patient' => 'Teuku Rizki',      'doctor' => 'dr. Hendra Gunawan, Sp.JP',      'status' => 'DRAFT',     'signa' => '1 x 1 tablet malam hari'],
                ['patient' => 'Dewi Sartika',     'doctor' => 'dr. Maya Sari, Sp.A',            'status' => 'DRAFT',     'signa' => '2 x 1 tablet kunyah'],
                ['patient' => 'M. Iqbal Maulana', 'doctor' => 'dr. Rahmat Hidayat',             'status' => 'DRAFT',     'signa' => '3 x 1 kaplet habiskan'],
                ['patient' => 'Putri Balqis',     'doctor' => 'dr. Fitria Ramadhani',           'status' => 'DRAFT',     'signa' => '1 x 1 tablet sesudah makan'],
            ];

            for ($i = 0; $i < 10; $i++) {
                $rxNum = 'RSP-20261118-' . str_pad($i + 101, 3, '0', STR_PAD_LEFT);
                $rxDate = $now->copy()->subHours(10 - $i);

                $prescriptionId = DB::table('prescriptions')->insertGetId([
                    'prescription_number' => $rxNum,
                    'patient_name'        => $patients[$i]['patient'],
                    'doctor_name'         => $patients[$i]['doctor'],
                    'prescription_date'   => $rxDate->toDateString(),
                    'status'              => $patients[$i]['status'],
                    'notes'               => 'Resep rawat jalan poli umum',
                    'user_id'             => $userId,
                    'created_at'          => $rxDate,
                    'updated_at'          => $rxDate,
                ]);

                DB::table('prescription_items')->insert([
                    'prescription_id' => $prescriptionId,
                    'medicine_id'     => $medicineIds[($i + 5) % 10],
                    'quantity'        => 2,
                    'signa'           => $patients[$i]['signa'],
                    'created_at'      => $rxDate,
                    'updated_at'      => $rxDate,
                ]);

                DB::table('prescription_items')->insert([
                    'prescription_id' => $prescriptionId,
                    'medicine_id'     => $medicineIds[$i % 5],
                    'quantity'        => 1,
                    'signa'           => '1 x 1 tablet pagi hari',
                    'created_at'      => $rxDate,
                    'updated_at'      => $rxDate,
                ]);
            }

            // 7. 10 DATA PENJUALAN KASIR (SALES + SALE DETAILS)
            $methods = ['Cash', 'QRIS', 'Transfer', 'Cash', 'QRIS', 'Cash', 'Transfer', 'Cash', 'QRIS', 'Cash'];
            $customers = ['Pelanggan Umum', 'Ahmad Fauzi', 'Siti Nurhaliza', 'Pelanggan Umum', 'Rudi Hartono', 'Pelanggan Umum', 'Cut Nyak Meutia', 'Bambang Pamungkas', 'Pelanggan Umum', 'Intan Permata'];

            $totalCash = 0;
            $totalQris = 0;
            $totalTransfer = 0;

            for ($i = 0; $i < 10; $i++) {
                $qtySold = 2;
                $sellPrice = $medicinesData[$i]['sell'];
                $buyPrice = $medicinesData[$i]['buy'];
                $subtotal = $qtySold * $sellPrice;
                $method = $methods[$i];
                $saleTime = $now->copy()->subMinutes((10 - $i) * 15);

                $cashAmt = $method === 'Cash' ? $subtotal : 0;
                $qrisAmt = $method === 'QRIS' ? $subtotal : 0;
                $tfAmt   = $method === 'Transfer' ? $subtotal : 0;

                $totalCash += $cashAmt;
                $totalQris += $qrisAmt;
                $totalTransfer += $tfAmt;

                $saleId = DB::table('sales')->insertGetId([
                    'invoice_number'   => 'TRX-20261118-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT),
                    'user_id'          => $userId,
                    'cash_register_id' => $cashRegisterId,
                    'sale_date'        => $saleTime,
                    'subtotal_amount'  => $subtotal,
                    'discount_amount'  => 0,
                    'total_amount'     => $subtotal,
                    'paid_amount'      => $subtotal,
                    'change_amount'    => 0,
                    'payment_method'   => $method,
                    'cash_amount'      => $cashAmt,
                    'qris_amount'      => $qrisAmt,
                    'transfer_amount'  => $tfAmt,
                    'customer_name'    => $customers[$i],
                    'status'           => 'completed',
                    'created_at'       => $saleTime,
                    'updated_at'       => $saleTime,
                ]);

                DB::table('sale_details')->insert([
                    'sale_id'        => $saleId,
                    'medicine_id'    => $medicineIds[$i],
                    'batch_number'   => $batchNumbers[$i],
                    'quantity'       => $qtySold,
                    'purchase_price' => $buyPrice,
                    'selling_price'  => $sellPrice,
                    'subtotal'       => $subtotal,
                    'created_at'     => $saleTime,
                    'updated_at'     => $saleTime,
                ]);

                DB::table('product_batches')->where('id', $batchIds[$i])->decrement('stock_quantity', $qtySold);
                DB::table('medicines')->where('id', $medicineIds[$i])->decrement('current_stock', $qtySold);
                DB::table('medicines')->where('id', $medicineIds[$i])->decrement('stock', $qtySold);
            }

            // Sinkronkan saldo shift kasir yang sedang aktif
            if ($cashRegisterId) {
                DB::table('cash_registers')->where('id', $cashRegisterId)->update([
                    'system_cash_amount'     => $totalCash,
                    'system_qris_amount'     => $totalQris,
                    'system_transfer_amount' => $totalTransfer,
                    'updated_at'             => $now,
                ]);
            }
        });
    }
}