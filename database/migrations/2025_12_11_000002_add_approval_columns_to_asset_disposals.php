<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('asset_disposals', function (Blueprint $table) {
            $table->string('status')->default('approved')->after('reversed_notes');
            $table->uuid('requested_by')->nullable()->after('status');
            $table->uuid('approved_by')->nullable()->after('requested_by');
            $table->timestamp('approved_at')->nullable()->after('approved_by');
            $table->uuid('rejected_by')->nullable()->after('approved_at');
            $table->timestamp('rejected_at')->nullable()->after('rejected_by');
            $table->text('decision_notes')->nullable()->after('rejected_at');
        });
    }

    public function down(): void
    {
        Schema::table('asset_disposals', function (Blueprint $table) {
            $table->dropColumn(['status','requested_by','approved_by','approved_at','rejected_by','rejected_at','decision_notes']);
        });
    }
};
