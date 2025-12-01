<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('asset_movements', function (Blueprint $table) {
            $table->foreignUuid('from_asset_user_id')->nullable()->after('from_department_id')->constrained('asset_users')->nullOnDelete();
            $table->foreignUuid('to_asset_user_id')->nullable()->after('from_asset_user_id')->constrained('asset_users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('asset_movements', function (Blueprint $table) {
            $table->dropConstrainedForeignId('from_asset_user_id');
            $table->dropConstrainedForeignId('to_asset_user_id');
        });
    }
};
