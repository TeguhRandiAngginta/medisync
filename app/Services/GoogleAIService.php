<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleAIService
{
    /**
     * Mengirim konten ke Google AI Studio dengan sistem Automatic Fallback kilat.
     */
    public static function generateContent(string $prompt, ?string $base64Image = null, ?string $mimeType = null, ?string $model = null): array
    {
        $apiKey = config('services.google_ai.api_key');

        if (empty($apiKey)) {
            throw new \Exception('GEMINI_API_KEY belum dikonfigurasi pada file .env');
        }

        // Gunakan nama model resmi yang valid dan didukung oleh Google AI Studio API
        $fallbackModels = $model ? [$model] : [
            'gemini-1.5-flash', // Model paling stabil, cepat, dan akurat untuk OCR gambar
            'gemini-1.5-pro',   // Cadangan tingkat lanjut
            'gemini-2.0-flash'  // Cadangan alternatif terbaru jika ada
        ];

        $parts = [];
        if (!empty($base64Image) && !empty($mimeType)) {
            $parts[] = [
                'inline_data' => [
                    'mime_type' => $mimeType,
                    'data'      => $base64Image
                ]
            ];
        }
        $parts[] = ['text' => $prompt];

        $lastException = null;

        foreach ($fallbackModels as $targetModel) {
            $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$targetModel}:generateContent?key=" . $apiKey;

            try {
                $response = Http::timeout(15)
                    ->withHeaders(['Content-Type' => 'application/json'])
                    ->post($endpoint, [
                        'contents' => [
                            [
                                'parts' => $parts
                            ]
                        ],
                        'generationConfig' => [
                            'responseMimeType' => 'application/json'
                        ]
                    ]);

                // Jika sukses (2xx), langsung kembalikan hasil
                if ($response->successful()) {
                    $responseData = $response->json();
                    $jsonText = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? '{}';
                    
                    return json_decode($jsonText, true) ?? ['raw_text' => $jsonText];
                }

                Log::warning("Model [{$targetModel}] merespons status {$response->status()}. Berpindah ke model cadangan...");
                $lastException = new \Exception("Model {$targetModel} error: " . $response->body());

            } catch (\Exception $e) {
                Log::warning("Koneksi ke model [{$targetModel}] gagal/timeout. Berpindah...");
                $lastException = $e;
            }
        }

        throw new \Exception("Semua model Gemini gagal merespons. Error: " . ($lastException ? $lastException->getMessage() : 'Unknown error'));
    }

    public static function analyzePrescriptionImage(string $base64Image, string $mimeType, string $prompt): array
    {
        return self::generateContent($prompt, $base64Image, $mimeType);
    }
}