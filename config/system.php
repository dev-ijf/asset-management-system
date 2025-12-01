<?php

return [
    'application' => [
        'name' => env('APP_NAME', 'Asset Management System'),
        'timezone' => env('APP_TIMEZONE', 'Asia/Jakarta'),
        'locale' => env('APP_LOCALE', 'id'),
    ],
    'asset' => [
        'code_prefix' => env('ASSET_CODE_PREFIX', 'AST'),
        'qr_enabled' => env('ASSET_QR_ENABLED', true),
        'warranty_reminder_days' => env('ASSET_WARRANTY_REMINDER_DAYS', 30),
        'depreciation_method' => env('ASSET_DEPRECIATION_METHOD', 'straight_line'),
        'attachment_max_size_mb' => env('ASSET_ATTACHMENT_MAX_SIZE_MB', 20),
    ],
    'ui' => [
        'date_format' => env('SYSTEM_DATE_FORMAT', 'd/m/Y'),
        'time_format' => env('SYSTEM_TIME_FORMAT', 'H:i'),
        'currency' => env('SYSTEM_DEFAULT_CURRENCY', 'IDR'),
        'table_page_size' => env('SYSTEM_TABLE_PAGE_SIZE', 25),
    ],
    'security' => [
        'audit_log' => env('SYSTEM_AUDIT_LOG', true),
    ],
    'notification' => [
        'email_enabled' => env('NOTIFICATION_EMAIL_ENABLED', true),
        'slack_webhook_url' => env('NOTIFICATION_SLACK_WEBHOOK_URL'),
    ],
    'maintenance' => [
        'readonly_mode' => env('MAINTENANCE_READONLY_MODE', false),
        'window' => env('MAINTENANCE_WINDOW'),
    ],
];
