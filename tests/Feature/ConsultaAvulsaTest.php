<?php

namespace Tests\Feature;

use App\Models\Cobranca;
use App\Models\Consulta;

/** Consulta avulsa e a cobrança dela. Hoje, nos testes, é segunda 28/09/2026 às 10:00. */
class ConsultaAvulsaTest extends ConsultorioTestCase
{
    private function avulsa(int $pacienteId, mixed $valor, string $date = '2026-09-30', string $hora = '08:50')
    {
        return $this->from('/agenda')->post('/agenda', [
            'patientId' => $pacienteId,
            'date' => $date,
            'hora' => $hora,
            'tipo' => 'Consulta presencial',
            'status' => 'Agendado',
            'valor' => $valor,
        ]);
    }

    public function test_consulta_avulsa_com_valor_fica_em_aberto_no_perfil_sem_recorrencia(): void
    {
        $paciente = $this->paciente();

        $this->avulsa($paciente->id, 180)->assertSessionHasNoErrors();

        $consulta = Consulta::sole();
        $this->assertEquals(180, $consulta->valor);
        $this->assertNull($consulta->matricula_id);

        $cobranca = Cobranca::sole();
        $this->assertSame($consulta->id, $cobranca->agenda_id);
        $this->assertNull($cobranca->matricula_id);
        $this->assertSame($paciente->id, $cobranca->paciente_id);
        $this->assertEquals(180, $cobranca->valor);
        $this->assertSame('2026-09-30', $cobranca->vencimento->toDateString());
        $this->assertSame('Consulta avulsa — 30/09/2026', $cobranca->titulo);

        // Rodar os comandos de geração não cria nada recorrente a partir dela.
        $this->artisan('contratos:processar')->assertSuccessful();
        $this->artisan('agenda:gerar')->assertSuccessful();
        $this->assertSame(1, Cobranca::count());
    }

    public function test_consulta_avulsa_exige_o_valor(): void
    {
        $paciente = $this->paciente();

        $this->avulsa($paciente->id, '')->assertSessionHasErrors('valor');
        $this->avulsa($paciente->id, -5)->assertSessionHasErrors('valor');
        $this->assertSame(0, Consulta::count());
    }

    public function test_consulta_avulsa_de_valor_zero_nao_gera_cobranca(): void
    {
        $this->avulsa($this->paciente()->id, 0)->assertSessionHasNoErrors();

        $this->assertSame(1, Consulta::count());
        $this->assertSame(0, Cobranca::count());
    }

    public function test_cancelar_a_consulta_avulsa_cancela_a_cobranca_mas_falta_continua_cobrada(): void
    {
        $paciente = $this->paciente();
        $this->avulsa($paciente->id, 180, hora: '08:50');
        $this->avulsa($paciente->id, 150, hora: '09:40');
        [$primeira, $segunda] = Consulta::orderBy('data_hora_consulta')->get()->all();

        $this->patch("/agenda/{$primeira->id}/status", ['status' => 'cancelado'])->assertSessionHasNoErrors();
        $this->patch("/agenda/{$segunda->id}/status", ['status' => 'falta'])->assertSessionHasNoErrors();

        $this->assertSame('cancelado', $primeira->cobranca()->first()->situacao);
        $this->assertSame('pendente', $segunda->cobranca()->first()->situacao);
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
