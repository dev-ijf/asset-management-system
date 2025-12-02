<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('asset_maintenances', function (Blueprint $table) {
            $table->unsignedInteger('sla_response_hours')->nullable()->after('status');
            $table->unsignedInteger('sla_resolution_hours')->nullable()->after('sla_response_hours');
        });
    }

    public function down(): void
    {
        Schema::table('asset_maintenances', function (Blueprint $table) {
            $table->dropColumn(['sla_response_hours', 'sla_resolution_hours']);
        });
    }
};
