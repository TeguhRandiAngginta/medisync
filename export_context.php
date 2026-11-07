<?php

// Menambahkan folder database dan struktur app yang lebih lengkap sesuai screenshot Anda
$directories = [
    'app/Actions',
    'app/Domain',
    'app/Exports',
    'app/Http',
    'app/Models',
    'app/Policies',
    'app/Providers',
    'app/Services',
    'database/migrations',
    'database/seeders',
    'resources/js', // Langsung mengambil seluruh isi frontend React/Inertia
];

$specificFiles = [
    'routes/web.php',
    'routes/api.php',
    'composer.json',
    'package.json',
];

$outputFile = 'medisync_full_context.txt';
$output = "=== MEDISYNC PROJECT FULL CONTEXT ===\n";
$output .= "Date: " . date('Y-m-d H:i:s') . "\n\n";

function appendFileContext(&$output, $filePath) {
    if (file_exists($filePath)) {
        $cleanPath = str_replace('\\', '/', $filePath);
        $output .= "=========================================================\n";
        $output .= "FILE: {$cleanPath}\n";
        $output .= "=========================================================\n";
        $output .= file_get_contents($filePath) . "\n\n";
    }
}

foreach ($specificFiles as $filePath) {
    appendFileContext($output, $filePath);
}

foreach ($directories as $dir) {
    if (!is_dir($dir)) continue;
    
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));
    foreach ($iterator as $file) {
        if ($file->isDir()) continue;
        
        $ext = pathinfo($file->getFilename(), PATHINFO_EXTENSION);
        // Mengambil file PHP, JSX, dan JS saja
        if (in_array($ext, ['php', 'jsx', 'js'])) {
            appendFileContext($output, $file->getPathname());
        }
    }
}

file_put_contents($outputFile, $output);
echo "Ekstraksi Selesai! Seluruh kode telah digabungkan ke file: {$outputFile}\n";