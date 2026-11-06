<?php

namespace Database\Seeders;

use App\Actions\InstalarConfiguracao;
use App\Models\AnamneseModelo;
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
            'telefone' => '(48) 98836-4746',
            'senha_hash' => 'psystem123',
        ]);

        InstalarConfiguracao::obter([
            'meta_faturamento_mensal' => 10000,
            'meta_horas_semanais' => 20,
            'meta_sessoes_semanais' => 35,
            'meta_novos_pacientes_mes' => 5,
            'dias_atendimento' => ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
            'expediente_inicio' => '08:00',
            'expediente_fim' => '18:00',
            'duracao_sessao' => 50,
            'intervalo_sessao' => 10,
            'almoco_inicio' => '12:00',
            'almoco_fim' => '13:00',
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
