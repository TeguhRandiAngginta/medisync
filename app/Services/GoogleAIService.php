<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleAIService
{
    public static function generateContent(string $prompt, ?string $base64Image = null, ?string $mimeType = null, ?string $model = null): array
    {
        $apiKey = trim(config('services.google_ai.api_key'));

        if (empty($apiKey)) {
            throw new \Exception('GEMINI_API_KEY belum dikonfigurasi pada file .env');
        }

        $fallbackModels = $model ? [trim($model)] : [
            'gemini-1.5-flash',
            'gemini-1.5-pro', 
            'gemini-2.0-flash' ,
            'gemini-2.5-flash',
            'gemini-3.8-flash'
        ];

        $parts = [];
        if (!empty($base64Image) && !empty($mimeType)) {
            $cleanBase64 = preg_replace('#^data:image/\w+;base64,#i', '', $base64Image);
            $parts[] = [
                'inline_data' => [
                    'mime_type' => $mimeType,
                    'data'      => trim($cleanBase64)
                ]
            ];
        }
        $parts[] = ['text' => $prompt];

        $lastException = null;

        foreach ($fallbackModels as $targetModel) {
            $cleanModel = trim($targetModel);
            $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$cleanModel}:generateContent?key=" . $apiKey;

            try {
                $response = Http::timeout(25)
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

                if ($response->successful()) {
                    $responseData = $response->json();
                    $jsonText = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? '{}';
                    
                    $cleanedText = preg_replace('/```json\s*|\s*```/', '', $jsonText);
                    $decoded = json_decode(trim($cleanedText), true);
                    
                    if (json_last_error() === JSON_ERROR_NONE) {
                        return is_array($decoded) ? $decoded : ['raw_text' => $jsonText];
                    }

                    return ['raw_text' => $jsonText];
                }

                Log::warning("Model [{$cleanModel}] merespons status {$response->status()}. Berpindah...");
                $lastException = new \Exception("Model {$cleanModel} error: " . $response->body());

            } catch (\Exception $e) {
                Log::warning("Koneksi ke model [{$cleanModel}] gagal: " . $e->getMessage());
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