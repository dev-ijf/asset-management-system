<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_contracts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('vendor_name');
            $table->string('contract_number')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->unsignedInteger('sla_response_hours')->nullable();
            $table->unsignedInteger('sla_resolution_hours')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_contracts');
    }
};
