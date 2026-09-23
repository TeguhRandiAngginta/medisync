<?php

namespace App\Http\Controllers;

use App\Models\Doctor;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DoctorController extends Controller
{
    public function index()
    {
        $doctors = Doctor::latest()->get();
        return Inertia::render('Doctors/Index', ['doctors' => $doctors]);
    }

    public function create()
    {
        return Inertia::render('Doctors/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'specialization' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'hospital_name' => 'nullable|string|max:255',
        ]);

        $validated['is_active'] = true;
        Doctor::create($validated);

        return redirect()->route('doctors.index');
    }
}