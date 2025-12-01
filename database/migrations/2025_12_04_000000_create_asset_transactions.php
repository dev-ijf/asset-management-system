<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_movements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->foreignUuid('from_location_id')->nullable()->constrained('asset_locations')->nullOnDelete();
            $table->foreignUuid('to_location_id')->nullable()->constrained('asset_locations')->nullOnDelete();
            $table->foreignUuid('from_department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->foreignUuid('to_department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->uuid('moved_by')->nullable();
            $table->timestamp('performed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('asset_disposals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->string('reason')->nullable();
            $table->text('notes')->nullable();
            $table->uuid('disposed_by')->nullable();
            $table->timestamp('disposed_at')->nullable();
            $table->foreignUuid('previous_status_id')->nullable()->constrained('asset_statuses')->nullOnDelete();
            $table->foreignUuid('previous_location_id')->nullable()->constrained('asset_locations')->nullOnDelete();
            $table->foreignUuid('previous_department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->timestamp('reversed_at')->nullable();
            $table->uuid('reversed_by')->nullable();
            $table->text('reversed_notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_disposals');
        Schema::dropIfExists('asset_movements');
    }
};
