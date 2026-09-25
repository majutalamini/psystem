<?php

namespace App\Models;

use App\Support\Tela;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Prontuario extends Model
{
    protected $table = 'prontuarios';

    const CREATED_AT = 'criado_em';

    const UPDATED_AT = null;

    protected $fillable = [
        'paciente_id', 'psicologo_id', 'agenda_id', 'data_atendimento',
        'tecnicas', 'objetivo', 'observacoes_consulta',
    ];

    protected function casts(): array
    {
        return ['data_atendimento' => 'date'];
    }

    public function paciente(): BelongsTo
    {
        return $this->belongsTo(Paciente::class);
    }

    /** $numero é a posição do registro na ordem dos atendimentos ("Sessão N"). */
    public function paraTela(int $numero): array
    {
        return [
            'id' => $this->id,
            'sessao' => "Sessão {$numero}",
            'date' => Tela::data($this->data_atendimento),
            'tecnicas' => $this->tecnicas,
            'objetivo' => $this->objetivo,
            'descricao' => $this->observacoes_consulta,
        ];
    }

    /** Registros de um paciente, do mais recente para o mais antigo, já numerados. */
    public static function listaDoPaciente(int $pacienteId): array
    {
        $registros = static::where('paciente_id', $pacienteId)->orderBy('data_atendimento')->orderBy('id')->get();

        return $registros->values()->map(fn ($r, $i) => $r->paraTela($i + 1))->reverse()->values()->all();
    }
}
