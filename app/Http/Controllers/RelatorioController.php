<?php

namespace App\Http\Controllers;

use App\Models\AnamneseResposta;
use App\Models\Configuracao;
use App\Models\Consulta;
use App\Models\Despesa;
use App\Models\Matricula;
use App\Models\Prontuario;
use App\Support\Tela;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

/**
 * Os relatórios são filtrados no front (volume de um consultório); aqui só entregamos os dados.
 */
class RelatorioController extends Controller
{
    /** Rótulos usados pelos relatórios de agenda. */
    private const STATUS_SESSAO = [
        'agendado' => 'Agendada',
        'confirmado' => 'Agendada',
        'realizado' => 'Realizada',
        'falta' => 'Falta',
        'cancelado' => 'Cancelada',
    ];

    public function __invoke()
    {
        $inicioSemana = today()->startOfWeek(Carbon::MONDAY);
        $horarios = count(Configuracao::atual()->horarios());
        $semana = Consulta::whereBetween('data_hora_consulta', [$inicioSemana, $inicioSemana->copy()->endOfWeek(Carbon::SUNDAY)])
            ->where('status', '!=', 'cancelado')
            ->get();

        return Inertia::render('Relatorios/Relatorios', [
            'receivables' => FinanceiroController::cobrancas(),
            'payables' => Despesa::orderByDesc('vencimento')->get()->map->paraTela(),
            'sessions' => Consulta::with('paciente')->orderBy('data_hora_consulta')->get()->map(fn ($c) => [
                'id' => $c->id,
                'paciente' => $c->paciente->nome,
                'data' => Tela::data($c->data_hora_consulta),
                'status' => self::STATUS_SESSAO[$c->status],
            ]),
            'anamneses' => AnamneseResposta::selectRaw('paciente_id, max(data_preenchimento) as preenchido')
                ->groupBy('paciente_id')
                ->get()
                ->mapWithKeys(fn ($r) => [$r->paciente_id => [['preenchidoEm' => Tela::data(Carbon::parse($r->preenchido))]]]),
            'records' => Prontuario::orderBy('data_atendimento')->get(['paciente_id', 'data_atendimento'])
                ->groupBy('paciente_id')
                ->map(fn ($lista) => $lista->map(fn ($r) => ['date' => Tela::data($r->data_atendimento)])->values()),
            'ocupacao' => collect(Matricula::DIAS)->map(fn ($dia, $i) => [
                'label' => ucfirst($dia),
                'preenchidos' => $semana->filter(fn ($c) => $c->data_hora_consulta->dayOfWeekIso === $i + 1)->count(),
                'total' => $horarios,
            ]),
        ]);
    }
}
