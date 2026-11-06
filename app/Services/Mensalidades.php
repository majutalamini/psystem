<?php

namespace App\Services;

use App\Models\Cobranca;
use App\Models\Matricula;
use App\Models\Paciente;
use Illuminate\Support\Carbon;

/**
 * Mensalidade da matrícula: um título em aberto por matrícula e mês, vencendo no dia configurado no perfil do paciente.
 * Gerada ao lançar a matrícula e, todo mês, pelo comando mensalidades:gerar.
 */
class Mensalidades
{
    /** Vencimento no mês de $mes (o dia é encurtado em meses menores: 31 vira 28/29/30). */
    public static function vencimento(Carbon $mes, int $dia): Carbon
    {
        $inicio = $mes->copy()->startOfMonth();

        return $inicio->copy()->day(min($dia, $inicio->daysInMonth));
    }

    /**
     * Lança a mensalidade da matrícula. Ao lançar a matrícula, se o vencimento do mês já passou, o título é o do
     * próximo mês (para não nascer atrasado). Não duplica: uma por matrícula e competência.
     */
    public function gerar(Matricula $matricula, bool $pularVencidoDoMes = true): ?Cobranca
    {
        if ($matricula->status_matricula === 'encerrada' || (float) $matricula->valor_sessao <= 0) {
            return null;
        }

        $dia = (int) ($matricula->paciente->dia_vencimento ?: 10);
        $mes = today()->startOfMonth();
        if ($pularVencidoDoMes && self::vencimento($mes, $dia)->lt(today())) {
            $mes = $mes->addMonthNoOverflow();
        }

        return $this->lancar($matricula, $mes, $dia);
    }

    /** Lança a mensalidade só se a matrícula ainda não tem nenhuma deste mês em diante (usado ao editar a matrícula). */
    public function garantir(Matricula $matricula): ?Cobranca
    {
        $existe = Cobranca::where('matricula_id', $matricula->id)
            ->where('situacao', '!=', 'cancelado')
            ->whereDate('competencia', '>=', today()->startOfMonth())
            ->exists();

        return $existe ? null : $this->gerar($matricula);
    }

    /** Mensalidades do mês corrente das matrículas ativas que já existiam no início do mês (comando diário, sem duplicar). */
    public function gerarDoMes(): int
    {
        $criadas = 0;
        foreach (Matricula::ativas()->with('paciente')->get() as $matricula) {
            // Matrícula criada neste mês já recebeu o título ao ser lançada.
            if (! $matricula->paciente->ativo() || (float) $matricula->valor_sessao <= 0 || ! $matricula->inicio_da_matricula->lt(today()->startOfMonth())) {
                continue;
            }
            $dia = (int) ($matricula->paciente->dia_vencimento ?: 10);
            $antes = Cobranca::where('matricula_id', $matricula->id)->count();
            $this->lancar($matricula, today()->startOfMonth(), $dia);
            $criadas += Cobranca::where('matricula_id', $matricula->id)->count() - $antes;
        }

        return $criadas;
    }

    /** Aplica a mudança de valor da matrícula nas mensalidades em aberto que ainda não receberam nada. */
    public function atualizarValor(Matricula $matricula): void
    {
        $this->emAberto($matricula)->each->update(['valor' => $matricula->valor_sessao]);
    }

    /** Muda o dia de vencimento das mensalidades em aberto do paciente que ainda não receberam nada. */
    public function atualizarVencimento(Paciente $paciente): void
    {
        Cobranca::where('paciente_id', $paciente->id)
            ->whereNotNull('competencia')
            ->where('situacao', 'pendente')
            ->whereDoesntHave('pagamentos')
            ->get()
            ->each(fn (Cobranca $c) => $c->update([
                'vencimento' => self::vencimento($c->competencia, (int) $paciente->dia_vencimento),
            ]));
    }

    /** Matrícula encerrada: as mensalidades que ainda vão vencer e não receberam nada saem do financeiro. */
    public function cancelarFuturas(Matricula $matricula): void
    {
        $this->emAberto($matricula)
            ->filter(fn (Cobranca $c) => $c->vencimento->gte(today()))
            ->each->update(['situacao' => 'cancelado']);
    }

    private function emAberto(Matricula $matricula)
    {
        return Cobranca::where('matricula_id', $matricula->id)
            ->where('situacao', 'pendente')
            ->whereDoesntHave('pagamentos')
            ->get();
    }

    private function lancar(Matricula $matricula, Carbon $mes, int $dia): ?Cobranca
    {
        if (Cobranca::where('matricula_id', $matricula->id)->whereDate('competencia', $mes)->exists()) {
            return null;
        }

        return Cobranca::create([
            'paciente_id' => $matricula->paciente_id,
            'matricula_id' => $matricula->id,
            'competencia' => $mes->toDateString(),
            'titulo' => 'Mensalidade — '.$mes->format('m/Y'),
            'valor' => $matricula->valor_sessao,
            'vencimento' => self::vencimento($mes, $dia)->toDateString(),
        ]);
    }
}
