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

        Schema::create('people_in_charge', function (Blueprint $table) {
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
    }

    public function down(): void
    {
        Schema::dropIfExists('warranties');
        Schema::dropIfExists('asset_locations');
        Schema::dropIfExists('asset_categories');
        Schema::dropIfExists('asset_users');
        Schema::dropIfExists('people_in_charge');
        Schema::dropIfExists('departments');
        Schema::dropIfExists('units');
        Schema::dropIfExists('asset_classes');
        Schema::dropIfExists('asset_statuses');
    }
};
