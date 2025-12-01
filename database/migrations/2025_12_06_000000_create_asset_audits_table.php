<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_audits', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->string('status')->default('matched'); // matched, missing, damaged
            $table->text('notes')->nullable();
            $table->uuid('audited_by')->nullable();
            $table->timestamp('audited_at')->nullable();
            $table->foreignUuid('location_id')->nullable()->constrained('asset_locations')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_audits');
    }
};
