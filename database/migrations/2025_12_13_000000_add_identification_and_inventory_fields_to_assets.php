<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->string('rfid_tag')->nullable()->unique()->after('qr_path');
            $table->string('nfc_tag')->nullable()->unique()->after('rfid_tag');
            $table->string('label_template')->nullable()->after('nfc_tag');
            $table->boolean('is_consumable')->default(false)->after('label_template');
            $table->unsignedInteger('quantity')->default(1)->after('is_consumable');
            $table->unsignedInteger('available_quantity')->nullable()->after('quantity');
            $table->boolean('is_pool')->default(false)->after('available_quantity');
        });
    }

    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->dropColumn([
                'rfid_tag',
                'nfc_tag',
                'label_template',
                'is_consumable',
                'quantity',
                'available_quantity',
                'is_pool',
            ]);
        });
    }
};
