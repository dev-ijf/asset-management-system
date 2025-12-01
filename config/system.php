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
    ],
    'ui' => [
        'date_format' => env('SYSTEM_DATE_FORMAT', 'd/m/Y'),
        'time_format' => env('SYSTEM_TIME_FORMAT', 'H:i'),
        'currency' => env('SYSTEM_DEFAULT_CURRENCY', 'IDR'),
    ],
    'security' => [
        'audit_log' => env('SYSTEM_AUDIT_LOG', true),
    ],
];
