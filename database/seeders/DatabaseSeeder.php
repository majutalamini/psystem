<?php

namespace Database\Seeders;

use App\Models\AnamneseModelo;
use App\Models\Configuracao;
use App\Models\Psicologo;
use Illuminate\Database\Seeder;

/** O mínimo para o sistema funcionar: login, configurações e o modelo de anamnese. */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        Psicologo::firstOrCreate(['email' => 'isadora.talamini@psystem.com'], [
            'nome' => 'Dra. Isadora Talamini',
            'crp' => '12/34567',
            'telefone' => '(48) 99876-5432',
            'senha_hash' => 'psystem123',
        ]);

        Configuracao::firstOrCreate([], [
            'meta_faturamento_mensal' => 10000,
            'meta_horas_semanais' => 20,
            'meta_sessoes_semanais' => 35,
            'meta_novos_pacientes_mes' => 5,
            'whatsapp_ativo' => true,
            'whatsapp_numero' => '(48) 99876-5432',
            'whatsapp_dias_antes' => 2,
            'mensagem_lembrete' => 'Olá {paciente}! Passando para lembrar que sua sessão está confirmada para {data} às {hora}. Até lá!',
            'mensagem_retorno' => 'Olá {paciente}! Faz um tempo desde a nossa última sessão, em {ultimaSessao}. Se quiser retomar o acompanhamento, tenho horários disponíveis nesta semana. Um abraço!',
            'mensagem_cobranca' => 'Olá {paciente}, tudo bem? Sua sessão de {referencia} no valor de {valor} vence em {vencimento}. Qualquer dúvida, estou à disposição!',
            'dias_atendimento' => ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
            'expediente_inicio' => '08:00',
            'expediente_fim' => '18:00',
            'duracao_sessao' => 50,
        ]);

        if (! AnamneseModelo::exists()) {
            $modelo = AnamneseModelo::create(['titulo' => 'Anamnese — Acolhimento Infantil']);
            foreach (require __DIR__.'/dados/anamnese_infantil.php' as $categoria => $perguntas) {
                foreach ($perguntas as $texto) {
                    $modelo->perguntas()->create([
                        'categoria' => $categoria,
                        'texto_pergunta' => $texto,
                        'tipo_pergunta' => 'texto_livre',
                    ]);
                }
            }
        }
    }
}
