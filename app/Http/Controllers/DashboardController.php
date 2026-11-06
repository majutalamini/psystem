<?php

namespace App\Http\Controllers;

use App\Models\Cobranca;
use App\Models\Configuracao;
use App\Models\Consulta;
use App\Models\Paciente;
use App\Models\Pagamento;
use App\Queries\PacientesDaPagina;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    private const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    private const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

    public function __invoke()
    {
        $hoje = today();
        $inicioSemana = $hoje->copy()->startOfWeek(Carbon::MONDAY);
        $inicioSeisMeses = $hoje->copy()->startOfMonth()->subMonths(5);

        $consultasSemana = Consulta::with('paciente')
            ->whereBetween('data_hora_consulta', [$inicioSemana, $inicioSemana->copy()->endOfWeek(Carbon::SUNDAY)])
            ->orderBy('data_hora_consulta')
            ->get();
        $ativasSemana = $consultasSemana->where('status', '!=', 'cancelado');
        $hojeConsultas = $consultasSemana->filter(fn ($c) => $c->data_hora_consulta->isSameDay($hoje));

        // Somas por mês no banco (no fuso da conexão, America/Sao_Paulo), sem carregar cada registro no PHP.
        $receitaPorMes = Pagamento::validos()->where('data_pagamento', '>=', $inicioSeisMeses)
            ->selectRaw("to_char(date_trunc('month', data_pagamento), 'YYYY-MM') AS mes, SUM(valor_pago) AS total")
            ->groupBy('mes')->pluck('total', 'mes');
        $sessoesPorMes = Consulta::where('status', 'realizado')->where('data_hora_consulta', '>=', $inicioSeisMeses)
            ->selectRaw("to_char(date_trunc('month', data_hora_consulta), 'YYYY-MM') AS mes, COUNT(*) AS total")
            ->groupBy('mes')->pluck('total', 'mes');

        $meses = collect(range(5, 0))->map(fn ($n) => $hoje->copy()->startOfMonth()->subMonths($n));
        $patientStats = PacientesDaPagina::totais();

        return Inertia::render('Dashboard/Dashboard', [
            'patientStats' => $patientStats,
            'attentionPatients' => fn () => PacientesDaPagina::atencao(),
            'attentionTotal' => $patientStats['inactive'],
            'stats' => [
                'totalPacientes' => $patientStats['total'],
                'novosNoMes' => Paciente::where('criado_em', '>=', $hoje->copy()->startOfMonth())->count(),
                'sessoesHoje' => $hojeConsultas->where('status', '!=', 'cancelado')->count(),
                'cancelamentosHoje' => $hojeConsultas->where('status', 'cancelado')->count(),
                'faturamentoMes' => (float) ($receitaPorMes[$hoje->format('Y-m')] ?? 0),
                'horasSemana' => round($ativasSemana->sum('duracao_minutos') / 60, 1),
            ],
            'goals' => Configuracao::atual()->metas(),
            'todayAppointments' => $hojeConsultas->where('status', '!=', 'cancelado')->values()->map(fn ($c) => [
                'time' => $c->data_hora_consulta->format('H:i'),
                'name' => $c->paciente->nome,
                'type' => $c->paraTela()['type'],
            ]),
            'weekOverview' => collect(self::DIAS)->map(fn ($dia, $i) => [
                'day' => $dia,
                'count' => $ativasSemana->filter(fn ($c) => $c->data_hora_consulta->dayOfWeekIso === $i + 1)->count(),
                'active' => $hoje->dayOfWeekIso === $i + 1,
            ]),
            'weekLabel' => 'semana de '.$inicioSemana->format('d/m').' a '.$inicioSemana->copy()->addDays(6)->format('d/m'),
            'revenueData' => $meses->map(fn ($mes) => [
                'month' => self::MESES[$mes->month - 1],
                'value' => round((float) ($receitaPorMes[$mes->format('Y-m')] ?? 0) / 1000, 1),
                'current' => $mes->isSameMonth($hoje),
            ]),
            'sessionsPerMonth' => $meses->map(fn ($mes) => [
                'month' => self::MESES[$mes->month - 1],
                'sessoes' => (int) ($sessoesPorMes[$mes->format('Y-m')] ?? 0),
            ]),
            'pendenciasTotal' => Cobranca::where('situacao', 'pendente')->count(),
            'pendencias' => Cobranca::where('situacao', 'pendente')
                ->with(['pagamentos', 'paciente'])
                ->orderBy('vencimento')
                ->limit(4)
                ->get()
                ->map->paraTela(),
        ]);
    }
}
