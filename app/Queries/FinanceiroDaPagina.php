<?php

namespace App\Queries;

use App\Models\Cobranca;
use App\Models\Despesa;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class FinanceiroDaPagina
{
    public static function receber(int $page): array
    {
        return self::pagina(Cobranca::where('situacao', '!=', 'cancelado')->with(['pagamentos', 'paciente:id,nome']), $page);
    }

    public static function pagar(int $page): array
    {
        return self::pagina(Despesa::with(['pagamentos', 'recorrencia']), $page);
    }

    private static function pagina(Builder $query, int $page): array
    {
        $query->orderByDesc('vencimento')->orderByDesc('id');
        $result = $query->paginate(25, page: $page);
        if ($result->currentPage() > $result->lastPage()) {
            $result = $query->paginate(25, page: $result->lastPage());
        }

        return ['items' => $result->getCollection()->map->paraTela()->values(), 'pagination' => [
            'page' => $result->currentPage(), 'lastPage' => $result->lastPage(), 'total' => $result->total(),
            'from' => $result->firstItem(), 'to' => $result->lastItem(), 'perPage' => $result->perPage(),
        ]];
    }

    /** Totais do conjunto inteiro; não recebem o limite da paginação. */
    public static function totais(): array
    {
        // Somente pagamentos não estornados entram nas somas.
        $pagamentos = DB::table('pagamentos')->whereNull('estornado_em')->selectRaw('cobranca_id, SUM(valor_pago) AS recebido')->groupBy('cobranca_id');
        $receber = DB::table('cobrancas as c')->leftJoinSub($pagamentos, 'p', 'p.cobranca_id', '=', 'c.id')
            ->where('c.situacao', '!=', 'cancelado')
            ->selectRaw("COUNT(*) AS quantidade, COALESCE(SUM(c.valor),0) AS total, COALESCE(SUM(p.recebido),0) AS recebido,
                COALESCE(SUM(GREATEST(c.valor - COALESCE(p.recebido,0),0)) FILTER (WHERE c.situacao <> 'pago' AND c.vencimento >= ?),0) AS pendente,
                COALESCE(SUM(GREATEST(c.valor - COALESCE(p.recebido,0),0)) FILTER (WHERE c.situacao <> 'pago' AND c.vencimento < ?),0) AS atrasado", [today()->toDateString(), today()->toDateString()])->first();
        // Despesa: pago = soma dos pagamentos válidos; pendente = saldo das que ainda não venceram.
        $pagos = DB::table('despesa_pagamentos')->whereNull('estornado_em')->selectRaw('despesa_id, SUM(valor_pago) AS pago')->groupBy('despesa_id');
        $pagar = DB::table('despesas as d')->leftJoinSub($pagos, 'p', 'p.despesa_id', '=', 'd.id')->whereNull('d.cancelada_em')
            ->selectRaw('COUNT(*) AS quantidade, COALESCE(SUM(d.valor),0) AS total, COALESCE(SUM(p.pago),0) AS pago,
            COALESCE(SUM(GREATEST(d.valor - COALESCE(p.pago,0),0)) FILTER (WHERE d.vencimento >= ?),0) AS pendente', [today()->toDateString()])->first();

        return ['receivableCount' => (int) $receber->quantidade, 'totalReceber' => (float) $receber->total,
            'recebido' => (float) $receber->recebido, 'pendenteReceber' => (float) $receber->pendente,
            'atrasadoReceber' => (float) $receber->atrasado, 'payableCount' => (int) $pagar->quantidade,
            'totalPagar' => (float) $pagar->total, 'pago' => (float) $pagar->pago, 'pendentePagar' => (float) $pagar->pendente];
    }
}
