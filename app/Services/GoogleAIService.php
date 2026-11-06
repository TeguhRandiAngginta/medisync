<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleAIService
{
    /**
     * 
     * 
     * @param string $prompt
     * @param string|null $base64Image
     * @param string|null $mimeType
     * @param string|null $model (Opsional: 'gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-2.5-pro', dll.)
     * @return array
     */
    public static function generateContent(string $prompt, ?string $base64Image = null, ?string $mimeType = null, ?string $model = null): array
    {
        $apiKey = config('services.google_ai.api_key');
        $targetModel =$model ?? config('services.google_ai.default_model', 'gemini-2.5-flash');

        if (empty($apiKey)) {
            throw new \Exception('GEMINI_API_KEY belum dikonfigurasi pada file .env');
        }

        $parts = [['text' =>$prompt]];

        if ($base64Image && $mimeType) {$parts[] = [
                'inline_data' => [
                    'mime_type' => $mimeType,
                    'data'      => $base64Image
                ]
            ];
        }

        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$targetModel}:generateContent?key={$apiKey}";

        $response = Http::timeout(60)
            ->withHeaders(['Content-Type' => 'application/json'])
            ->post($endpoint, [
                'contents' => [
                    [
                        'parts' => $parts
                    ]
                ]
            ]);

        if ($response->failed()) {
            Log::error("Google AI Studio ({$targetModel}) Error: " . $response->body());
            throw new \Exception("Gagal menghubungi Google AI Studio API [Model: {$targetModel}].");
        }

        $responseData =$response->json();
        $textRaw =$responseData['candidates'][0]['content']['parts'][0]['text'] ?? '{}';

        $textClean = preg_replace('/^```(?:json)?\s*|\s*```$/i', '', trim($textRaw));

        return json_decode($textClean, true) ?? ['raw_text' => $textClean];
    }
}