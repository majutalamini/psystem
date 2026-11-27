<?php

namespace Tests\Feature;

use App\Models\Cobranca;
use App\Models\Consulta;
use App\Models\Despesa;
use App\Models\Paciente;
use App\Models\Responsavel;

/** Responsável de paciente menor e notificações do cabeçalho. Hoje é segunda 28/09/2026 às 10:00. */
class ResponsavelNotificacaoTest extends ConsultorioTestCase
{
    private function menor(array $dados = []): array
    {
        return [
            'name' => 'Criança Teste',
            'cpf' => '123.456.789-09',
            'nascimento' => '10/05/2016',
            'phone' => '(48) 98888-0000',
            ...$dados,
        ];
    }

    public function test_paciente_menor_de_idade_exige_responsavel(): void
    {
        $this->post('/pacientes', $this->menor())->assertSessionHasErrors('responsavelId');
        $this->assertSame(0, Paciente::count());

        $responsavel = Responsavel::create(['nome' => 'Ana Mãe', 'telefone' => '(48) 90000-0000']);
        $this->post('/pacientes', $this->menor(['responsavelId' => $responsavel->id, 'parentesco' => 'Mãe']))->assertSessionHasNoErrors();

        $paciente = Paciente::sole();
        $this->assertSame($responsavel->id, $paciente->responsavel_id);
        $this->assertSame('Mãe', $paciente->responsavel_parentesco);

        $tela = Paciente::comResumo()->find($paciente->id)->paraTela();
        $this->assertSame(['id' => $responsavel->id, 'name' => 'Ana Mãe', 'phone' => '(48) 90000-0000', 'parentesco' => 'Mãe'], $tela['responsavel']);
    }

    public function test_adulto_pode_ficar_sem_responsavel(): void
    {
        $this->post('/pacientes', $this->menor(['nascimento' => '01/01/1990']))->assertSessionHasNoErrors();
    }

    public function test_cadastro_e_perfil_do_responsavel(): void
    {
        $this->from('/responsaveis')->post('/responsaveis', [
            'name' => 'Carlos Pai', 'cpf' => '529.982.247-25', 'phone' => '(48) 91111-2222', 'email' => 'carlos@email.com',
        ])->assertSessionHasNoErrors()->assertSessionHas('novoResponsavel');

        $responsavel = Responsavel::sole();
        $this->assertSame('52998224725', $responsavel->cpf);
        $filho = $this->paciente(['nome' => 'Filho', 'responsavel_id' => $responsavel->id, 'responsavel_parentesco' => 'Pai']);

        $props = $this->get("/responsaveis/{$responsavel->id}")->assertOk()->viewData('page')['props'];
        $this->assertSame('Carlos Pai', $props['guardian']['name']);
        $this->assertSame([['id' => $filho->id, 'parentesco' => 'Pai']], collect($props['guardian']['pacientes'])->map(fn ($p) => ['id' => $p['id'], 'parentesco' => $p['parentesco']])->all());

        $lista = $this->get('/responsaveis')->assertOk()->viewData('page')['props']['guardians'];
        $this->assertSame(1, $lista[0]['dependentes']);
    }

    public function test_responsavel_de_menor_nao_pode_ser_excluido(): void
    {
        $responsavel = Responsavel::create(['nome' => 'Ana Mãe', 'telefone' => '(48) 90000-0000']);
        $this->paciente(['data_nascimento' => '2016-05-10', 'responsavel_id' => $responsavel->id]);

        $this->from("/responsaveis/{$responsavel->id}")->delete("/responsaveis/{$responsavel->id}")->assertSessionHasErrors('responsavel');
        $this->assertSame(1, Responsavel::count());
    }

    public function test_notificacoes_de_financeiro_e_agenda_e_dispensar(): void
    {
        $paciente = $this->paciente(['nome' => 'Bruna']);
        Despesa::create(['descricao' => 'Aluguel', 'categoria' => 'Estrutura', 'valor' => 1200, 'vencimento' => '2026-09-29']);
        Despesa::create(['descricao' => 'Longe', 'categoria' => 'Estrutura', 'valor' => 10, 'vencimento' => '2026-10-20']);
        Cobranca::create(['paciente_id' => $paciente->id, 'titulo' => 'Pacote', 'valor' => 300, 'vencimento' => '2026-09-25']);
        Cobranca::create(['paciente_id' => $paciente->id, 'titulo' => 'Pacote 2', 'valor' => 300, 'vencimento' => '2026-09-30']);
        Consulta::create(['paciente_id' => $paciente->id, 'data_hora_consulta' => '2026-09-28 15:00', 'modalidade' => 'online']);
        Consulta::create(['paciente_id' => $paciente->id, 'data_hora_consulta' => '2026-09-28 08:00', 'modalidade' => 'online']); // já passou

        $notificacoes = collect($this->get('/')->viewData('page')['props']['notifications']);

        $this->assertSame(
            ['Mensalidade em atraso', 'Lembrete: pagar conta', 'Mensalidade a vencer', 'Sessão hoje às 15:00'],
            $notificacoes->pluck('titulo')->all(),
        );
        $this->assertSame(['financeiro', 'financeiro', 'financeiro', 'agenda'], $notificacoes->pluck('categoria')->all());
        $this->assertStringContainsString('Bruna', $notificacoes[0]['texto']);
        $this->assertStringContainsString('vence amanhã', $notificacoes[1]['texto']);

        $this->from('/')->post('/notificacoes/lidas', ['chaves' => [$notificacoes[3]['chave']]])->assertSessionHasNoErrors();
        $this->assertCount(3, $this->get('/')->viewData('page')['props']['notifications']);

        // O atraso dispensado volta no dia seguinte.
        $this->post('/notificacoes/lidas', ['chaves' => [$notificacoes[0]['chave']]]);
        $this->assertNotContains('Mensalidade em atraso', collect($this->get('/')->viewData('page')['props']['notifications'])->pluck('titulo'));
        $this->travelTo(now()->addDay());
        $this->assertContains('Mensalidade em atraso', collect($this->get('/')->viewData('page')['props']['notifications'])->pluck('titulo'));
    }
}
