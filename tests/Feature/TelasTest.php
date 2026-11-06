<?php

namespace Tests\Feature;

use App\Actions\CriarConsulta;
use App\Models\AnamnesePergunta;
use App\Models\Configuracao;
use App\Models\Consulta;
use App\Models\Paciente;
use App\Models\RegistroAcao;
use Database\Seeders\DatabaseSeeder;

/** Abre as telas com dados mínimos criados pelo próprio teste e a seed de instalação. */
class TelasTest extends ConsultorioTestCase
{
    public function test_login_redireciona_quem_nao_esta_logado(): void
    {
        $this->app['auth']->guard()->logout();

        $this->get('/')->assertRedirect('/login');
        $this->get('/login')->assertOk();
    }

    public function test_login_com_a_senha_certa(): void
    {
        $this->app['auth']->guard()->logout();

        $this->post('/login', ['email' => 'teste@psystem.com', 'password' => 'errada'])->assertSessionHasErrors('email');
        $this->post('/login', ['email' => 'teste@psystem.com', 'password' => 'segredo123'])->assertRedirect('/');
        $this->assertAuthenticatedAs($this->psicologa);
    }

    public function test_todas_as_telas_abrem_com_dados_minimos(): void
    {
        $this->seed(DatabaseSeeder::class);
        $paciente = $this->paciente();
        CriarConsulta::executar([
            'paciente_id' => $paciente->id,
            'data_hora_consulta' => today()->subWeek()->setTime(8, 0),
            'modalidade' => 'presencial',
        ])->alterarStatus('realizado');
        $this->assertGreaterThan(0, Paciente::count());
        $this->assertGreaterThan(0, Consulta::where('status', 'realizado')->count());

        $paciente = Paciente::first();
        foreach ([
            '/',
            '/agenda',
            '/agenda?data=2026-10-07',
            '/pacientes',
            "/pacientes/{$paciente->id}",
            '/prontuarios',
            "/prontuarios?paciente={$paciente->id}",
            '/financeiro',
            '/relatorios',
            '/declaracoes',
            '/configuracoes',
        ] as $url) {
            $this->get($url)->assertOk();
        }
    }

    public function test_seed_inicial_nao_cria_pacientes_e_configuracoes_salvam(): void
    {
        // Instalação nova: a configuração vem do seed, não do padrão criado pela base dos testes.
        Configuracao::query()->delete();
        $this->seed(DatabaseSeeder::class);
        $this->assertDatabaseCount('pacientes', 0);
        $this->assertDatabaseCount('matriculas', 0);
        $config = Configuracao::atual();

        $this->put('/configuracoes', [
            'perfil' => ['nome' => 'Dra. Teste', 'crp' => '12/00001', 'email' => 'teste@psystem.com'],
            'horario' => [...$config->horario(), 'simultaneas' => null],
            'goals' => $config->metas(),
        ])->assertSessionHasNoErrors();
    }

    public function test_paciente_pode_ter_varias_anamneses(): void
    {
        $this->seed(DatabaseSeeder::class);
        $paciente = $this->paciente();
        [$p1, $p2] = AnamnesePergunta::orderBy('id')->limit(2)->pluck('id')->all();

        $this->post("/pacientes/{$paciente->id}/anamneses", ['titulo' => 'Acolhimento', 'respostas' => [$p1 => 'Primeira', $p2 => 'Segunda']])
            ->assertSessionHasNoErrors();
        $this->post("/pacientes/{$paciente->id}/anamneses", ['respostas' => [$p1 => 'Outra']])
            ->assertSessionHasNoErrors();

        $this->assertSame(2, $paciente->anamneses()->count());
        $primeira = $paciente->anamneses()->where('titulo', 'Acolhimento')->first();
        $this->assertSame([$p1 => 'Primeira', $p2 => 'Segunda'], $primeira->respostas()->pluck('valor_resposta', 'pergunta_id')->all());
    }

    public function test_editar_anamnese_so_muda_ela_mesma(): void
    {
        $this->seed(DatabaseSeeder::class);
        $paciente = $this->paciente();
        [$p1, $p2] = AnamnesePergunta::orderBy('id')->limit(2)->pluck('id')->all();
        $this->post("/pacientes/{$paciente->id}/anamneses", ['respostas' => [$p1 => 'A', $p2 => 'B']]);
        $this->post("/pacientes/{$paciente->id}/anamneses", ['respostas' => [$p1 => 'C']]);
        [$primeira, $segunda] = $paciente->anamneses()->orderBy('id')->get()->all();

        $this->put("/anamneses/{$primeira->id}", ['respostas' => [$p1 => 'Nova', $p2 => '  '], 'versao' => 1])->assertSessionHasNoErrors();

        $this->assertSame([$p1 => 'Nova'], $primeira->respostas()->pluck('valor_resposta', 'pergunta_id')->all());
        $this->assertSame([$p1 => 'C'], $segunda->respostas()->pluck('valor_resposta', 'pergunta_id')->all());
        $this->assertSame(2, $primeira->fresh()->versao);
    }

    public function test_edicao_clinica_sobre_versao_antiga_e_recusada_sem_sobrescrever(): void
    {
        $this->seed(DatabaseSeeder::class);
        $paciente = $this->paciente();
        $p1 = AnamnesePergunta::orderBy('id')->value('id');
        $this->post("/pacientes/{$paciente->id}/anamneses", ['respostas' => [$p1 => 'Original']]);
        $anamnese = $paciente->anamneses()->sole();

        // A e B abriram a versão 1; A salva primeiro.
        $this->put("/anamneses/{$anamnese->id}", ['respostas' => [$p1 => 'De A'], 'versao' => 1])->assertSessionHasNoErrors();
        $this->put("/anamneses/{$anamnese->id}", ['respostas' => [$p1 => 'De B'], 'versao' => 1])->assertSessionHasErrors('versao');
        $this->assertSame([$p1 => 'De A'], $anamnese->respostas()->pluck('valor_resposta', 'pergunta_id')->all());

        $prontuario = $paciente->prontuarios()->create(['psicologo_id' => $this->psicologa->id, 'data_atendimento' => '2026-09-01', 'observacoes_consulta' => 'Original']);
        $form = ['date' => '01/09/2026', 'descricao' => 'De A', 'versao' => 1];
        $this->put("/prontuarios/{$prontuario->id}", $form)->assertSessionHasNoErrors();
        $this->put("/prontuarios/{$prontuario->id}", [...$form, 'descricao' => 'De B'])->assertSessionHasErrors('versao');
        $this->assertSame('De A', $prontuario->fresh()->observacoes_consulta);
        $this->assertSame(2, $prontuario->fresh()->versao);
        $this->assertSame(2, RegistroAcao::where('acao', 'like', '%.editar')->count());
    }

    public function test_excluir_anamnese_mantem_as_outras_e_exige_alguma_resposta(): void
    {
        $this->seed(DatabaseSeeder::class);
        $paciente = $this->paciente();
        $p1 = AnamnesePergunta::orderBy('id')->value('id');
        $this->post("/pacientes/{$paciente->id}/anamneses", ['respostas' => [$p1 => 'A']]);
        $this->post("/pacientes/{$paciente->id}/anamneses", ['respostas' => [$p1 => 'B']]);
        $primeira = $paciente->anamneses()->orderBy('id')->first();

        $this->delete("/anamneses/{$primeira->id}");
        $this->assertSame(1, $paciente->anamneses()->count());
        $this->assertSame(1, $paciente->respostasAnamnese()->count());

        $this->post("/pacientes/{$paciente->id}/anamneses", ['respostas' => [$p1 => '  ']])->assertSessionHasErrors('respostas');
        $this->assertSame(1, $paciente->anamneses()->count());
    }

    public function test_salvar_configuracoes(): void
    {
        $this->put('/configuracoes', [
            'perfil' => ['nome' => 'Dra. Nova', 'crp' => '12/00001', 'email' => 'teste@psystem.com', 'telefone' => ''],
            'senha' => ['atual' => '', 'nova' => ''],
            'horario' => ['dias' => ['Seg', 'Qua'], 'inicio' => '09:00', 'fim' => '12:00', 'duracao' => 45],
            'goals' => ['faturamentoMensal' => 5000, 'horasSemanais' => 10, 'sessoesSemanais' => 12, 'novosPacientesMes' => 2],
        ])->assertSessionHasNoErrors()->assertSessionHas('aviso');

        $this->assertSame('Dra. Nova', $this->psicologa->fresh()->nome);
        $this->assertSame(['09:00', '09:45', '10:30', '11:15'], Configuracao::atual()->horarios());
    }
}
