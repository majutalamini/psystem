<?php

namespace App\Http\Controllers;

use App\Models\Anamnese;
use App\Models\Configuracao;
use App\Models\Consulta;
use App\Models\Despesa;
use App\Models\Matricula;
use App\Models\Prontuario;
use App\Queries\PacientesDaPagina;
use App\Support\Tela;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * Cada relatório solicita apenas seus conjuntos; a central não carrega dados das tabelas.
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

    public const CONTRATOS = [
        'lista' => ['patients'], 'aniversariantes' => ['patients'], 'inativos' => ['patients'],
        'novos' => ['patients'], 'faixa-etaria' => ['patients'], 'genero' => ['patients'],
        'realizadas-agendadas' => ['sessions'], 'faltas-cancelamentos' => ['patients', 'sessions'],
        'frequencia' => ['sessions'], 'ocupacao' => ['ocupacao'], 'receber' => ['receivables'],
        'pagar' => ['payables'], 'inadimplencia' => ['receivables'], 'recebimento-paciente' => ['receivables'],
        'com-anamnese' => ['patients', 'anamneses'], 'sem-anamnese' => ['patients', 'anamneses'],
        'com-prontuario' => ['patients', 'records'], 'sem-prontuario' => ['patients', 'records'],
    ];

    public function __invoke(Request $request)
    {
        $relatorio = $request->validate(['relatorio' => ['nullable', Rule::in(array_keys(self::CONTRATOS))]])['relatorio'] ?? null;

        return Inertia::render('Relatorios/Relatorios', [
            'activeReport' => $relatorio,
            'reportData' => fn () => $relatorio ? $this->dados($relatorio) : [],
        ]);
    }

    private function dados(string $relatorio): array
    {
        $fontes = [
            'patients' => fn () => PacientesDaPagina::relatorio(),
            'receivables' => fn () => FinanceiroController::cobrancas()->map(fn ($row) => array_intersect_key($row,
                array_flip(['id', 'patientId', 'paciente', 'referencia', 'valor', 'vencimento', 'status', 'recebido', 'saldo']))),
            'payables' => fn () => Despesa::with('pagamentos')->orderByDesc('vencimento')->get()->map->paraTela(),
            'sessions' => fn () => Consulta::with('paciente')->orderBy('data_hora_consulta')->get()->map(fn ($c) => [
                'id' => $c->id,
                'paciente' => $c->paciente->nome,
                'data' => Tela::data($c->data_hora_consulta),
                'status' => self::STATUS_SESSAO[$c->status],
            ]),
            'anamneses' => fn () => Anamnese::orderBy('criado_em')->get(['paciente_id', 'criado_em'])
                ->groupBy('paciente_id')
                ->map(fn ($lista) => $lista->map(fn ($a) => ['preenchidoEm' => Tela::data($a->criado_em)])->values()),
            'records' => fn () => Prontuario::orderBy('data_atendimento')->get(['paciente_id', 'data_atendimento'])
                ->groupBy('paciente_id')
                ->map(fn ($lista) => $lista->map(fn ($r) => ['date' => Tela::data($r->data_atendimento)])->values()),
            'ocupacao' => fn () => $this->ocupacao(),
        ];

        return collect($fontes)->only(self::CONTRATOS[$relatorio])->map(fn ($fonte) => $fonte())->all();
    }

    private function ocupacao()
    {
        $inicioSemana = today()->startOfWeek(Carbon::MONDAY);
        $config = Configuracao::atual();
        $horarios = count($config->horarios());
        $semana = Consulta::whereBetween('data_hora_consulta', [$inicioSemana, $inicioSemana->copy()->endOfWeek(Carbon::SUNDAY)])
            ->where('status', '!=', 'cancelado')->get();

        return collect(Matricula::DIAS)->map(fn ($dia, $i) => [
            'label' => ucfirst($dia),
            'preenchidos' => $semana->filter(fn ($c) => $c->data_hora_consulta->dayOfWeekIso === $i + 1)->count(),
            'total' => $config->atendeNo($i) ? $horarios : 0,
        ]);
    }
}
