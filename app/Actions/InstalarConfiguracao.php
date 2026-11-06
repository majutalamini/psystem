<?php

namespace App\Actions;

use App\Models\Configuracao;

class InstalarConfiguracao
{
    public static function dados(array $dados = []): array
    {
        return [
            'meta_faturamento_mensal' => 0,
            'meta_horas_semanais' => 0,
            'meta_sessoes_semanais' => 0,
            'meta_novos_pacientes_mes' => 0,
            'dias_atendimento' => ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
            'expediente_inicio' => '08:00',
            'expediente_fim' => '18:00',
            'duracao_sessao' => 50,
            'intervalo_sessao' => 0,
            'consultas_simultaneas' => null, // sem limite até se confirmar quantas psicólogas atendem
            ...$dados,
        ];
    }

    public static function obter(array $dados = []): Configuracao
    {
        return Configuracao::firstOrCreate([], self::dados($dados));
    }

    public static function criar(array $dados = []): Configuracao
    {
        return Configuracao::create(self::dados($dados));
    }
}
