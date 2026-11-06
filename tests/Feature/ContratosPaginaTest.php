<?php

namespace Tests\Feature;

use App\Models\Cobranca;
use App\Models\Consulta;
use App\Models\Matricula;
use App\Models\Paciente;

class ContratosPaginaTest extends ConsultorioTestCase
{
    public function test_paginas_sem_lista_nao_recebem_patients_e_agenda_preserva_avatar(): void
    {
        $paciente = $this->paciente(['foto' => 'fotos/sintetica.png']);
        Consulta::create(['paciente_id' => $paciente->id, 'data_hora_consulta' => '2026-09-30 08:50',
            'modalidade' => 'online', 'duracao_minutos' => 50, 'status' => 'agendado']);
        foreach (['/', '/agenda?data=2026-09-30', '/financeiro', '/configuracoes', '/declaracoes', '/importacoes'] as $url) {
            $props = $this->get($url)->assertOk()->viewData('page')['props'];
            $this->assertArrayNotHasKey('patients', $props, $url);
        }
        $event = collect($this->get('/agenda?data=2026-09-30')->viewData('page')['props']['events'])->first();
        $this->assertSame('PT', $event['patientInitials']);
        // Foto pela rota autenticada (etapa 3), nunca pelo /storage público.
        $this->assertStringContainsString("/pacientes/{$paciente->id}/foto?v=", $event['patientPhoto']);
    }

    public function test_lista_pagina_no_servidor_e_nao_expoe_campos_de_perfil(): void
    {
        for ($i = 0; $i < 14; $i++) {
            $this->paciente(['nome' => sprintf('Pessoa %02d', $i)]);
        }
        $primeira = $this->get('/pacientes')->assertOk()->viewData('page')['props']['patientDirectory'];
        $this->assertCount(10, $primeira['patients']);
        $this->assertSame(14, $primeira['pagination']['total']);
        $this->assertSame(2, $primeira['pagination']['lastPage']);
        $this->assertArrayNotHasKey('cpf', collect($primeira['patients'])->first());
        $this->assertArrayNotHasKey('observacoes', collect($primeira['patients'])->first());
        $segunda = $this->get('/pacientes?page=2')->viewData('page')['props']['patientDirectory'];
        $this->assertSame(['Pessoa 10', 'Pessoa 11', 'Pessoa 12', 'Pessoa 13'], collect($segunda['patients'])->pluck('name')->all());
        $fora = $this->get('/pacientes?page=200')->viewData('page')['props']['patientDirectory'];
        $this->assertSame(2, $fora['pagination']['page']);
        $this->assertSame(collect($segunda['patients'])->pluck('id')->all(), collect($fora['patients'])->pluck('id')->all());
    }

    public function test_busca_preserva_substring_sem_transformar_porcentagem_e_underscore_em_curingas(): void
    {
        foreach (['Nome 100%', 'Nome 100_', 'Nome 100X'] as $nome) {
            $this->paciente(['nome' => $nome]);
        }
        foreach (['100%' => 'Nome 100%', '100_' => 'Nome 100_', 'nome 100x' => 'Nome 100X'] as $q => $expected) {
            $result = $this->get('/pacientes?q='.rawurlencode($q))->assertOk()->viewData('page')['props']['patientDirectory'];
            $this->assertSame([$expected], collect($result['patients'])->pluck('name')->all());
        }
        $result = $this->get('/pacientes?q='.rawurlencode(' 100'))->viewData('page')['props']['patientDirectory'];
        $this->assertSame(' 100', $result['q']);
        $this->assertSame(3, $result['pagination']['total']);
    }

    public function test_filtros_de_matricula_mantem_predicados_independentes_e_cobranca_pendente(): void
    {
        $primeiro = $this->paciente(['nome' => 'Dois horários']);
        $segundo = $this->paciente(['nome' => 'Outro horário']);
        foreach ([[$primeiro, 'segunda-feira', 'online'], [$primeiro, 'sexta-feira', 'presencial'], [$segundo, 'terça-feira', 'online']] as [$paciente, $dia, $tipo]) {
            Matricula::create(['paciente_id' => $paciente->id, 'inicio_da_matricula' => today(), 'dia_da_matricula' => $dia,
                'horario_da_matricula' => '08:50', 'tipo_da_consulta' => $tipo, 'valor_sessao' => 200, 'status_matricula' => 'ativa']);
        }
        Cobranca::create(['paciente_id' => $primeiro->id, 'titulo' => 'Pendente', 'valor' => 200, 'vencimento' => today(), 'situacao' => 'pendente']);
        Cobranca::create(['paciente_id' => $segundo->id, 'titulo' => 'Paga', 'valor' => 200, 'vencimento' => today(), 'situacao' => 'pago']);
        $params = http_build_query(['dia' => '0', 'modalidade' => 'Consulta presencial', 'cobranca' => 'pendente', 'matricula' => 'com']);
        $result = $this->get('/pacientes?'.$params)->assertOk()->viewData('page')['props']['patientDirectory'];
        $this->assertSame([$primeiro->id], collect($result['patients'])->pluck('id')->all());
        $this->assertSame(1, $result['pagination']['total']);
    }

    public function test_resumo_agregado_preserva_contagem_ultima_e_proxima_inclusive_horario_passado_de_hoje(): void
    {
        $paciente = $this->paciente();
        foreach ([['2026-09-20 08:50', 'realizado'], ['2026-09-25 08:50', 'realizado'],
            ['2026-09-28 08:50', 'agendado'], ['2026-09-29 08:50', 'cancelado'], ['2026-09-30 08:50', 'confirmado']] as [$data, $status]) {
            Consulta::create(['paciente_id' => $paciente->id, 'data_hora_consulta' => $data,
                'modalidade' => 'online', 'duracao_minutos' => 50, 'status' => $status]);
        }
        $model = Paciente::comResumo(false)->find($paciente->id);
        $this->assertFalse($model->relationLoaded('matriculas'));
        $this->assertSame(2, $model->paraLista()['sessions']);
        $this->assertSame('25/09/2026', $model->paraLista()['lastSession']);
        $this->assertSame('28/09/2026', $model->paraLista()['nextSession']);
    }

    public function test_indice_clinico_filtrado_mantem_perfil_selecionado_fora_da_lista(): void
    {
        $primeiro = $this->paciente(['nome' => 'Nome procurado']);
        $selecionado = $this->paciente(['nome' => 'Outro nome']);
        foreach (['/prontuarios', '/anamneses'] as $route) {
            $props = $this->get($route.'?paciente='.$selecionado->id.'&q=procurado')->assertOk()->viewData('page')['props'];
            $this->assertSame($selecionado->id, $props['selectedPatient']['id']);
            $this->assertSame([$primeiro->id], collect($props['patientDirectory']['patients'])->pluck('id')->all());
            $this->assertArrayNotHasKey('patients', $props);
        }
    }

    public function test_seletor_pagina_no_servidor_preserva_escolha_e_dados_da_declaracao(): void
    {
        $ultimo = null;
        for ($i = 0; $i < 25; $i++) {
            $ultimo = $this->paciente(['nome' => sprintf('Opção %02d', $i)]);
        }
        $result = $this->getJson('/pacientes/opcoes?selected='.$ultimo->id)->assertOk()->json();
        $this->assertCount(20, $result['items']);
        $this->assertSame(25, $result['pagination']['total']);
        $this->assertSame($ultimo->id, $result['selected']['id']);
        $this->assertArrayNotHasKey('cpf', $result['selected']);
        $this->assertArrayNotHasKey('matriculas', $result['selected']);
        $details = $this->getJson('/pacientes/opcoes?selected='.$ultimo->id.'&details=1')->assertOk()->json();
        $this->assertSame([], $details['selected']['matriculas']);
        $this->assertSame('28/09/2026', $details['selected']['cadastro']);
        $this->assertCount(5, $this->getJson('/pacientes/opcoes?page=2')->assertOk()->json('items'));
        $this->app['auth']->guard()->logout();
        $this->getJson('/pacientes/opcoes')->assertUnauthorized();
    }

    public function test_reservas_preservam_o_aviso_de_configuracao_e_o_estado_do_paciente(): void
    {
        $paciente = $this->paciente(['status_paciente' => 'inativo']);
        Matricula::create(['paciente_id' => $paciente->id, 'inicio_da_matricula' => today(), 'dia_da_matricula' => 'segunda-feira',
            'horario_da_matricula' => '08:50', 'tipo_da_consulta' => 'online', 'valor_sessao' => 200, 'status_matricula' => 'ativa']);
        $props = $this->get('/configuracoes')->assertOk()->viewData('page')['props'];
        $reservation = collect($props['enrollmentReservations'])->first();
        $this->assertSame($paciente->id, $reservation['patientId']);
        $this->assertFalse($reservation['patientActive']);
        $this->assertSame(0, $reservation['weekday']);
        $this->assertSame('08:50', $reservation['time']);
    }

    public function test_excluir_na_lista_preserva_busca_e_filtros_no_retorno(): void
    {
        $paciente = $this->paciente();
        $this->from('/pacientes?q=Teste&situacao=Ativo&page=2')->delete('/pacientes/'.$paciente->id)
            ->assertRedirect('/pacientes?q=Teste&situacao=Ativo&page=2');
    }
}
