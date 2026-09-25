<?php

use App\Http\Controllers\AgendaController;
use App\Http\Controllers\AnamneseController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ConfiguracaoController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentoController;
use App\Http\Controllers\FinanceiroController;
use App\Http\Controllers\MatriculaController;
use App\Http\Controllers\PacienteController;
use App\Http\Controllers\ProntuarioController;
use App\Http\Controllers\RelatorioController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'create'])->name('login');
    Route::post('/login', [AuthController::class, 'store']);
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'destroy'])->name('logout');

    Route::get('/', DashboardController::class)->name('dashboard');

    Route::get('/agenda', [AgendaController::class, 'index'])->name('agenda');
    Route::post('/agenda', [AgendaController::class, 'store']);
    Route::patch('/agenda/{consulta}/status', [AgendaController::class, 'status']);

    Route::get('/pacientes', [PacienteController::class, 'index'])->name('pacientes');
    Route::post('/pacientes', [PacienteController::class, 'store']);
    Route::get('/pacientes/{paciente}', [PacienteController::class, 'show'])->name('pacientes.show');
    Route::put('/pacientes/{paciente}', [PacienteController::class, 'update']);
    Route::post('/pacientes/{paciente}/foto', [PacienteController::class, 'foto']);

    Route::put('/pacientes/{paciente}/matricula', [MatriculaController::class, 'update']);
    Route::delete('/pacientes/{paciente}/matricula', [MatriculaController::class, 'destroy']);

    Route::put('/pacientes/{paciente}/anamnese', [AnamneseController::class, 'update']);

    Route::post('/pacientes/{paciente}/documentos', [DocumentoController::class, 'store']);
    Route::get('/documentos/{documento}', [DocumentoController::class, 'show'])->name('documentos.show');
    Route::delete('/documentos/{documento}', [DocumentoController::class, 'destroy']);

    Route::get('/prontuarios', [ProntuarioController::class, 'index'])->name('prontuarios');
    Route::post('/pacientes/{paciente}/prontuarios', [ProntuarioController::class, 'store']);
    Route::put('/prontuarios/{prontuario}', [ProntuarioController::class, 'update']);

    Route::get('/financeiro', [FinanceiroController::class, 'index'])->name('financeiro');
    Route::post('/cobrancas', [FinanceiroController::class, 'storeCobranca']);
    Route::post('/cobrancas/{cobranca}/pagamento', [FinanceiroController::class, 'receber']);
    Route::delete('/cobrancas/{cobranca}/pagamento', [FinanceiroController::class, 'estornar']);
    Route::post('/despesas', [FinanceiroController::class, 'storeDespesa']);
    Route::post('/despesas/{despesa}/pagamento', [FinanceiroController::class, 'pagarDespesa']);
    Route::delete('/despesas/{despesa}/pagamento', [FinanceiroController::class, 'estornarDespesa']);

    Route::get('/relatorios', RelatorioController::class)->name('relatorios');

    // Declarações são montadas no front com os dados do paciente; nada é salvo.
    Route::get('/declaracoes', fn () => Inertia::render('Declaracoes/Declaracoes'))->name('declaracoes');

    Route::get('/configuracoes', [ConfiguracaoController::class, 'edit'])->name('configuracoes');
    Route::put('/configuracoes', [ConfiguracaoController::class, 'update']);
    Route::post('/configuracoes/foto', [ConfiguracaoController::class, 'foto']);
});
