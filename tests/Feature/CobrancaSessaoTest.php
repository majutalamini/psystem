<?php

namespace Tests\Feature;

use App\Models\Cobranca;
use App\Models\Consulta;
use Illuminate\Support\Carbon;

class CobrancaSessaoTest extends ConsultorioTestCase
{
    private function consultaMatriculada(float $valor = 200): Consulta
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2, valor: $valor);

        return Consulta::where('paciente_id', $paciente->id)->orderBy('data_hora_consulta')->first();
    }

    private function marcar(Consulta $consulta, string $status): void
    {
        $this->patch("/agenda/{$consulta->id}/status", ['status' => $status])->assertSessionHasNoErrors();
    }

    public function test_marcar_realizado_cria_cobranca_pendente_com_o_valor_da_matricula(): void
    {
        $consulta = $this->consultaMatriculada(valor: 180);

        $this->marcar($consulta, 'realizado');

        $cobranca = Cobranca::sole();
        $this->assertSame($consulta->id, $cobranca->agenda_id);
        $this->assertSame($consulta->paciente_id, $cobranca->paciente_id);
        $this->assertEquals(180, $cobranca->valor);
        $this->assertSame('2026-09-30', $cobranca->vencimento->toDateString());
        $this->assertSame('pendente', $cobranca->situacao);
        $this->assertSame('Sessão — 30/09/2026', $cobranca->titulo);
    }

    public function test_desmarcar_realizado_cancela_a_cobranca_pendente(): void
    {
        $consulta = $this->consultaMatriculada();
        $this->marcar($consulta, 'realizado');

        $this->marcar($consulta, 'falta');

        $this->assertSame('cancelado', Cobranca::sole()->situacao);
        $this->assertSame('falta', $consulta->fresh()->status);
    }

    public function test_marcar_realizado_de_novo_reativa_a_mesma_cobranca(): void
    {
        $consulta = $this->consultaMatriculada();
        $this->marcar($consulta, 'realizado');
        $this->marcar($consulta, 'confirmado');

        $this->marcar($consulta, 'realizado');

        $this->assertSame('pendente', Cobranca::sole()->situacao);
    }

    public function test_cobranca_ja_paga_nao_e_cancelada_ao_desmarcar(): void
    {
        $consulta = $this->consultaMatriculada();
        $this->marcar($consulta, 'realizado');
        $cobranca = Cobranca::sole();
        $this->post("/cobrancas/{$cobranca->id}/pagamento", ['data' => '30/09/2026', 'valor' => 200, 'forma' => 'Pix']);

        $this->marcar($consulta, 'falta');

        $this->assertSame('pago', $cobranca->fresh()->situacao);
    }

    public function test_cobranca_recebida_em_parte_nao_e_cancelada_ao_desmarcar(): void
    {
        $consulta = $this->consultaMatriculada();
        $this->marcar($consulta, 'realizado');
        $cobranca = Cobranca::sole();
        $this->post("/cobrancas/{$cobranca->id}/pagamento", ['data' => '30/09/2026', 'valor' => 50, 'forma' => 'Pix']);

        $this->marcar($consulta, 'falta');

        $this->assertSame('pendente', $cobranca->fresh()->situacao);
        $this->assertEquals(150, $cobranca->fresh()->saldo());
    }

    public function test_consulta_de_paciente_sem_matricula_nao_gera_cobranca(): void
    {
        $consulta = Consulta::create([
            'paciente_id' => $this->paciente()->id,
            'data_hora_consulta' => Carbon::parse('2026-09-28 08:00'),
            'modalidade' => 'presencial',
        ]);

        $this->marcar($consulta, 'realizado');

        $this->assertSame('realizado', $consulta->fresh()->status);
        $this->assertSame(0, Cobranca::count());
    }

    public function test_cobranca_pendente_vencida_aparece_como_atrasada(): void
    {
        $cobranca = Cobranca::create([
            'paciente_id' => $this->paciente()->id,
            'titulo' => 'Sessão avulsa',
            'valor' => 100,
            'vencimento' => '2026-09-27',
        ]);

        $this->assertSame('Atrasado', $cobranca->status());
        $this->assertSame('Pendente', $cobranca->fill(['vencimento' => '2026-09-28'])->status());
    }
}
