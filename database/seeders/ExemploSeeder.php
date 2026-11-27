<?php

namespace Database\Seeders;

use App\Models\Consulta;
use App\Models\Despesa;
use App\Models\Matricula;
use App\Models\Paciente;
use App\Models\Responsavel;
use App\Services\Contratos;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Dados de exemplo para testar as telas: os pacientes do protótipo, cada um com contrato de 4 sessões começado há
 * quatro semanas (sessões realizadas, primeiro pacote pago e o segundo já renovado), um paciente menor de idade com
 * responsável, um paciente bloqueado por inadimplência e algumas despesas.
 * Uso: php artisan db:seed --class=ExemploSeeder
 */
class ExemploSeeder extends Seeder
{
    public function run(Contratos $contratos): void
    {
        $exemplos = require __DIR__.'/dados/pacientes_exemplo.php';
        $ultimoComMatricula = array_key_last(array_filter($exemplos, fn ($d) => isset($d['matricula'])));

        foreach ($exemplos as $i => $dados) {
            $matricula = $dados['matricula'] ?? null;
            unset($dados['matricula']);

            $paciente = Paciente::forceCreate([...$dados, 'status_paciente' => 'inativo']); // mantém a data de cadastro
            if ($matricula) {
                // O último fica com o pacote vencido sem pagar, para mostrar o contrato bloqueado.
                $this->contratoComHistorico($contratos, $paciente, $matricula, pagarPrimeiro: $i !== $ultimoComMatricula);
            }
        }

        // Paciente menor de idade: precisa de responsável.
        $responsavel = Responsavel::create([
            'nome' => 'Carla Mendes',
            'cpf' => '52998224725',
            'telefone' => '(48) 98836-4746',
            'email' => 'carla.mendes@email.com',
            'endereco' => 'Rua Henrique Lage, 88 — Centro',
        ]);
        $menor = Paciente::create([
            'nome' => 'Lucas Mendes',
            'cpf' => '11144477735',
            'telefone' => '(48) 98836-4746',
            'data_nascimento' => today()->subYears(11)->subMonths(3),
            'sexo' => 'masculino',
            'endereco_cidade' => 'Criciúma',
            'endereco_uf' => 'SC',
            'status_paciente' => 'inativo',
            'responsavel_id' => $responsavel->id,
            'responsavel_parentesco' => 'Mãe',
        ]);
        $this->contratoComHistorico($contratos, $menor, ['dia' => 'quinta-feira', 'horario' => '15:00', 'tipo' => 'presencial', 'valor' => 640], pagarPrimeiro: true, sessoes: 4);

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

    /** Contrato começado há quatro semanas, com as sessões já realizadas; depois renova e acerta o bloqueio. */
    private function contratoComHistorico(Contratos $contratos, Paciente $paciente, array $m, bool $pagarPrimeiro, int $sessoes = 4): void
    {
        $weekday = array_search($m['dia'], Matricula::DIAS, true);
        $inicio = today()->subWeeks(4)->startOfWeek(Carbon::MONDAY);

        $contrato = $contratos->criar($paciente, ['sessoes' => $sessoes, 'valor' => $m['valor'], 'inicio' => $inicio], [[
            'weekday' => $weekday,
            'time' => $m['horario'],
            'tipo' => $m['tipo'] === 'online' ? 'Consulta online' : 'Consulta presencial',
        ]]);
        $matricula = $contrato->matriculas()->first();

        // Últimas quatro semanas: sessões já realizadas.
        for ($semana = 4; $semana >= 1; $semana--) {
            $dia = today()->subWeeks($semana)->startOfWeek(Carbon::MONDAY)->addDays($weekday);
            Consulta::create([
                'paciente_id' => $paciente->id,
                'matricula_id' => $matricula->id,
                'data_hora_consulta' => $dia->setTimeFromTimeString($m['horario']),
                'modalidade' => $m['tipo'],
                'status' => 'realizado',
            ]);
        }

        // Primeiro pacote: venceu no início do contrato.
        $cobranca = $contrato->cobrancas()->where('ciclo', 1)->first();
        $cobranca->update(['vencimento' => $inicio]);
        if ($pagarPrimeiro) {
            $cobranca->pagamentos()->create(['valor_pago' => $cobranca->valor, 'metodo_pagamento' => 'pix', 'data_pagamento' => $inicio]);
            $cobranca->update(['situacao' => 'pago']);
        }

        $contratos->renovar($contrato->fresh());
        $contratos->sincronizarInadimplencia($paciente->fresh());
    }
}
