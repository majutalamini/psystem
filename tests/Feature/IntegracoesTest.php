<?php

namespace Tests\Feature;

use App\Models\Configuracao;
use Illuminate\Support\Facades\Schema;

class IntegracoesTest extends ConsultorioTestCase
{
    public function test_remocao_da_integracao_preserva_pacientes_e_preferencias(): void
    {
        $paciente = $this->paciente(['nome' => 'Paciente preservado']);
        $config = Configuracao::atual();
        $config->update(['meta_faturamento_mensal' => 1234, 'almoco_inicio' => '12:00', 'almoco_fim' => '13:00']);

        $migration = require database_path('migrations/2026_11_04_000001_remove_whatsapp_integration.php');
        $migration->down();
        $this->assertTrue(Schema::hasTable('mensagens_whatsapp'));
        $migration->up();

        $this->assertFalse(Schema::hasTable('mensagens_whatsapp'));
        $this->assertFalse(Schema::hasColumn('pacientes', 'aceita_whatsapp'));
        foreach (['whatsapp_ativo', 'whatsapp_numero', 'whatsapp_dias_antes', 'mensagem_lembrete', 'mensagem_retorno', 'mensagem_cobranca'] as $coluna) {
            $this->assertFalse(Schema::hasColumn('configuracoes', $coluna));
        }
        $this->assertSame('Paciente preservado', $paciente->fresh()->nome);
        $this->assertEquals(1234, $config->fresh()->meta_faturamento_mensal);
        $this->assertSame('12:00:00', substr($config->fresh()->almoco_inicio.':00', 0, 8));
    }

    public function test_rotas_da_integracao_removida_nao_estao_disponiveis(): void
    {
        foreach (['/whatsapp/enviar', '/configuracoes/whatsapp/teste', '/configuracoes/whatsapp/desconectar', '/configuracoes/whatsapp/enviar-agora'] as $rota) {
            $this->post($rota)->assertNotFound();
        }
    }
}
