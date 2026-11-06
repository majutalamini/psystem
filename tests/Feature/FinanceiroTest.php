<?php

namespace Tests\Feature;

use App\Actions\CriarCobranca;
use App\Models\Cobranca;
use App\Models\Despesa;
use App\Models\DespesaPagamento;
use App\Models\Pagamento;

class FinanceiroTest extends ConsultorioTestCase
{
    private function cobranca(float $valor): Cobranca
    {
        return CriarCobranca::executar([
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

    private function estornar(Cobranca $cobranca, Pagamento $pagamento, string $motivo = 'Lançado em duplicidade')
    {
        return $this->post("/cobrancas/{$cobranca->id}/pagamentos/{$pagamento->id}/estorno", ['motivo' => $motivo]);
    }

    public function test_receber_cria_pagamento_e_estornar_guarda_o_historico_e_volta_a_pendente(): void
    {
        $cobranca = CriarCobranca::executar([
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

        $this->estornar($cobranca, $pagamento)->assertRedirect()->assertSessionHasNoErrors();

        // O pagamento continua gravado como estornado, com data, autor e motivo.
        $pagamento->refresh();
        $this->assertNotNull($pagamento->estornado_em);
        $this->assertSame($this->psicologa->id, $pagamento->estornado_por);
        $this->assertSame('Lançado em duplicidade', $pagamento->motivo_estorno);
        $this->assertSame('pendente', $cobranca->fresh()->situacao);
        $this->assertEquals(200, $cobranca->fresh()->saldo());
        $this->assertDatabaseHas('registros_acao', ['acao' => 'cobranca.estornar', 'alvo_id' => $cobranca->id]);
    }

    public function test_estorno_exige_motivo_e_nao_repete(): void
    {
        $cobranca = $this->cobranca(valor: 200);
        $this->receber($cobranca, 200);
        $pagamento = Pagamento::sole();

        $this->estornar($cobranca, $pagamento, '  ')->assertSessionHasErrors('motivo');
        $this->estornar($cobranca, $pagamento)->assertSessionHasNoErrors();
        $this->estornar($cobranca, $pagamento)->assertSessionHasErrors(['pagamento' => 'Este pagamento já foi estornado.']);
    }

    public function test_estorno_de_pagamento_de_outra_cobranca_e_recusado(): void
    {
        $uma = $this->cobranca(valor: 200);
        $outra = $this->cobranca(valor: 100);
        $this->receber($outra, 100);

        $this->estornar($uma, Pagamento::sole())->assertSessionHasErrors(['pagamento' => 'Pagamento não encontrado nesta conta.']);
        $this->assertNull(Pagamento::sole()->estornado_em);
    }

    public function test_mesmo_envio_repetido_grava_um_pagamento_so(): void
    {
        $cobranca = $this->cobranca(valor: 200);
        $envio = ['data' => '28/09/2026', 'valor' => 50, 'forma' => 'Pix', 'chave' => 'envio-unico-1'];

        $this->post("/cobrancas/{$cobranca->id}/pagamento", $envio)->assertSessionHasNoErrors();
        $this->post("/cobrancas/{$cobranca->id}/pagamento", $envio)->assertSessionHasNoErrors();

        $this->assertSame(1, Pagamento::count());
        $this->assertEquals(150, $cobranca->fresh()->saldo());
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

    public function test_estorno_especifico_de_um_pagamento_do_meio(): void
    {
        $cobranca = $this->cobranca(valor: 200);
        $this->receber($cobranca, 50);
        $this->receber($cobranca, 70);
        $this->receber($cobranca, 80);
        $this->assertSame('pago', $cobranca->fresh()->situacao);
        $doMeio = Pagamento::orderBy('id')->skip(1)->first();

        $this->estornar($cobranca, $doMeio)->assertSessionHasNoErrors();

        $cobranca->refresh();
        $this->assertSame('pendente', $cobranca->situacao);
        $this->assertEquals(130, $cobranca->recebido());
        $this->assertEquals(70, $cobranca->saldo());
        $this->assertSame(3, Pagamento::count());

        $tela = $cobranca->load('pagamentos')->paraTela();
        $this->assertSame([false, true, false], array_column($tela['pagamentos'], 'estornado'));

        // O saldo reaberto pode ser recebido de novo.
        $this->receber($cobranca, 70)->assertSessionHasNoErrors();
        $this->assertSame('pago', $cobranca->fresh()->situacao);
    }

    public function test_forma_de_pagamento_desconhecida_e_recusada(): void
    {
        $cobranca = CriarCobranca::executar([
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

        $this->post("/despesas/{$despesa->id}/pagamento", ['data' => '01/10/2026', 'valor' => 1200, 'forma' => 'Pix'])->assertSessionHasNoErrors();
        $this->assertSame('Pago', $despesa->fresh()->status());
        $pagamento = DespesaPagamento::sole();
        $this->assertSame('pix', $pagamento->metodo_pagamento);

        $this->post("/despesas/{$despesa->id}/pagamentos/{$pagamento->id}/estorno", ['motivo' => 'Valor errado'])->assertSessionHasNoErrors();
        $despesa->refresh();
        $this->assertSame('Pendente', $despesa->status());
        $this->assertEquals(1200, $despesa->saldo());
        $this->assertSame('Valor errado', $pagamento->fresh()->motivo_estorno);
    }

    public function test_despesa_paga_em_partes_e_nao_passa_do_saldo(): void
    {
        $despesa = Despesa::create(['descricao' => 'Reforma', 'categoria' => 'Estrutura', 'valor' => 1000, 'vencimento' => '2026-10-05']);
        $pagar = fn ($valor) => $this->post("/despesas/{$despesa->id}/pagamento", ['data' => '01/10/2026', 'valor' => $valor, 'forma' => 'Pix']);

        $pagar(400)->assertSessionHasNoErrors();
        $this->assertSame('Pendente', $despesa->fresh()->status());
        $this->assertEquals(600, $despesa->fresh()->saldo());

        $pagar(700)->assertSessionHasErrors(['valor' => 'Informe um valor maior que zero e de no máximo R$ 600,00 (o que falta pagar).']);
        $pagar(600)->assertSessionHasNoErrors();
        $this->assertSame('Pago', $despesa->fresh()->status());

        $tela = $despesa->fresh()->paraTela();
        $this->assertEquals(1000, $tela['pago']);
        $this->assertEquals(0, $tela['saldo']);
        $this->assertCount(2, $tela['pagamentos']);
    }
}
