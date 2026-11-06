<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DiagnosticoController extends Controller
{
    public function __invoke(Request $request)
    {
        abort_unless(config('diagnostics.enabled') && app()->environment('local', 'testing')
            && $request->header('X-Psystem-Diagnostics') === '1'
            && config('database.default') === 'pgsql'
            && DB::connection()->getDatabaseName() === 'psystem_diagnostic', 404);

        return response()->json([
            'fixture' => 'psystem-synthetic-v1',
            'database' => DB::selectOne('select current_database() as name')->name,
            'php' => PHP_VERSION, 'laravel' => app()->version(), 'server' => PHP_SAPI,
            'postgres' => DB::selectOne('show server_version')->server_version,
            'timezone' => DB::selectOne('show timezone')->TimeZone,
            'opcache' => (bool) ini_get('opcache.enable'),
            'opcacheCli' => (bool) ini_get('opcache.enable_cli'),
            'counts' => collect(['pacientes', 'matriculas', 'agenda', 'cobrancas', 'pagamentos', 'despesas', 'documentos'])
                ->mapWithKeys(fn ($table) => [$table => DB::table($table)->count()]),
            'attachmentsBytes' => (int) DB::table('documentos')->sum('tamanho'),
        ])->header('Cache-Control', 'no-store');
    }
}
