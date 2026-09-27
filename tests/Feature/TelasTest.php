<?php

namespace Tests\Feature;

use App\Models\AnamnesePergunta;
use App\Models\Configuracao;
use App\Models\Consulta;
use App\Models\Paciente;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\ExemploSeeder;

/** Abre todas as telas com os dados de exemplo: pega erros de execução nos controllers e nos seeders. */
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

    public function test_todas_as_telas_abrem_com_os_dados_de_exemplo(): void
    {
        $this->seed([DatabaseSeeder::class, ExemploSeeder::class]);
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

    public function test_salvar_anamnese_substitui_as_respostas(): void
    {
        $this->seed(DatabaseSeeder::class);
        $paciente = $this->paciente();
        [$p1, $p2] = AnamnesePergunta::orderBy('id')->limit(2)->pluck('id')->all();

        $this->put("/pacientes/{$paciente->id}/anamnese", ['respostas' => [$p1 => 'Primeira', $p2 => 'Segunda']])
            ->assertSessionHasNoErrors();
        $this->put("/pacientes/{$paciente->id}/anamnese", ['respostas' => [$p1 => 'Nova', $p2 => '  ']]);

        $this->assertSame([$p1 => 'Nova'], $paciente->respostasAnamnese()->pluck('valor_resposta', 'pergunta_id')->all());
    }

    public function test_salvar_configuracoes(): void
    {
        $this->put('/configuracoes', [
            'perfil' => ['nome' => 'Dra. Nova', 'crp' => '12/00001', 'email' => 'teste@psystem.com', 'telefone' => ''],
            'senha' => ['atual' => '', 'nova' => ''],
            'horario' => ['dias' => ['Seg', 'Qua'], 'inicio' => '09:00', 'fim' => '12:00', 'duracao' => 45],
            'goals' => ['faturamentoMensal' => 5000, 'horasSemanais' => 10, 'sessoesSemanais' => 12, 'novosPacientesMes' => 2],
            'whatsapp' => ['enabled' => false, 'numero' => '', 'diasAntes' => 1, 'lembrete' => 'Oi', 'retorno' => '', 'cobranca' => ''],
        ])->assertSessionHasNoErrors()->assertSessionHas('aviso');

        $this->assertSame('Dra. Nova', $this->psicologa->fresh()->nome);
        $this->assertSame(['09:00', '10:00', '11:00'], Configuracao::atual()->horarios());
    }
}
