<?php

namespace App\Http\Controllers;

use App\Models\Cobranca;
use App\Models\Configuracao;
use App\Models\Consulta;
use App\Models\Paciente;
use App\Models\Pagamento;
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

        $pagamentos = Pagamento::where('data_pagamento', '>=', $inicioSeisMeses)->get();
        $realizadas = Consulta::where('status', 'realizado')->where('data_hora_consulta', '>=', $inicioSeisMeses)->get();

        $meses = collect(range(5, 0))->map(fn ($n) => $hoje->copy()->startOfMonth()->subMonths($n));

        return Inertia::render('Dashboard/Dashboard', [
            'stats' => [
                'totalPacientes' => Paciente::count(),
                'novosNoMes' => Paciente::where('criado_em', '>=', $hoje->copy()->startOfMonth())->count(),
                'sessoesHoje' => $hojeConsultas->where('status', '!=', 'cancelado')->count(),
                'cancelamentosHoje' => $hojeConsultas->where('status', 'cancelado')->count(),
                'faturamentoMes' => (float) $pagamentos->filter(fn ($p) => $p->data_pagamento->isSameMonth($hoje))->sum('valor_pago'),
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
                'value' => round($pagamentos->filter(fn ($p) => $p->data_pagamento->isSameMonth($mes))->sum('valor_pago') / 1000, 1),
                'current' => $mes->isSameMonth($hoje),
            ]),
            'sessionsPerMonth' => $meses->map(fn ($mes) => [
                'month' => self::MESES[$mes->month - 1],
                'sessoes' => $realizadas->filter(fn ($c) => $c->data_hora_consulta->isSameMonth($mes))->count(),
            ]),
            'pendencias' => Cobranca::where('situacao', 'pendente')
                ->with(['pagamentos', 'paciente'])
                ->orderBy('vencimento')
                ->limit(4)
                ->get()
                ->map->paraTela(),
        ]);
    }
}
