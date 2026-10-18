<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Bukti Penerimaan Barang - {{ $purchase->internal_receipt_number }}</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; font-size: 12px; line-height: 1.4; margin: 0; padding: 20px; }
        .header { width: 100%; border-bottom: 2px solid #48CFA4; padding-bottom: 10px; margin-bottom: 20px; }
        .header table { width: 100%; border-collapse: collapse; }
        .logo-title { font-size: 20px; font-weight: bold; color: #1E3A34; text-transform: uppercase; }
        .sub-title { font-size: 10px; color: #666; }
        .info-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
        .info-table td { padding: 4px 0; vertical-align: top; }
        .items-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .items-table th { background-color: #EBF7F2; color: #1E3A34; font-weight: bold; font-size: 11px; text-transform: uppercase; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .total-section { margin-top: 15px; float: right; width: 300px; }
        .total-table { width: 100%; border-collapse: collapse; }
        .total-table td { padding: 6px; border: 1px solid #ddd; }
        .footer { position: fixed; bottom: 30px; width: 100%; text-align: center; font-size: 10px; color: #888; border-top: 1px solid #eee; padding-top: 10px; }
        .sign-area { margin-top: 60px; width: 100%; }
        .sign-box { width: 30%; float: left; text-align: center; }
    </style>
</head>
<body>

    <div class="header">
        <table>
            <tr>
                <td>
                    <div class="logo-title">MEDISYNC PHARMACY</div>
                    <div class="sub-title">Sistem Manajemen & Inventaris Apotek Terpadu</div>
                </td>
                <td class="text-right">
                    <h3 style="margin: 0; color: #246A55;">BUKTI PENERIMAAN BARANG (BPB)</h3>
                    <div style="font-size: 11px; margin-top: 4px;">Tanggal Cetak: {{ date('d/m/Y H:i') }}</div>
                </td>
            </tr>
        </table>
    </div>

    <table class="info-table">
        <tr>
            <td style="width: 50%;">
                <strong>No. Sistem (Internal):</strong> {{ $purchase->internal_receipt_number }}<br>
                <strong>No. Faktur PBF:</strong> {{ $purchase->invoice_number }}<br>
                <strong>Tanggal Faktur:</strong> {{ $purchase->purchase_date->format('d-m-Y') }}
            </td>
            <td style="width: 50%;">
                <strong>Supplier (PBF):</strong> {{ $purchase->supplier->name ?? '-' }}<br>
                <strong>Telp / Alamat:</strong> {{ $purchase->supplier->phone ?? '-' }} / {{ $purchase->supplier->address ?? '-' }}<br>
                <strong>Penerima (Apoteker):</strong> {{ $purchase->user->name ?? '-' }}
            </td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 5%;" class="text-center">No</th>
                <th style="width: 35%;">Nama Obat</th>
                <th style="width: 15%;">No. Batch</th>
                <th style="width: 12%;">Expired</th>
                <th style="width: 13%;" class="text-center">Jumlah</th>
                <th style="width: 10%;" class="text-right">Harga</th>
                <th style="width: 15%;" class="text-right">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach($purchase->details as $index => $detail)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td><strong>{{ $detail->medicine->name }}</strong><br><span style="font-size: 10px; color: #666;">SKU: {{ $detail->medicine->sku }}</span></td>
                <td>{{ $detail->batch_number }}</td>
                <td>{{ $detail->expired_date->format('d/m/Y') }}</td>
                <td class="text-center">{{ $detail->quantity }}</td>
                <td class="text-right">Rp {{ number_format($detail->purchase_price, 0, ',', '.') }}</td>
                <td class="text-right">Rp {{ number_format($detail->subtotal, 0, ',', '.') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="total-section">
        <table class="total-table">
            <tr>
                <td><strong>Total Tagihan:</strong></td>
                <td class="text-right" style="font-weight: bold; color: #246A55; font-size: 14px;">
                    Rp {{ number_format($purchase->total_amount, 0, ',', '.') }}
                </td>
            </tr>
        </table>
    </div>

    <div style="clear: both;"></div>

    @if($purchase->notes)
    <div style="margin-top: 20px; background: #f9f9f9; padding: 10px; border-radius: 4px;">
        <strong>Catatan:</strong> {{ $purchase->notes }}
    </div>
    @endif

    <div class="sign-area">
        <div class="sign-box">
            <p>Diserahkan Oleh,</p>
            <br><br><br>
            <p><strong>Kurir / PBF</strong></p>
        </div>
        <div class="sign-box" style="margin-left: 35%;">
            <p>Diterima & Dicek Oleh,</p>
            <br><br><br>
            <p><strong>{{ $purchase->user->name ?? 'Apoteker' }}</strong></p>
        </div>
    </div>

    <div class="footer">
        Dokumen ini dicetak secara komputerisasi dari sistem MediSync dan sah sebagai bukti penerimaan barang masuk ke gudang apotek.
    </div>

</body>
</html>