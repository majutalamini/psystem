<?php

namespace Tests\Feature;

use App\Models\Importacao;
use Inertia\Testing\AssertableInertia;

class ImportacaoTest extends ConsultorioTestCase
{
    public function test_importacao_fica_no_historico_do_servidor(): void
    {
        $paciente = $this->paciente(['nome' => 'Maria']);

        $this->from('/importacoes')->post('/importacoes', [
            'patientId' => $paciente->id, 'tipo' => 'prontuario', 'arquivo' => 'sessao1.docx', 'anexado' => true,
        ])->assertSessionHasNoErrors();

        $this->get('/importacoes')->assertInertia(fn (AssertableInertia $page) => $page
            ->has('historico', 1)
            ->where('historico.0.paciente', 'Maria')
            ->where('historico.0.arquivo', 'sessao1.docx')
            ->where('historico.0.anexado', true)
            ->where('historico.0.quando', '28/09/2026 10:00'));
    }

    public function test_tipo_invalido_e_recusado(): void
    {
        $paciente = $this->paciente();

        $this->post('/importacoes', ['patientId' => $paciente->id, 'tipo' => 'outro', 'arquivo' => 'x.docx'])
            ->assertSessionHasErrors('tipo');
    }

    public function test_excluir_paciente_apaga_o_historico_dele(): void
    {
        $paciente = $this->paciente();
        Importacao::create(['paciente_id' => $paciente->id, 'tipo' => 'anamnese', 'arquivo' => 'a.docx']);

        $this->delete("/pacientes/{$paciente->id}");

        $this->assertSame(0, Importacao::count());
    }
}
