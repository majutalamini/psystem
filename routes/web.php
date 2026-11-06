<?php

use App\Http\Controllers\AgendaController;
use App\Http\Controllers\AnamneseController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ConfiguracaoController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DiagnosticoController;
use App\Http\Controllers\DocumentoController;
use App\Http\Controllers\FinanceiroController;
use App\Http\Controllers\FotoController;
use App\Http\Controllers\ImportacaoController;
use App\Http\Controllers\MatriculaController;
use App\Http\Controllers\PacienteController;
use App\Http\Controllers\ProntidaoController;
use App\Http\Controllers\ProntuarioController;
use App\Http\Controllers\RelatorioController;
use App\Http\Controllers\SenhaController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Identifica o laboratório sintético antes de qualquer captura; indisponível no consultório/produção.
Route::get('/__diagnostico', DiagnosticoController::class);

// Monitor externo (etapa 4): só ok/falha por verificação.
Route::get('/prontidao', ProntidaoController::class)->middleware('throttle:30,1');

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'create'])->name('login');
    Route::post('/login', [AuthController::class, 'store']);

    Route::get('/esqueci-senha', [SenhaController::class, 'pedir'])->name('password.request');
    Route::post('/esqueci-senha', [SenhaController::class, 'enviarLink'])->middleware('throttle:5,1');
    Route::get('/redefinir-senha/{token}', [SenhaController::class, 'formulario'])->name('password.reset');
    Route::post('/redefinir-senha', [SenhaController::class, 'redefinir']);
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'destroy'])->name('logout');

    Route::get('/', DashboardController::class)->name('dashboard');

    Route::get('/agenda', [AgendaController::class, 'index'])->name('agenda');
    Route::post('/agenda', [AgendaController::class, 'store']);
    Route::patch('/agenda/{consulta}/status', [AgendaController::class, 'status']);

    Route::get('/pacientes', [PacienteController::class, 'index'])->name('pacientes');
    Route::post('/pacientes', [PacienteController::class, 'store']);
    Route::get('/pacientes/opcoes', [PacienteController::class, 'opcoes'])->name('pacientes.opcoes');
    Route::get('/pacientes/{paciente}', [PacienteController::class, 'show'])->name('pacientes.show');
    Route::put('/pacientes/{paciente}', [PacienteController::class, 'update']);
    Route::delete('/pacientes/{paciente}', [PacienteController::class, 'destroy']);
    Route::post('/pacientes/{paciente}/inativar', [PacienteController::class, 'inativar']);
    Route::post('/pacientes/{paciente}/foto', [PacienteController::class, 'foto']);
    Route::get('/pacientes/{paciente}/foto', [FotoController::class, 'paciente'])->name('pacientes.foto');
    Route::get('/psicologos/{psicologo}/foto', [FotoController::class, 'psicologo'])->name('psicologos.foto');
    Route::patch('/pacientes/{paciente}/vencimento', [PacienteController::class, 'vencimento']);

    Route::post('/pacientes/{paciente}/matriculas', [MatriculaController::class, 'store']);
    Route::put('/matriculas/{matricula}', [MatriculaController::class, 'update']);
    Route::delete('/matriculas/{matricula}', [MatriculaController::class, 'destroy']);

    Route::post('/pacientes/{paciente}/anamneses', [AnamneseController::class, 'store']);
    Route::put('/anamneses/{anamnese}', [AnamneseController::class, 'update']);
    Route::delete('/anamneses/{anamnese}', [AnamneseController::class, 'destroy']);

    Route::post('/pacientes/{paciente}/documentos', [DocumentoController::class, 'store']);
    Route::get('/documentos/{documento}', [DocumentoController::class, 'show'])->name('documentos.show');
    Route::delete('/documentos/{documento}', [DocumentoController::class, 'destroy']);

    Route::get('/prontuarios', [ProntuarioController::class, 'index'])->name('prontuarios');
    Route::get('/anamneses', [AnamneseController::class, 'index'])->name('anamneses');
    Route::get('/importacoes', [ImportacaoController::class, 'index'])->name('importacoes');
    Route::post('/importacoes', [ImportacaoController::class, 'store']);
    Route::post('/pacientes/{paciente}/prontuarios', [ProntuarioController::class, 'store']);
    Route::put('/prontuarios/{prontuario}', [ProntuarioController::class, 'update']);
    Route::delete('/prontuarios/{prontuario}', [ProntuarioController::class, 'destroy']);

    Route::get('/financeiro', [FinanceiroController::class, 'index'])->name('financeiro');
    Route::post('/cobrancas', [FinanceiroController::class, 'storeCobranca']);
    Route::patch('/cobrancas/{cobranca}', [FinanceiroController::class, 'atualizarCobranca']);
    Route::delete('/cobrancas/{cobranca}', [FinanceiroController::class, 'cancelarCobranca']);
    Route::post('/cobrancas/{cobranca}/pagamento', [FinanceiroController::class, 'receber']);
    Route::post('/cobrancas/{cobranca}/pagamentos/{pagamento}/estorno', [FinanceiroController::class, 'estornar'])->whereNumber('pagamento');
    Route::post('/despesas', [FinanceiroController::class, 'storeDespesa']);
    Route::put('/despesas/{despesa}', [FinanceiroController::class, 'atualizarDespesa']);
    Route::delete('/despesas/{despesa}', [FinanceiroController::class, 'cancelarDespesa']);
    Route::delete('/despesas/{despesa}/recorrencia', [FinanceiroController::class, 'encerrarRecorrencia']);
    Route::post('/despesas/{despesa}/pagamento', [FinanceiroController::class, 'pagarDespesa']);
    Route::post('/despesas/{despesa}/pagamentos/{pagamento}/estorno', [FinanceiroController::class, 'estornarDespesa'])->whereNumber('pagamento');
    Route::patch('/cobrancas/{cobranca}/cancelar', [FinanceiroController::class, 'cancelar']);

    Route::get('/relatorios', RelatorioController::class)->name('relatorios');

    // Declarações são montadas no front com os dados do paciente; nada é salvo.
    Route::get('/declaracoes', fn () => Inertia::render('Declaracoes/Declaracoes'))->name('declaracoes');

    Route::get('/configuracoes', [ConfiguracaoController::class, 'edit'])->name('configuracoes');
    Route::put('/configuracoes', [ConfiguracaoController::class, 'update']);
    Route::post('/configuracoes/foto', [ConfiguracaoController::class, 'foto']);
});
