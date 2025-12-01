<?php

namespace Tests\Unit;

use App\Services\Logging\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class ActivityLoggerTest extends TestCase
{
    private string $logPath;

    protected function setUp(): void
    {
        parent::setUp();

        $this->logPath = storage_path('logs/testing-asset.log');

        // Pastikan file log uji bersih agar hasil tidak tercampur.
        if (File::exists($this->logPath)) {
            File::delete($this->logPath);
        }

        config([
            // Gunakan driver single di pengujian supaya nama file tidak berubah harian.
            'logging.channels.asset_activity.driver' => 'single',
            'logging.channels.asset_activity.path' => $this->logPath,
        ]);
    }

    protected function tearDown(): void
    {
        if (File::exists($this->logPath)) {
            File::delete($this->logPath);
        }

        parent::tearDown();
    }

    public function test_it_writes_activity_logs_to_file(): void
    {
        $logger = app(ActivityLogger::class);

        $logger->log('asset.created', ['asset_id' => 42], 'info');
        asset_activity_log('asset.updated', ['asset_id' => 42, 'status' => 'in_use']);

        $this->assertFileExists($this->logPath);

        $content = File::get($this->logPath);

        $this->assertStringContainsString('asset.created', $content);
        $this->assertStringContainsString('"asset_id":42', $content);
        $this->assertStringContainsString('asset.updated', $content);
        $this->assertStringContainsString('"status":"in_use"', $content);
    }

    public function test_it_logs_request_and_response_with_masking(): void
    {
        $logger = app(ActivityLogger::class);

        $request = Request::create('/login', 'POST', [
            'email' => 'user@example.com',
            'password' => 'secret',
        ]);

        $response = new JsonResponse(['message' => 'ok'], 200);

        $logger->logHttp('Fungsi Login', $request, $response, ['note' => 'login controller']);

        $this->assertFileExists($this->logPath);

        $content = File::get($this->logPath);

        $this->assertStringContainsString('Fungsi Login', $content);
        $this->assertStringContainsString('"method":"POST"', $content);
        $this->assertStringContainsString('http://localhost/login', $content);
        $this->assertStringContainsString('"password":"[MASKED]"', $content);
        $this->assertStringContainsString('"status":200', $content);
        $this->assertStringContainsString('"note":"login controller"', $content);
        $this->assertStringNotContainsString('secret', $content);
    }
}
