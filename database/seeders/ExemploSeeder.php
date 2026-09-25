<?php

namespace Database\Seeders;

use App\Models\Despesa;
use App\Models\Paciente;
use App\Services\AgendaMatricula;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Dados de exemplo para testar as telas: os pacientes do protótipo, com matrícula,
 * quatro semanas de sessões realizadas (e cobradas) e algumas despesas.
 * Uso: php artisan db:seed --class=ExemploSeeder
 */
class ExemploSeeder extends Seeder
{
    public function run(AgendaMatricula $agenda): void
    {
        foreach (require __DIR__.'/dados/pacientes_exemplo.php' as $dados) {
            $matricula = $dados['matricula'] ?? null;
            unset($dados['matricula']);

            $paciente = Paciente::forceCreate($dados); // forceCreate mantém a data de cadastro do exemplo
            if (! $matricula) {
                continue;
            }

            $matricula = $paciente->matricula()->create([
                'inicio_da_matricula' => today()->subWeeks(4),
                'dia_da_matricula' => $matricula['dia'],
                'horario_da_matricula' => $matricula['horario'],
                'tipo_da_consulta' => $matricula['tipo'],
                'valor_sessao' => $matricula['valor'],
            ]);

            // Últimas quatro semanas: sessões realizadas; as duas mais antigas já pagas.
            for ($semana = 4; $semana >= 1; $semana--) {
                $dia = today()->subWeeks($semana)->startOfWeek(Carbon::MONDAY)->addDays($matricula->diaIso() - 1);
                $consulta = $matricula->consultas()->create([
                    'paciente_id' => $paciente->id,
                    'data_hora_consulta' => $dia->setTimeFromTimeString($matricula->horario_da_matricula),
                    'modalidade' => $matricula->tipo_da_consulta,
                    'status' => 'confirmado',
                ]);
                $consulta->alterarStatus('realizado');

                if ($semana >= 3) {
                    $cobranca = $consulta->cobranca()->first();
                    $cobranca->pagamentos()->create([
                        'valor_pago' => $cobranca->valor,
                        'metodo_pagamento' => 'pix',
                        'data_pagamento' => $cobranca->vencimento,
                    ]);
                    $cobranca->update(['situacao' => 'pago']);
                }
            }

            $agenda->gerar($matricula);
        }

        foreach ([
            ['Aluguel do consultório', 'Estrutura', 1200, 5],
            ['Assinatura plataforma Psystem', 'Software', 89, 16],
            ['Contador', 'Serviços', 350, 25],
            ['Energia elétrica', 'Estrutura', 180, 18],
        ] as [$descricao, $categoria, $valor, $dia]) {
            Despesa::create([
                'descricao' => $descricao,
                'categoria' => $categoria,
                'valor' => $valor,
                'vencimento' => today()->startOfMonth()->addDays($dia - 1),
            ]);
        }
    }
}
