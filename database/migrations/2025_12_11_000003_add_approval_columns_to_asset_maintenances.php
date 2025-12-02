<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('asset_maintenances', function (Blueprint $table) {
            // status sudah ada di tabel ini, jadi hanya tambahkan kolom approval.
            if (!Schema::hasColumn('asset_maintenances', 'requested_by')) {
                $table->uuid('requested_by')->nullable()->after('status');
            }
            if (!Schema::hasColumn('asset_maintenances', 'approved_by')) {
                $table->uuid('approved_by')->nullable()->after('requested_by');
            }
            if (!Schema::hasColumn('asset_maintenances', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('approved_by');
            }
            if (!Schema::hasColumn('asset_maintenances', 'rejected_by')) {
                $table->uuid('rejected_by')->nullable()->after('approved_at');
            }
            if (!Schema::hasColumn('asset_maintenances', 'rejected_at')) {
                $table->timestamp('rejected_at')->nullable()->after('rejected_by');
            }
            if (!Schema::hasColumn('asset_maintenances', 'decision_notes')) {
                $table->text('decision_notes')->nullable()->after('rejected_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('asset_maintenances', function (Blueprint $table) {
            $table->dropColumn(['requested_by','approved_by','approved_at','rejected_by','rejected_at','decision_notes']);
        });
    }
};
