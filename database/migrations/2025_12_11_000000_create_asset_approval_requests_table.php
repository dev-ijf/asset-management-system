<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_approval_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuidMorphs('approvable');
            $table->string('type'); // movement, disposal, maintenance
            $table->string('status')->default('pending'); // pending, approved, rejected
            $table->unsignedTinyInteger('current_step')->default(1);
            $table->unsignedTinyInteger('required_steps')->default(1);
            $table->uuid('requested_by')->nullable();
            $table->uuid('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->uuid('rejected_by')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->text('decision_notes')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_approval_requests');
    }
};
