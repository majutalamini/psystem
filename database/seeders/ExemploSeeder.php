<?php

namespace Database\Seeders;

use App\Models\Cobranca;
use App\Models\Despesa;
use App\Models\Paciente;
use App\Services\AgendaMatricula;
use App\Services\Mensalidades;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Dados de exemplo para testar as telas: os pacientes do protótipo, com matrícula,
 * quatro semanas de sessões realizadas, mensalidades (as dos meses anteriores pagas) e algumas despesas.
 * Uso: php artisan db:seed --class=ExemploSeeder
 */
class ExemploSeeder extends Seeder
{
    public function run(AgendaMatricula $agenda, Mensalidades $mensalidades): void
    {
        foreach (require __DIR__.'/dados/pacientes_exemplo.php' as $dados) {
            $matricula = $dados['matricula'] ?? null;
            unset($dados['matricula']);

            $paciente = Paciente::forceCreate($dados); // forceCreate mantém a data de cadastro do exemplo
            if (! $matricula) {
                continue;
            }

            $matricula = $paciente->matriculas()->create([
                'inicio_da_matricula' => today()->subWeeks(4),
                'dia_da_matricula' => $matricula['dia'],
                'horario_da_matricula' => $matricula['horario'],
                'tipo_da_consulta' => $matricula['tipo'],
                'valor_sessao' => $matricula['valor'],
            ]);

            // Últimas quatro semanas: sessões já realizadas.
            for ($semana = 4; $semana >= 1; $semana--) {
                $dia = today()->subWeeks($semana)->startOfWeek(Carbon::MONDAY)->addDays($matricula->diaIso() - 1);
                $matricula->consultas()->create([
                    'paciente_id' => $paciente->id,
                    'data_hora_consulta' => $dia->setTimeFromTimeString($matricula->horario_da_matricula),
                    'modalidade' => $matricula->tipo_da_consulta,
                    'status' => 'realizado',
                ]);
            }

            // Mensalidades: as dos dois meses anteriores já pagas; a próxima fica em aberto.
            foreach ([2, 1] as $atras) {
                $mes = today()->startOfMonth()->subMonthsNoOverflow($atras);
                $vencimento = Mensalidades::vencimento($mes, (int) $paciente->dia_vencimento);
                $cobranca = Cobranca::create([
                    'paciente_id' => $paciente->id,
                    'matricula_id' => $matricula->id,
                    'competencia' => $mes->toDateString(),
                    'titulo' => 'Mensalidade — '.$mes->format('m/Y'),
                    'valor' => $matricula->valor_sessao,
                    'vencimento' => $vencimento->toDateString(),
                    'situacao' => 'pago',
                ]);
                $cobranca->pagamentos()->create([
                    'valor_pago' => $cobranca->valor,
                    'metodo_pagamento' => 'pix',
                    'data_pagamento' => $vencimento,
                ]);
            }
            $mensalidades->gerar($matricula->setRelation('paciente', $paciente->fresh()));

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
