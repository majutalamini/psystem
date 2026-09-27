<?php

namespace App\Models;

use App\Support\Tela;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Uma mensagem de WhatsApp enviada (ou simulada) pelo sistema. */
class MensagemWhatsapp extends Model
{
    protected $table = 'mensagens_whatsapp';

    const CREATED_AT = 'criado_em';

    const UPDATED_AT = null;

    public const TIPOS = ['lembrete' => 'Lembrete de sessão', 'cobranca' => 'Cobrança', 'teste' => 'Teste'];

    public const SITUACOES = ['simulada' => 'Simulada', 'enviada' => 'Enviada', 'erro' => 'Erro'];

    protected $fillable = ['paciente_id', 'agenda_id', 'cobranca_id', 'tipo', 'telefone', 'texto', 'situacao', 'id_externo', 'erro'];

    public function paciente(): BelongsTo
    {
        return $this->belongsTo(Paciente::class);
    }

    public function paraTela(): array
    {
        return [
            'id' => $this->id,
            'quando' => $this->criado_em->format('d/m/Y H:i'),
            'paciente' => $this->paciente?->nome,
            'telefone' => $this->telefone,
            'tipo' => self::TIPOS[$this->tipo] ?? $this->tipo,
            'texto' => $this->texto,
            'situacao' => self::SITUACOES[$this->situacao] ?? $this->situacao,
            'situacaoKey' => $this->situacao,
            'erro' => $this->erro,
        ];
    }
}
