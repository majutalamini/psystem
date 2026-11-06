<?php

namespace App\Http\Controllers;

use App\Actions\CriarCobranca;
use App\Actions\EstornarPagamento;
use App\Actions\PagarDespesa;
use App\Actions\ReceberCobranca;
use App\Models\Cobranca;
use App\Models\Despesa;
use App\Models\DespesaRecorrente;
use App\Queries\FinanceiroDaPagina;
use App\Services\DespesasRecorrentes;
use App\Support\Tela;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class FinanceiroController extends Controller
{
    public function index(Request $request)
    {
        $request->validate(['receber_page' => 'nullable|integer|min:1', 'pagar_page' => 'nullable|integer|min:1']);
        $receber = null;
        $pagar = null;
        $carregarReceber = function () use ($request, &$receber) {
            return $receber ??= FinanceiroDaPagina::receber($request->integer('receber_page', 1));
        };
        $carregarPagar = function () use ($request, &$pagar) {
            return $pagar ??= FinanceiroDaPagina::pagar($request->integer('pagar_page', 1));
        };

        return Inertia::render('Financeiro/Financeiro', [
            'receivables' => fn () => $carregarReceber()['items'],
            'receivablePagination' => fn () => $carregarReceber()['pagination'],
            'payables' => fn () => $carregarPagar()['items'],
            'payablePagination' => fn () => $carregarPagar()['pagination'],
            'financeSummary' => fn () => FinanceiroDaPagina::totais(),
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

        CriarCobranca::executar([
            'paciente_id' => $dados['patientId'],
            'titulo' => $dados['referencia'],
            'valor' => $dados['valor'],
            'vencimento' => Tela::lerData($dados['vencimento']),
        ]);

        return back();
    }

    /** Ajusta a data de vencimento de uma cobrança em aberto (inclusive as mensalidades da matrícula). */
    public function atualizarCobranca(Request $request, Cobranca $cobranca)
    {
        $dados = $request->validate(['vencimento' => 'required|date_format:d/m/Y']);

        if ($cobranca->situacao !== 'pendente') {
            throw ValidationException::withMessages(['vencimento' => 'Só dá para mudar o vencimento de um título em aberto.']);
        }

        $cobranca->update(['vencimento' => Tela::lerData($dados['vencimento'])]);

        return back();
    }

    /** Cancela o título (ele sai das telas). Com recebimento registrado, é preciso estornar antes. */
    public function cancelarCobranca(Cobranca $cobranca)
    {
        return $this->cancelar($cobranca);
    }

    /**
     * Recebimento total ou parcial. Parcial: a cobrança continua em aberto com o restante,
     * que pode ser recebido depois em outro pagamento. Só vira "pago" quando o saldo zera.
     */
    public function receber(Request $request, Cobranca $cobranca)
    {
        $dados = $this->validarBaixa($request);

        ReceberCobranca::executar($cobranca->id, $this->baixa($dados));

        return back();
    }

    /** Estorno específico de um recebimento, com motivo; o pagamento continua no histórico. */
    public function estornar(Request $request, Cobranca $cobranca, int $pagamento)
    {
        EstornarPagamento::executar($cobranca, $pagamento, $this->motivo($request), $request->user()->id);

        return back();
    }

    /** Cancelar tira o lançamento das telas; com recebimento registrado é preciso estornar antes. */
    public function cancelar(Cobranca $cobranca)
    {
        DB::transaction(function () use ($cobranca) {
            $cobranca = Cobranca::whereKey($cobranca->id)->lockForUpdate()->firstOrFail();
            if ($cobranca->pagamentos()->validos()->exists()) {
                throw ValidationException::withMessages(['cobranca' => 'Estorne os recebimentos antes de cancelar este lançamento.']);
            }
            $cobranca->update(['situacao' => 'cancelado']);
        });

        return back();
    }

    public function storeDespesa(Request $request, DespesasRecorrentes $recorrentes)
    {
        $dados = $this->validarDespesa($request);
        $vencimento = Tela::lerData($dados['vencimento']);

        DB::transaction(function () use ($dados, $vencimento, $request) {
            $campos = ['descricao' => $dados['descricao'], 'categoria' => $dados['categoria'], 'valor' => $dados['valor']];

            if (! $request->boolean('recorrente')) {
                Despesa::create([...$campos, 'vencimento' => $vencimento]);

                return;
            }

            // Recorrente: a data informada define o dia do mês; a primeira conta é esta e as outras vêm todo mês.
            $mes = Carbon::parse($vencimento)->startOfMonth();
            $recorrencia = DespesaRecorrente::create([...$campos, 'dia' => Carbon::parse($vencimento)->day, 'inicio' => $mes]);
            Despesa::create([
                ...$campos,
                'vencimento' => $vencimento,
                'recorrente_id' => $recorrencia->id,
                'competencia' => $mes->toDateString(),
            ]);
        });

        return back();
    }

    /** Edita uma conta a pagar em aberto. Em conta recorrente, "aplicarFuturos" muda também as próximas. */
    public function atualizarDespesa(Request $request, Despesa $despesa)
    {
        $dados = $this->validarDespesa($request);

        if ($despesa->pagamentos()->validos()->exists()) {
            throw ValidationException::withMessages(['descricao' => 'Esta conta já foi paga. Estorne o pagamento para editar.']);
        }

        $vencimento = Tela::lerData($dados['vencimento']);
        $campos = ['descricao' => $dados['descricao'], 'categoria' => $dados['categoria'], 'valor' => $dados['valor']];

        DB::transaction(function () use ($despesa, $campos, $vencimento, $request) {
            $despesa->update([...$campos, 'vencimento' => $vencimento]);

            if ($request->boolean('aplicarFuturos') && $despesa->recorrencia?->ativa) {
                $despesa->recorrencia->update([...$campos, 'dia' => Carbon::parse($vencimento)->day]);
            }
        });

        return back();
    }

    /** Cancela a conta (ela sai das telas e relatórios). Conta paga precisa ter o pagamento estornado antes. */
    public function cancelarDespesa(Despesa $despesa)
    {
        if ($despesa->pagamentos()->validos()->exists()) {
            throw ValidationException::withMessages(['despesa' => 'Esta conta já foi paga. Estorne o pagamento antes de cancelar.']);
        }

        $despesa->update(['cancelada_em' => today()]);

        return back();
    }

    /** Para de gerar as próximas contas; as já lançadas continuam. */
    public function encerrarRecorrencia(Despesa $despesa)
    {
        $despesa->recorrencia?->update(['ativa' => false]);

        return back();
    }

    /** Pagamento total ou parcial; não passa do saldo. */
    public function pagarDespesa(Request $request, Despesa $despesa)
    {
        PagarDespesa::executar($despesa->id, $this->baixa($this->validarBaixa($request)));

        return back();
    }

    public function estornarDespesa(Request $request, Despesa $despesa, int $pagamento)
    {
        EstornarPagamento::executar($despesa, $pagamento, $this->motivo($request), $request->user()->id);

        return back();
    }

    private function validarDespesa(Request $request): array
    {
        return $request->validate([
            'descricao' => 'required|string|max:200',
            'categoria' => 'required|string|max:40',
            'valor' => 'required|numeric|min:0',
            'vencimento' => 'required|date_format:d/m/Y',
        ], [], ['descricao' => 'descrição']);
    }

    private function validarBaixa(Request $request): array
    {
        return $request->validate([
            'data' => 'required|date_format:d/m/Y',
            'valor' => 'required|numeric|min:0',
            'forma' => ['required', Rule::in(Tela::METODOS)],
            'chave' => 'nullable|string|max:64',
        ]);
    }

    private function baixa(array $dados): array
    {
        return [
            'valor' => $dados['valor'],
            'metodo_pagamento' => Tela::metodo($dados['forma']),
            'data_pagamento' => Tela::lerData($dados['data']),
            'chave' => $dados['chave'] ?? null,
        ];
    }

    private function motivo(Request $request): string
    {
        return trim($request->validate(['motivo' => 'required|string|max:200'], [], ['motivo' => 'motivo do estorno'])['motivo']);
    }
}
