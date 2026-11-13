export async function computeImageHash(base64String) {
    const msgBuffer = new TextEncoder().encode(base64String);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function extractPurchaseInvoice(base64String, mimeType) {
    const imageHash = await computeImageHash(base64String);
    const cacheKey = `medisync_pbf_hash_${imageHash}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
        try {
            return {
                data: JSON.parse(cachedData),
                fromCache: true
            };
        } catch (err) {
            localStorage.removeItem(cacheKey);
        }
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("Kunci VITE_GEMINI_API_KEY belum dipasang di file .env!");
    }

    const prompt = `Anda adalah sistem OCR faktur pembelian apotek (PBF). Ekstrak data dari nota faktur terlampir ke dalam format JSON murni tanpa markdown:
    {
        "supplier_name": "nama perusahaan distributor/PBF pengirim faktur (contoh: PT. Anugrah Argon Pratama)",
        "supplier_address": "alamat distributor/PBF jika tertera di nota",
        "invoice_number": "nomor faktur",
        "purchase_date": "YYYY-MM-DD",
        "items": [
            {
                "medicine_name": "nama obat lengkap",
                "batch_number": "nomor batch jika ada atau BATCH-AI",
                "expired_date": "YYYY-MM-DD (jika tidak terbaca isi 1 tahun dari sekarang)",
                "quantity": 10,
                "uom": "Box/Tablet/Strip/Botol",
                "purchase_price": 15000
            }
        ]
    }
    KEMBALIKAN HANYA JSON MENTAH TANPA MARKDOWN.`;

    let parsedData = null;
    let lastErrorMessage = '';
    const activeModels = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-flash-lite-latest'];

    for (const model of activeModels) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            { inlineData: { mimeType, data: base64String } }
                        ]
                    }]
                })
            });

            const aiData = await response.json();

            if (response.ok && aiData.candidates && aiData.candidates[0]?.content) {
                const textRaw = aiData.candidates[0].content.parts[0].text;
                const textClean = textRaw.replace(/```json/g, '').replace(/```/g, '').trim();
                parsedData = JSON.parse(textClean);
                break;
            } else {
                lastErrorMessage = aiData.error?.message || `HTTP ${response.status}`;
            }
        } catch (err) {
            lastErrorMessage = err.message;
        }
    }

    if (!parsedData) {
        throw new Error(lastErrorMessage || "Gagal terhubung ke server AI.");
    }

    localStorage.setItem(cacheKey, JSON.stringify(parsedData));

    return {
        data: parsedData,
        fromCache: false
    };
}

export async function generateInvoiceSummaryNote({ supplierText, invoiceText, purchaseDate, itemSummaries, totalFormatted }) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
        const prompt = `Buatkan catatan penerimaan barang faktur apotek yang singkat, profesional, dan terstruktur dalam Bahasa Indonesia berdasarkan data berikut:
        - Supplier: ${supplierText}
        - No. Faktur: ${invoiceText}
        - Tanggal: ${purchaseDate}
        - Daftar Obat Disuplai:
        ${itemSummaries.join('\n')}
        - Total Nilai: ${totalFormatted}
        
        Tulis langsung isi catatannya dalam bentuk poin ringkas tanpa kalimat pembuka/penutup berbasa-basi.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const aiData = await response.json();
        if (response.ok && aiData.candidates?.[0]?.content?.parts?.[0]?.text) {
            return aiData.candidates[0].content.parts[0].text.trim();
        }
    }

    return `Penerimaan barang dari ${supplierText} (Faktur: ${invoiceText}):\n` + itemSummaries.join('\n');
}