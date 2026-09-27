<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // Envio automático pelo WhatsApp. modo: "teste" (só registra, não envia), "evolution" ou "twilio".
    'whatsapp' => [
        'modo' => env('WHATSAPP_MODO', 'teste'),
    ],

    // Evolution API rodando no Docker Compose (serviço "evolution"), conectada ao celular por QR code.
    'evolution' => [
        'url' => env('EVOLUTION_URL', 'http://evolution:8080'),
        'api_key' => env('EVOLUTION_API_KEY'),
        'instancia' => env('EVOLUTION_INSTANCIA', 'psystem'),
        // Pausa entre mensagens: envio rápido demais aumenta o risco de bloqueio do número.
        'intervalo_segundos' => (int) env('EVOLUTION_INTERVALO_SEGUNDOS', 5),
    ],

    'twilio' => [
        'account_sid' => env('TWILIO_ACCOUNT_SID'),
        'auth_token' => env('TWILIO_AUTH_TOKEN'),
        // Remetente: no teste novo da Twilio ("Try out WhatsApp") é o número de teste da conta; no Sandbox antigo, +14155238886.
        'whatsapp_from' => env('TWILIO_WHATSAPP_FROM', 'whatsapp:+14155238886'),
        // Opcional: modelo aprovado para o lembrete (ContentSid "HX..."), usado fora da janela de 24 horas.
        'content_sid_lembrete' => env('TWILIO_CONTENT_SID_LEMBRETE'),
        // O Sandbox aceita uma mensagem a cada 3 segundos.
        'intervalo_segundos' => (int) env('TWILIO_INTERVALO_SEGUNDOS', 3),
    ],
];
