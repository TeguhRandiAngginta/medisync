<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class PatientController extends Controller
{
    public function index()
    {
        $patients = Patient::latest()->get();
        return Inertia::render('Patients/Index', ['patients' => $patients]);
    }

    public function create()
    {
        return Inertia::render('Patients/Create');
    }

    public function store(Request $request)
    {
        // Validasi input
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|in:L,P',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'allergies' => 'nullable|string',
        ]);

        // Generate Nomor RM Otomatis (Contoh: RM-2609-ABCD)
        $validated['patient_number'] = 'RM-' . date('ym') . '-' . strtoupper(Str::random(4));
        $validated['is_active'] = true;

        Patient::create($validated);

        return redirect()->route('patients.index');
    }
}