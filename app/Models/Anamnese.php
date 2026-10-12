<?php

namespace App\Models;

use App\Support\Tela;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Uma anamnese de um paciente (ele pode ter várias); as respostas ficam em anamnese_respostas. */
class Anamnese extends Model
{
    protected $table = 'anamneses';

    const CREATED_AT = 'criado_em';

    const UPDATED_AT = 'atualizado_em';

    protected $fillable = ['paciente_id', 'psicologo_id', 'titulo'];

    public function paciente(): BelongsTo
    {
        return $this->belongsTo(Paciente::class);
    }

    public function respostas(): HasMany
    {
        return $this->hasMany(AnamneseResposta::class);
    }

    /** Substitui as respostas desta anamnese (só perguntas válidas e não vazias). */
    public function gravarRespostas(array $respostas, int $psicologoId): void
    {
        $preenchidas = collect($respostas)
            ->map(fn ($valor) => trim((string) $valor))
            ->filter(fn ($valor) => $valor !== '');
        $validas = AnamnesePergunta::whereIn('id', $preenchidas->keys())->pluck('id');

        $this->respostas()->delete();
        foreach ($validas as $perguntaId) {
            $this->respostas()->create([
                'paciente_id' => $this->paciente_id,
                'psicologo_id' => $psicologoId,
                'pergunta_id' => $perguntaId,
                'valor_resposta' => $preenchidas[$perguntaId],
            ]);
        }
        $this->touch();
    }

    public function paraTela(): array
    {
        return [
            'id' => $this->id,
            'titulo' => $this->titulo,
            'criadoEm' => Tela::data($this->criado_em),
            'atualizadoEm' => Tela::data($this->atualizado_em),
            'respostas' => $this->respostas->pluck('valor_resposta', 'pergunta_id'),
        ];
    }

    /** Anamneses de um paciente, da mais recente para a mais antiga. */
    public static function listaDoPaciente(int $pacienteId): array
    {
        return static::with('respostas')
            ->where('paciente_id', $pacienteId)
            ->orderByDesc('criado_em')->orderByDesc('id')
            ->get()
            ->map->paraTela()
            ->all();
    }
}
