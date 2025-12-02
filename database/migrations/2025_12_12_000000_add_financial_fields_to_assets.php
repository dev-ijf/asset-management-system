<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->string('depreciation_method')->default('straight_line')->after('cost');
            $table->unsignedInteger('useful_life_months')->nullable()->after('depreciation_method');
            $table->decimal('residual_value', 15, 2)->nullable()->after('useful_life_months');
            $table->string('capex_opex')->nullable()->after('residual_value'); // capex|opex
            $table->uuid('vendor_contract_id')->nullable()->after('capex_opex'); // FK opsional, tambahkan manual jika perlu
            $table->timestamp('warranty_reminder_sent_at')->nullable()->after('warranty_end');
        });
    }

    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->dropColumn([
                'depreciation_method',
                'useful_life_months',
                'residual_value',
                'capex_opex',
                'vendor_contract_id',
                'warranty_reminder_sent_at',
            ]);
        });
    }
};
