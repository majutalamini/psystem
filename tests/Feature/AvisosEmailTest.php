<?php

namespace Tests\Feature;

use App\Models\Cobranca;
use App\Models\Consulta;
use App\Models\Despesa;
use App\Notifications\ConsultaEmBreve;
use App\Notifications\ContasAVencer;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;

/** Agora é segunda, 28/09/2026 às 10:00. */
class AvisosEmailTest extends ConsultorioTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
    }

    private function consulta(string $quando, string $status = 'agendado'): Consulta
    {
        return Consulta::create([
            'paciente_id' => $this->paciente(['nome' => "Paciente {$quando}"])->id,
            'data_hora_consulta' => Carbon::parse($quando),
            'modalidade' => 'presencial',
            'status' => $status,
        ]);
    }

    public function test_avisa_uma_vez_a_consulta_que_comeca_na_proxima_hora(): void
    {
        $proxima = $this->consulta('2026-09-28 11:00');
        $this->consulta('2026-09-28 11:30');          // mais de 1 hora: ainda não
        $this->consulta('2026-09-28 10:30', 'cancelado');

        $this->artisan('avisos:consultas')->assertSuccessful();
        $this->artisan('avisos:consultas');            // rodar de novo não repete

        Notification::assertSentToTimes($this->psicologa, ConsultaEmBreve::class, 1);
        Notification::assertSentTo($this->psicologa, ConsultaEmBreve::class, function (ConsultaEmBreve $n) use ($proxima) {
            return $n->consulta->is($proxima)
                && $n->toMail($this->psicologa)->subject === "Consulta às 11:00 — {$proxima->paciente->nome}";
        });
        $this->assertNotNull($proxima->fresh()->aviso_enviado_em);

        // Meia hora depois a das 11:30 entra na janela.
        $this->travelTo(Carbon::parse('2026-09-28 10:30:00'));
        $this->artisan('avisos:consultas');
        Notification::assertSentToTimes($this->psicologa, ConsultaEmBreve::class, 2);
    }

    public function test_avisa_contas_que_vencem_nos_proximos_3_dias_num_email_so(): void
    {
        $aluguel = Despesa::create(['descricao' => 'Aluguel', 'categoria' => 'Estrutura', 'valor' => 1200, 'vencimento' => '2026-10-01']);
        Despesa::create(['descricao' => 'Longe', 'categoria' => 'Outros', 'valor' => 10, 'vencimento' => '2026-10-02']);
        Despesa::create(['descricao' => 'Paga', 'categoria' => 'Outros', 'valor' => 10, 'vencimento' => '2026-09-29', 'pago_em' => '2026-09-27']);
        Despesa::create(['descricao' => 'Vencida', 'categoria' => 'Outros', 'valor' => 10, 'vencimento' => '2026-09-27']);
        $cobranca = Cobranca::create([
            'paciente_id' => $this->paciente()->id,
            'titulo' => 'Sessão avulsa',
            'valor' => 200,
            'vencimento' => '2026-09-28',
        ]);

        $this->artisan('avisos:vencimentos')->assertSuccessful();
        $this->artisan('avisos:vencimentos');           // no dia seguinte não repete as mesmas

        Notification::assertSentToTimes($this->psicologa, ContasAVencer::class, 1);
        Notification::assertSentTo($this->psicologa, ContasAVencer::class, function (ContasAVencer $n) use ($aluguel, $cobranca) {
            $texto = implode("\n", $n->toMail($this->psicologa)->introLines);

            return $n->despesas->modelKeys() === [$aluguel->id]
                && $n->cobrancas->modelKeys() === [$cobranca->id]
                && str_contains($texto, 'Aluguel — R$ 1.200,00 — vence em 01/10')
                && str_contains($texto, 'falta R$ 200,00 — vence hoje');
        });
    }

    public function test_sem_contas_a_vencer_nao_manda_email(): void
    {
        $this->artisan('avisos:vencimentos')->assertSuccessful();

        Notification::assertNothingSent();
    }
}
