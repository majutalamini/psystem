<?php

namespace Tests\Unit;

use App\Support\Tela;
use Carbon\Carbon;
use PHPUnit\Framework\TestCase;

class TelaTest extends TestCase
{
    public function test_data_vai_para_a_tela_como_dia_mes_ano(): void
    {
        $this->assertSame('05/03/2026', Tela::data(Carbon::parse('2026-03-05 14:30')));
        $this->assertNull(Tela::data(null));
    }

    public function test_data_do_formulario_e_lida_no_comeco_do_dia(): void
    {
        $this->assertSame('2026-03-05 00:00:00', Tela::lerData('05/03/2026')->format('Y-m-d H:i:s'));
        $this->assertNull(Tela::lerData(''));
        $this->assertNull(Tela::lerData(null));
    }

    public function test_cor_do_avatar_se_repete_a_cada_cinco_ids(): void
    {
        $this->assertSame('purple', Tela::cor(0));
        $this->assertSame('pink', Tela::cor(2));
        $this->assertSame('teal', Tela::cor(4));
        $this->assertSame('purple', Tela::cor(5));
        $this->assertSame('yellow', Tela::cor(11));
    }

    public function test_iniciais_usam_os_dois_primeiros_nomes_em_maiuscula(): void
    {
        $this->assertSame('MD', Tela::iniciais('maria da silva'));
        $this->assertSame('ÉS', Tela::iniciais('  élida   souza '));
        $this->assertSame('A', Tela::iniciais('Ana'));
    }

    public function test_cpf_ganha_pontos_e_traco(): void
    {
        $this->assertSame('123.456.789-01', Tela::cpf('12345678901'));
    }

    public function test_rotulo_da_forma_de_pagamento(): void
    {
        $this->assertSame('Cartão de débito', Tela::rotuloMetodo('cartao_debito'));
        $this->assertSame('Transferência', Tela::rotuloMetodo('transferencia'));
        // Forma que saiu da lista continua aparecendo pelo nome gravado.
        $this->assertSame('Convenio', Tela::rotuloMetodo('convenio'));
        $this->assertNull(Tela::rotuloMetodo(null));
    }

    public function test_rotulo_do_formulario_vira_a_forma_gravada_e_desconhecido_vira_pix(): void
    {
        $this->assertSame('cartao_credito', Tela::metodo('Cartão de crédito'));
        $this->assertSame('dinheiro', Tela::metodo('Dinheiro'));
        $this->assertSame('pix', Tela::metodo('Cheque'));
    }
}
