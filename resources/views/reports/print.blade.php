@if(isset($isExcel) && $isExcel)
    <!-- TAMPILAN KHUSUS EXCEL -->
    <table>
        <thead>
            <tr><th colspan="5" style="font-weight: bold; font-size: 14px;">APOTEK MEDISYNC - {{ strtoupper($title) }}</th></tr>
            <tr><th colspan="5">Periode: {{ $startDate }} s/d {{ $endDate }}</th></tr>
            <tr><th colspan="5"></th></tr>
            <tr>
                @if($type === 'sales')
                    <th><b>Waktu</b></th><th><b>No. Invoice</b></th><th><b>Kasir</b></th><th><b>Metode</b></th><th><b>Total Transaksi</b></th>
                @elseif($type === 'purchase')
                    <th><b>Tanggal Beli</b></th><th><b>No. Faktur</b></th><th><b>Supplier</b></th><th><b>Apoteker</b></th><th><b>Total Pembelian</b></th>
                @elseif($type === 'profit')
                    <th><b>Waktu</b></th><th><b>No. Invoice</b></th><th><b>Omzet</b></th><th><b>HPP</b></th><th><b>Laba Bersih</b></th>
                @elseif($type === 'stock')
                    <th><b>SKU / Kode</b></th><th><b>Nama Obat</b></th><th><b>Kategori</b></th><th><b>Stok Tersisa</b></th><th><b>Batas Minimum</b></th>
                @endif
            </tr>
        </thead>
        <tbody>
            @forelse($data as $item)
                <tr>
                    @if($type === 'sales')
                        <td>{{ $item->sale_date }}</td><td>{{ $item->invoice_number }}</td><td>{{ $item->user->name ?? '-' }}</td><td>{{ strtoupper($item->payment_method) }}</td><td>{{ $item->total_amount }}</td>
                    @elseif($type === 'purchase')
                        <td>{{ $item->purchase_date }}</td><td>{{ $item->invoice_number }}</td><td>{{ $item->supplier->name ?? '-' }}</td><td>{{ $item->user->name ?? '-' }}</td><td>{{ $item->total_amount }}</td>
                    @elseif($type === 'profit')
                        @php
                            $hpp = 0;
                            foreach($item->details as $detail) { $hpp += ($detail->quantity * ($detail->medicine->selling_price * 0.7)); }
                        @endphp
                        <td>{{ $item->sale_date }}</td><td>{{ $item->invoice_number }}</td><td>{{ $item->total_amount }}</td><td>{{ $hpp }}</td><td>{{ $item->total_amount - $hpp }}</td>
                    @elseif($type === 'stock')
                        <td>{{ $item->sku }}</td><td>{{ $item->name }}</td><td>{{ $item->category->name ?? '-' }}</td><td>{{ $item->current_stock }}</td><td>{{ $item->min_stock }}</td>
                    @endif
                </tr>
            @empty
                <tr><td colspan="5">Tidak ada data.</td></tr>
            @endforelse
        </tbody>
    </table>
@else
    <!-- TAMPILAN KHUSUS CETAK/PDF -->
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <title>{{ $title }}</title>
        <style>
            @page { size: A4 portrait; margin: 0; }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #333; margin: 0; padding: 25mm 20mm; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #246A55; padding-bottom: 15px; margin-bottom: 25px; }
            .header-left { display: flex; align-items: center; gap: 15px; }
            .logo-container { width: 50px; height: 50px; background: #EAF5F0; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
            .logo-container svg { width: 30px; height: 30px; color: #246A55; }
            .brand-info { display: flex; flex-direction: column; }
            .app-name { font-size: 24px; font-weight: 800; color: #1E272E; letter-spacing: 0.5px; margin-bottom: 2px;}
            .app-address { font-size: 11px; color: #666; }
            .header-right { text-align: right; }
            .report-title { font-size: 16px; font-weight: 800; color: #246A55; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
            .report-period { font-size: 11px; color: #555; background: #f4f6f8; padding: 4px 10px; border-radius: 20px; display: inline-block; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
            th, td { border: 1px solid #e0e0e0; padding: 12px 10px; text-align: left; }
            th { background-color: #246A55; color: white; font-weight: bold; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
            tr:nth-child(even) { background-color: #fafafa; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .text-red { color: #dc2626; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; font-size: 10px; color: #666; border-top: 1px dashed #ccc; padding-top: 15px; }
        </style>
    </head>
    <body onload="window.print()">
        <div class="header">
            <div class="header-left">
                <div class="logo-container">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 2a2 2 0 014 0v4h4a2 2 0 110 4h-4v4a2 2 0 11-4 0v-4H6a2 2 0 110-4h4V2z"></path></svg>
                </div>
                <div class="brand-info">
                    <div class="app-name">APOTEK MEDISYNC</div>
                    <div class="app-address">Sistem Informasi Manajemen Apotek & Kasir</div>
                </div>
            </div>
            <div class="header-right">
                <div class="report-title">{{ $title }}</div>
                @if($type !== 'stock')
                    <div class="report-period">Periode: {{ $startDate }} s/d {{ $endDate }}</div>
                @endif
            </div>
        </div>
        <table>
            <thead>
                <tr>
                    @if($type === 'sales')
                        <th>Waktu</th><th>No. Invoice</th><th>Kasir</th><th>Metode</th><th class="text-right">Total Transaksi</th>
                    @elseif($type === 'purchase')
                        <th>Tanggal Beli</th><th>No. Faktur</th><th>Supplier</th><th>Apoteker</th><th class="text-right">Total Pembelian</th>
                    @elseif($type === 'profit')
                        <th>Waktu</th><th>No. Invoice</th><th class="text-right">Omzet</th><th class="text-right">HPP</th><th class="text-right">Laba Bersih</th>
                    @elseif($type === 'stock')
                        <th>SKU / Kode</th><th>Nama Obat</th><th>Kategori</th><th class="text-center">Stok Tersisa</th><th class="text-center">Batas Minimum</th>
                    @endif
                </tr>
            </thead>
            <tbody>
                @forelse($data as $item)
                    <tr>
                        @if($type === 'sales')
                            <td>{{ $item->sale_date }}</td><td class="font-bold">{{ $item->invoice_number }}</td><td>{{ $item->user->name ?? '-' }}</td><td>{{ strtoupper($item->payment_method) }}</td><td class="text-right font-bold">Rp {{ number_format($item->total_amount, 0, ',', '.') }}</td>
                        @elseif($type === 'purchase')
                            <td>{{ $item->purchase_date }}</td><td class="font-bold">{{ $item->invoice_number }}</td><td>{{ $item->supplier->name ?? '-' }}</td><td>{{ $item->user->name ?? '-' }}</td><td class="text-right font-bold">Rp {{ number_format($item->total_amount, 0, ',', '.') }}</td>
                        @elseif($type === 'profit')
                            @php
                                $hpp = 0;
                                foreach($item->details as $detail) { $hpp += ($detail->quantity * ($detail->medicine->selling_price * 0.7)); }
                                $laba = $item->total_amount - $hpp;
                            @endphp
                            <td>{{ $item->sale_date }}</td><td class="font-bold">{{ $item->invoice_number }}</td><td class="text-right">Rp {{ number_format($item->total_amount, 0, ',', '.') }}</td><td class="text-right">Rp {{ number_format($hpp, 0, ',', '.') }}</td><td class="text-right font-bold">Rp {{ number_format($laba, 0, ',', '.') }}</td>
                        @elseif($type === 'stock')
                            <td class="font-bold">{{ $item->sku }}</td><td>{{ $item->name }}</td><td>{{ $item->category->name ?? '-' }}</td><td class="text-center font-bold text-red">{{ $item->current_stock ?? 0 }} {{ $item->base_unit }}</td><td class="text-center">{{ $item->min_stock }} {{ $item->base_unit }}</td>
                        @endif
                    </tr>
                @empty
                    <tr><td colspan="5" class="text-center" style="padding: 20px;">Tidak ada data pada periode/jenis laporan ini.</td></tr>
                @endforelse
            </tbody>
        </table>
        <div class="footer">
            <div>Digenerate otomatis oleh Sistem Medisync</div>
            <div>Dicetak pada: {{ \Carbon\Carbon::now()->format('d M Y H:i') }} WIB</div>
        </div>
    </body>
    </html>
@endif