<?php

namespace App\Services;

use App\Models\Cobranca;
use App\Models\Consulta;
use App\Models\Despesa;
use App\Models\Psicologo;
use App\Notifications\ConsultaEmBreve;
use App\Notifications\ContasAVencer;
use Illuminate\Support\Facades\Notification;

/**
 * Avisos por e-mail para a psicóloga. Cada consulta e cada conta é avisada uma vez só
 * (colunas aviso_enviado_em / aviso_vencimento_em).
 */
class Avisos
{
    public const MINUTOS_ANTES_DA_CONSULTA = 60;

    public const DIAS_ANTES_DO_VENCIMENTO = 3;

    /** Consultas que começam na próxima hora e ainda não foram avisadas. Roda a cada minuto. */
    public function consultas(): int
    {
        $consultas = Consulta::with('paciente')
            ->whereIn('status', ['agendado', 'confirmado'])
            ->whereNull('aviso_enviado_em')
            ->where('data_hora_consulta', '>', now())
            ->where('data_hora_consulta', '<=', now()->addMinutes(self::MINUTOS_ANTES_DA_CONSULTA))
            ->orderBy('data_hora_consulta')
            ->get();

        foreach ($consultas as $consulta) {
            Notification::send(Psicologo::all(), new ConsultaEmBreve($consulta));
            $consulta->update(['aviso_enviado_em' => now()]);
        }

        return $consultas->count();
    }

    /** Contas em aberto que vencem de hoje até daqui a 3 dias, num e-mail só. Roda uma vez por dia. */
    public function vencimentos(): int
    {
        $ate = today()->addDays(self::DIAS_ANTES_DO_VENCIMENTO);

        $despesas = Despesa::whereNull('pago_em')
            ->whereNull('aviso_vencimento_em')
            ->whereBetween('vencimento', [today(), $ate])
            ->orderBy('vencimento')
            ->get();

        $cobrancas = Cobranca::with(['paciente', 'pagamentos'])
            ->where('situacao', 'pendente')
            ->whereNull('aviso_vencimento_em')
            ->whereBetween('vencimento', [today(), $ate])
            ->orderBy('vencimento')
            ->get();

        $total = $despesas->count() + $cobrancas->count();
        if ($total === 0) {
            return 0;
        }

        Notification::send(Psicologo::all(), new ContasAVencer($despesas, $cobrancas, self::DIAS_ANTES_DO_VENCIMENTO));

        Despesa::whereKey($despesas->modelKeys())->update(['aviso_vencimento_em' => now()]);
        Cobranca::whereKey($cobrancas->modelKeys())->update(['aviso_vencimento_em' => now()]);

        return $total;
    }
}
