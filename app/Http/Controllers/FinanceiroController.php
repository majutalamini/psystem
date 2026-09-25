<?php

namespace App\Http\Controllers;

use App\Models\Cobranca;
use App\Models\Despesa;
use App\Support\Tela;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class FinanceiroController extends Controller
{
    public function index()
    {
        return Inertia::render('Financeiro/Financeiro', [
            'receivables' => self::cobrancas(),
            'payables' => Despesa::orderByDesc('vencimento')->get()->map->paraTela(),
        ]);
    }

    /** Cobranças visíveis (as canceladas ficam fora das telas). */
    public static function cobrancas()
    {
        return Cobranca::where('situacao', '!=', 'cancelado')
            ->with(['pagamentos', 'paciente'])
            ->orderByDesc('vencimento')
            ->get()
            ->map->paraTela();
    }

    /** Lançamento manual, sem consulta ligada. */
    public function storeCobranca(Request $request)
    {
        $dados = $request->validate([
            'patientId' => 'required|exists:pacientes,id',
            'referencia' => 'required|string|max:200',
            'valor' => 'required|numeric|min:0',
            'vencimento' => 'required|date_format:d/m/Y',
        ], [], ['referencia' => 'referência']);

        Cobranca::create([
            'paciente_id' => $dados['patientId'],
            'titulo' => $dados['referencia'],
            'valor' => $dados['valor'],
            'vencimento' => Tela::lerData($dados['vencimento']),
        ]);

        return back();
    }

    public function receber(Request $request, Cobranca $cobranca)
    {
        $dados = $this->validarBaixa($request);

        DB::transaction(function () use ($cobranca, $dados) {
            $cobranca->pagamentos()->create([
                'valor_pago' => $dados['valor'],
                'metodo_pagamento' => Tela::metodo($dados['forma']),
                'data_pagamento' => Tela::lerData($dados['data']),
            ]);
            $cobranca->update(['situacao' => 'pago']);
        });

        return back();
    }

    /** Estorno: apaga o pagamento e a cobrança volta a ficar em aberto. */
    public function estornar(Cobranca $cobranca)
    {
        DB::transaction(function () use ($cobranca) {
            $cobranca->pagamentos()->delete();
            $cobranca->update(['situacao' => 'pendente']);
        });

        return back();
    }

    public function storeDespesa(Request $request)
    {
        $dados = $request->validate([
            'descricao' => 'required|string|max:200',
            'categoria' => 'required|string|max:40',
            'valor' => 'required|numeric|min:0',
            'vencimento' => 'required|date_format:d/m/Y',
        ], [], ['descricao' => 'descrição']);

        Despesa::create([...$dados, 'vencimento' => Tela::lerData($dados['vencimento'])]);

        return back();
    }

    public function pagarDespesa(Request $request, Despesa $despesa)
    {
        $dados = $this->validarBaixa($request);

        $despesa->update([
            'pago_em' => Tela::lerData($dados['data']),
            'valor_pago' => $dados['valor'],
            'metodo_pagamento' => Tela::metodo($dados['forma']),
        ]);

        return back();
    }

    public function estornarDespesa(Despesa $despesa)
    {
        $despesa->update(['pago_em' => null, 'valor_pago' => null, 'metodo_pagamento' => null]);

        return back();
    }

    private function validarBaixa(Request $request): array
    {
        return $request->validate([
            'data' => 'required|date_format:d/m/Y',
            'valor' => 'required|numeric|min:0',
            'forma' => ['required', Rule::in(Tela::METODOS)],
        ]);
    }
}
