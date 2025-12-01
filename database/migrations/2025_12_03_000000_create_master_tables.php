<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_statuses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('description')->nullable();
            $table->timestamps();
        });

        Schema::create('asset_classes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('description')->nullable();
            $table->timestamps();
        });

        Schema::create('units', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('symbol', 20)->unique();
            $table->string('description')->nullable();
            $table->timestamps();
        });

        Schema::create('departments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('description')->nullable();
            $table->timestamps();
        });

        Schema::create('person_in_charges', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('asset_users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone', 30)->nullable();
            $table->foreignUuid('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->string('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('asset_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('description')->nullable();
            $table->foreignUuid('parent_id')->nullable()->constrained('asset_categories')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('asset_locations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('description')->nullable();
            $table->foreignUuid('parent_id')->nullable()->constrained('asset_locations')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('warranties', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->unsignedInteger('duration_months')->default(12);
            $table->string('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('assets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('serial_number')->nullable();
            $table->text('description')->nullable();
            $table->foreignUuid('asset_status_id')->nullable()->constrained('asset_statuses')->nullOnDelete();
            $table->foreignUuid('asset_class_id')->nullable()->constrained('asset_classes')->nullOnDelete();
            $table->foreignUuid('asset_category_id')->nullable()->constrained('asset_categories')->nullOnDelete();
            $table->foreignUuid('unit_id')->nullable()->constrained('units')->nullOnDelete();
            $table->foreignUuid('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->foreignUuid('person_in_charge_id')->nullable()->constrained('person_in_charges')->nullOnDelete();
            $table->foreignUuid('asset_user_id')->nullable()->constrained('asset_users')->nullOnDelete();
            $table->foreignUuid('asset_location_id')->nullable()->constrained('asset_locations')->nullOnDelete();
            $table->foreignUuid('warranty_id')->nullable()->constrained('warranties')->nullOnDelete();
            $table->date('purchase_date')->nullable();
            $table->date('warranty_end')->nullable();
            $table->decimal('cost', 15, 2)->nullable();
            $table->string('qr_token')->unique();
            $table->string('qr_path')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('asset_histories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->string('action');
            $table->text('description')->nullable();
            $table->uuid('changed_by')->nullable();
            $table->json('payload')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_histories');
        Schema::dropIfExists('assets');
        Schema::dropIfExists('warranties');
        Schema::dropIfExists('asset_locations');
        Schema::dropIfExists('asset_categories');
        Schema::dropIfExists('asset_users');
        Schema::dropIfExists('person_in_charges');
        Schema::dropIfExists('departments');
        Schema::dropIfExists('units');
        Schema::dropIfExists('asset_classes');
        Schema::dropIfExists('asset_statuses');
    }
};
