<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignUuid('department_id')->nullable()->after('password')->constrained('departments')->nullOnDelete();
            $table->foreignUuid('asset_location_id')->nullable()->after('department_id')->constrained('asset_locations')->nullOnDelete();
            $table->boolean('two_factor_enabled')->default(false)->after('asset_location_id');
            $table->string('two_factor_secret')->nullable()->after('two_factor_enabled');
            $table->json('two_factor_recovery_codes')->nullable()->after('two_factor_secret');
            $table->timestamp('two_factor_confirmed_at')->nullable()->after('two_factor_recovery_codes');
            $table->timestamp('last_active_at')->nullable()->after('two_factor_confirmed_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
            $table->dropForeign(['asset_location_id']);
            $table->dropColumn([
                'department_id',
                'asset_location_id',
                'two_factor_enabled',
                'two_factor_secret',
                'two_factor_recovery_codes',
                'two_factor_confirmed_at',
                'last_active_at',
            ]);
        });
    }
};
