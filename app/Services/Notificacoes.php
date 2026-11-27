<?php

namespace App\Services;

use App\Models\Cobranca;
use App\Models\Consulta;
use App\Models\Despesa;
use App\Models\NotificacaoLida;
use App\Models\Psicologo;
use App\Support\Tela;

/**
 * Notificações do cabeçalho. São calculadas na hora a partir dos dados; só o que a psicóloga dispensou é gravado
 * (notificacoes_lidas). Lembretes que continuam valendo (atrasos) levam a data na chave e voltam no dia seguinte.
 */
class Notificacoes
{
    /** Quantos dias antes do vencimento a conta ou a mensalidade aparece como "a vencer". */
    public const DIAS_ANTES = 3;

    public function lista(Psicologo $psicologa): array
    {
        $hoje = today();
        $limite = today()->addDays(self::DIAS_ANTES);
        $itens = [];

        // Financeiro: contas a pagar vencidas ou que vencem nos próximos dias.
        $despesas = Despesa::whereNull('pago_em')->whereDate('vencimento', '<=', $limite)->orderBy('vencimento')->get();
        foreach ($despesas as $d) {
            $vencida = $d->vencimento->lt($hoje);
            $itens[] = [
                'chave' => "despesa:{$d->id}:".($vencida ? $hoje->toDateString() : $d->vencimento->toDateString()),
                'categoria' => 'financeiro',
                'nivel' => $vencida ? 'perigo' : 'alerta',
                'titulo' => $vencida ? 'Conta a pagar vencida' : 'Lembrete: pagar conta',
                'texto' => "{$d->descricao} — R$ ".self::dinheiro($d->valor).' · '.self::quando($d->vencimento, 'venceu', 'vence'),
                'link' => '/financeiro?aba=pagar',
                'data' => $d->vencimento->toDateString(),
            ];
        }

        // Financeiro: mensalidades dos pacientes a vencer e em atraso.
        $cobrancas = Cobranca::where('situacao', 'pendente')
            ->whereDate('vencimento', '<=', $limite)
            ->with(['paciente', 'pagamentos'])
            ->orderBy('vencimento')
            ->get();
        foreach ($cobrancas as $c) {
            $atrasada = $c->vencimento->lt($hoje);
            $itens[] = [
                'chave' => "cobranca:{$c->id}:".($atrasada ? $hoje->toDateString() : $c->vencimento->toDateString()),
                'categoria' => 'financeiro',
                'nivel' => $atrasada ? 'perigo' : 'alerta',
                'titulo' => $atrasada ? 'Mensalidade em atraso' : 'Mensalidade a vencer',
                'texto' => "{$c->paciente->nome} — R$ ".self::dinheiro($c->saldo()).' · '.self::quando($c->vencimento, 'venceu', 'vence'),
                'link' => "/pacientes/{$c->paciente_id}?aba=financeiro",
                'data' => $c->vencimento->toDateString(),
            ];
        }

        // Agenda: sessões que ainda vão acontecer hoje.
        $consultas = Consulta::whereIn('status', ['agendado', 'confirmado'])
            ->where('data_hora_consulta', '>=', now())
            ->where('data_hora_consulta', '<=', today()->endOfDay())
            ->with('paciente')
            ->orderBy('data_hora_consulta')
            ->get();
        foreach ($consultas as $c) {
            $itens[] = [
                'chave' => "consulta:{$c->id}",
                'categoria' => 'agenda',
                'nivel' => 'info',
                'titulo' => 'Sessão hoje às '.$c->data_hora_consulta->format('H:i'),
                'texto' => "{$c->paciente->nome} · ".Tela::MODALIDADES[$c->modalidade],
                'link' => '/agenda',
                'data' => $c->data_hora_consulta->toDateString(),
            ];
        }

        $lidas = NotificacaoLida::where('psicologo_id', $psicologa->id)
            ->whereIn('chave', array_column($itens, 'chave'))
            ->pluck('chave')
            ->flip();

        $ordem = ['perigo' => 0, 'alerta' => 1, 'info' => 2];

        return collect($itens)
            ->reject(fn ($n) => $lidas->has($n['chave']))
            ->sortBy([fn ($a, $b) => $ordem[$a['nivel']] <=> $ordem[$b['nivel']], fn ($a, $b) => $a['data'] <=> $b['data']])
            ->values()
            ->all();
    }

    public function marcarLidas(Psicologo $psicologa, array $chaves): void
    {
        foreach (array_unique($chaves) as $chave) {
            NotificacaoLida::firstOrCreate(['psicologo_id' => $psicologa->id, 'chave' => $chave], ['lida_em' => now()]);
        }
    }

    private static function dinheiro($valor): string
    {
        return number_format((float) $valor, 2, ',', '.');
    }

    private static function quando($data, string $passado, string $futuro): string
    {
        $dias = (int) today()->diffInDays($data, false);

        return match (true) {
            $dias < -1 => "{$passado} em ".$data->format('d/m'),
            $dias === -1 => "{$passado} ontem",
            $dias === 0 => "{$futuro} hoje",
            $dias === 1 => "{$futuro} amanhã",
            default => "{$futuro} em ".$data->format('d/m'),
        };
    }
}
