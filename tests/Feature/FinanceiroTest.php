<?php

namespace Tests\Feature;

use App\Models\Cobranca;
use App\Models\Despesa;
use App\Models\Pagamento;

class FinanceiroTest extends ConsultorioTestCase
{
    private function cobranca(float $valor): Cobranca
    {
        return Cobranca::create([
            'paciente_id' => $this->paciente()->id,
            'titulo' => 'Sessão avulsa',
            'valor' => $valor,
            'vencimento' => '2026-09-30',
        ]);
    }

    private function receber(Cobranca $cobranca, float $valor)
    {
        return $this->post("/cobrancas/{$cobranca->id}/pagamento", ['data' => '28/09/2026', 'valor' => $valor, 'forma' => 'Pix']);
    }

    public function test_lancamento_manual_nasce_pendente_sem_consulta(): void
    {
        $paciente = $this->paciente();

        $this->post('/cobrancas', [
            'patientId' => $paciente->id,
            'referencia' => 'Sessão avulsa',
            'valor' => 150,
            'vencimento' => '05/10/2026',
        ])->assertSessionHasNoErrors();

        $cobranca = Cobranca::sole();
        $this->assertNull($cobranca->agenda_id);
        $this->assertSame('pendente', $cobranca->situacao);
        $this->assertSame('2026-10-05', $cobranca->vencimento->toDateString());
    }

    public function test_receber_cria_pagamento_e_estornar_apaga_e_volta_a_pendente(): void
    {
        $cobranca = Cobranca::create([
            'paciente_id' => $this->paciente()->id,
            'titulo' => 'Sessão avulsa',
            'valor' => 200,
            'vencimento' => '2026-09-30',
        ]);

        $this->post("/cobrancas/{$cobranca->id}/pagamento", [
            'data' => '28/09/2026',
            'valor' => 200,
            'forma' => 'Cartão de débito',
        ])->assertSessionHasNoErrors();

        $pagamento = Pagamento::sole();
        $this->assertSame('cartao_debito', $pagamento->metodo_pagamento);
        $this->assertEquals(200, $pagamento->valor_pago);
        $this->assertSame('2026-09-28', $pagamento->data_pagamento->toDateString());
        $this->assertSame('pago', $cobranca->fresh()->situacao);

        $this->delete("/cobrancas/{$cobranca->id}/pagamento")->assertRedirect();

        $this->assertSame(0, Pagamento::count());
        $this->assertSame('pendente', $cobranca->fresh()->situacao);
    }

    public function test_recebimento_parcial_deixa_a_cobranca_em_aberto_com_o_restante(): void
    {
        $cobranca = $this->cobranca(valor: 200);

        $this->receber($cobranca, 80)->assertSessionHasNoErrors();

        $cobranca->refresh();
        $this->assertSame('pendente', $cobranca->situacao);
        $this->assertEquals(80, $cobranca->recebido());
        $this->assertEquals(120, $cobranca->saldo());
        $this->assertSame('Pendente', $cobranca->status());

        $tela = $cobranca->load('pagamentos')->paraTela();
        $this->assertEquals(80, $tela['recebido']);
        $this->assertEquals(120, $tela['saldo']);
    }

    public function test_segundo_recebimento_que_completa_o_valor_marca_como_pago(): void
    {
        $cobranca = $this->cobranca(valor: 200);

        $this->receber($cobranca, 80);
        $this->receber($cobranca, 120)->assertSessionHasNoErrors();

        $this->assertSame('pago', $cobranca->fresh()->situacao);
        $this->assertSame(2, Pagamento::count());
        $this->assertEquals(0, $cobranca->fresh()->saldo());
    }

    public function test_receber_mais_do_que_falta_e_recusado(): void
    {
        $cobranca = $this->cobranca(valor: 200);
        $this->receber($cobranca, 150);

        $this->receber($cobranca, 60)->assertSessionHasErrors('valor');
        $this->receber($cobranca, 0)->assertSessionHasErrors('valor');

        $this->assertSame(1, Pagamento::count());
        $this->assertSame('pendente', $cobranca->fresh()->situacao);
    }

    public function test_estorno_desfaz_so_o_ultimo_recebimento(): void
    {
        $cobranca = $this->cobranca(valor: 200);
        $this->receber($cobranca, 80);
        $this->receber($cobranca, 120);

        $this->delete("/cobrancas/{$cobranca->id}/pagamento");

        $cobranca->refresh();
        $this->assertSame('pendente', $cobranca->situacao);
        $this->assertEquals(80, $cobranca->recebido());
        $this->assertEquals(120, $cobranca->saldo());
    }

    public function test_forma_de_pagamento_desconhecida_e_recusada(): void
    {
        $cobranca = Cobranca::create([
            'paciente_id' => $this->paciente()->id,
            'titulo' => 'Sessão avulsa',
            'valor' => 200,
            'vencimento' => '2026-09-30',
        ]);

        $this->post("/cobrancas/{$cobranca->id}/pagamento", ['data' => '28/09/2026', 'valor' => 200, 'forma' => 'Cheque'])
            ->assertSessionHasErrors('forma');

        $this->assertSame(0, Pagamento::count());
    }

    public function test_despesa_paga_e_estornada(): void
    {
        $this->post('/despesas', [
            'descricao' => 'Aluguel',
            'categoria' => 'Estrutura',
            'valor' => 1200,
            'vencimento' => '05/10/2026',
        ])->assertSessionHasNoErrors();
        $despesa = Despesa::sole();
        $this->assertSame('Pendente', $despesa->status());

        $this->post("/despesas/{$despesa->id}/pagamento", ['data' => '01/10/2026', 'valor' => 1200, 'forma' => 'Pix']);
        $this->assertSame('Pago', $despesa->fresh()->status());
        $this->assertSame('pix', $despesa->fresh()->metodo_pagamento);

        $this->delete("/despesas/{$despesa->id}/pagamento");
        $despesa->refresh();
        $this->assertNull($despesa->pago_em);
        $this->assertNull($despesa->valor_pago);
        $this->assertSame('Pendente', $despesa->status());
    }
}
