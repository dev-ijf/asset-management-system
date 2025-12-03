<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->timestamp('archived_at')->nullable()->after('updated_at');
            $table->uuid('archived_by')->nullable()->after('archived_at');
            $table->date('retention_until')->nullable()->after('archived_by');
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn(['archived_at','archived_by','retention_until']);
        });
    }
};
