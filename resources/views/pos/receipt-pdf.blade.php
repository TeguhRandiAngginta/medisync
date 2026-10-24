<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Struk - {{ $sale->invoice_number }}</title>
    <style>
        body { font-family: 'Courier New', Courier, monospace; width: 58mm; margin: 0; padding: 5px; color: #000; font-size: 11px; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
        .line { border-bottom: 1px dashed #000; margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        th, td { padding: 2px 0; }
    </style>
</head>
<body onload="window.print()">
    <div class="text-center">
        <div class="bold" style="font-size: 14px;">APOTEK MEDISYNC</div>
        <div>Jl. Kesehatan No. 10, Kota Anda</div>
        <div>Telp: 0812-3456-7890</div>
    </div>
    
    <div class="line"></div>
    
    <div>
        <div>No. Nota : {{ $sale->invoice_number }}</div>
        <div>Tanggal : {{ $sale->sale_date }}</div>
        <div>Kasir    : {{ $sale->user->name ?? 'Admin' }}</div>
        <div>Metode  : {{ strtoupper($sale->payment_method) }}</div>
    </div>
    
    <div class="line"></div>
    
    <table>
        @foreach($sale->details as $item)
        <tr>
            <td colspan="2" class="bold">{{ $item->medicine->name }}</td>
        </tr>
        <tr>
            <td>{{ $item->quantity }} x {{ number_format($item->selling_price, 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($item->subtotal, 0, ',', '.') }}</td>
        </tr>
        @endforeach
    </table>
    
    <div class="line"></div>
    
    <table>
        <tr>
            <td class="bold">Total Tagihan</td>
            <td class="text-right bold">Rp {{ number_format($sale->total_amount, 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td>Dibayar</td>
            <td class="text-right">Rp {{ number_format($sale->paid_amount, 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td>Kembalian</td>
            <td class="text-right">Rp {{ number_format($sale->change_amount, 0, ',', '.') }}</td>
        </tr>
    </table>
    
    <div class="line"></div>
    
    <div class="text-center">
        <div>TERIMA KASIH</div>
        <div>LEKAS SEMBUH KEMBALI</div>
    </div>
</body>
</html>