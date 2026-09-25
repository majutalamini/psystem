<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Tabela de uma linha só com as preferências do consultório. */
class Configuracao extends Model
{
    protected $table = 'configuracoes';

    public $timestamps = false;

    protected $fillable = [
        'meta_faturamento_mensal', 'meta_horas_semanais', 'meta_sessoes_semanais', 'meta_novos_pacientes_mes',
        'whatsapp_ativo', 'whatsapp_numero', 'whatsapp_dias_antes',
        'mensagem_lembrete', 'mensagem_retorno', 'mensagem_cobranca',
        'dias_atendimento', 'expediente_inicio', 'expediente_fim', 'duracao_sessao',
    ];

    protected function casts(): array
    {
        return [
            'meta_faturamento_mensal' => 'decimal:2',
            'whatsapp_ativo' => 'boolean',
            'dias_atendimento' => 'array',
        ];
    }

    public static function atual(): self
    {
        return static::firstOrCreate([], ['dias_atendimento' => ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']]);
    }

    /** Horários cheios do expediente, ex.: 08:00 ... 17:00 para expediente 08:00–18:00. */
    public function horarios(): array
    {
        $inicio = (int) substr($this->expediente_inicio, 0, 2);
        $fim = (int) substr($this->expediente_fim, 0, 2);

        return array_map(fn ($h) => sprintf('%02d:00', $h), $inicio < $fim ? range($inicio, $fim - 1) : []);
    }

    public function metas(): array
    {
        return [
            'faturamentoMensal' => (float) $this->meta_faturamento_mensal,
            'horasSemanais' => $this->meta_horas_semanais,
            'sessoesSemanais' => $this->meta_sessoes_semanais,
            'novosPacientesMes' => $this->meta_novos_pacientes_mes,
        ];
    }

    public function whatsapp(): array
    {
        return [
            'enabled' => $this->whatsapp_ativo,
            'numero' => $this->whatsapp_numero,
            'diasAntes' => $this->whatsapp_dias_antes,
            'lembrete' => $this->mensagem_lembrete,
            'retorno' => $this->mensagem_retorno,
            'cobranca' => $this->mensagem_cobranca,
        ];
    }

    public function horario(): array
    {
        return [
            'dias' => $this->dias_atendimento,
            'inicio' => substr($this->expediente_inicio, 0, 5),
            'fim' => substr($this->expediente_fim, 0, 5),
            'duracao' => $this->duracao_sessao,
        ];
    }
}
