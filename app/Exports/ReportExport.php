<?php

namespace App\Exports;

use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class ReportExport implements FromView, ShouldAutoSize
{
    protected $type;
    protected $data;
    protected $startDate;
    protected $endDate;
    protected $title;

    public function __construct($type, $data, $startDate, $endDate, $title)
    {
        $this->type = $type;
        $this->data = $data;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->title = $title;
    }

    public function view(): View
    {
        return view('reports.print', [
            'type' => $this->type,
            'data' => $this->data,
            'startDate' => $this->startDate,
            'endDate' => $this->endDate,
            'title' => $this->title,
            'isExcel' => true
        ]);
    }
}