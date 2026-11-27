<?php

namespace App\Models;

use App\Support\Tela;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

class Paciente extends Model
{
    protected $table = 'pacientes';

    const CREATED_AT = 'criado_em';

    const UPDATED_AT = 'atualizado_em';

    protected $fillable = [
        'nome', 'cpf', 'telefone', 'email', 'data_nascimento', 'sexo', 'endereco',
        'endereco_cidade', 'endereco_uf', 'contato_emergencia_nome',
        'contato_emergencia_telefone', 'observacoes', 'status_paciente', 'foto', 'dia_vencimento',
        'responsavel_id', 'responsavel_parentesco',
    ];

    public const STATUS = ['ativo' => 'Ativo', 'bloqueado' => 'Bloqueado', 'inativo' => 'Inativo'];

    protected function casts(): array
    {
        return ['data_nascimento' => 'date'];
    }

    public function matriculas(): HasMany
    {
        return $this->hasMany(Matricula::class);
    }

    public function contratos(): HasMany
    {
        return $this->hasMany(Contrato::class);
    }

    public function responsavel(): BelongsTo
    {
        return $this->belongsTo(Responsavel::class);
    }

    /** O contrato que ainda vale (ativo ou bloqueado); o paciente só tem um por vez. */
    public function contratoAberto(): ?Contrato
    {
        return $this->contratos()->abertos()->latest('id')->first();
    }

    /** Tem título a receber vencido e não pago? (vencido = venceu ontem ou antes). */
    public function inadimplente(): bool
    {
        return $this->cobrancas()->where('situacao', 'pendente')->whereDate('vencimento', '<', today())->exists();
    }

    public function menorDeIdade(): bool
    {
        return $this->data_nascimento !== null && $this->data_nascimento->age < 18;
    }

    public function consultas(): HasMany
    {
        return $this->hasMany(Consulta::class);
    }

    public function prontuarios(): HasMany
    {
        return $this->hasMany(Prontuario::class);
    }

    public function anamneses(): HasMany
    {
        return $this->hasMany(Anamnese::class);
    }

    public function respostasAnamnese(): HasMany
    {
        return $this->hasMany(AnamneseResposta::class);
    }

    public function cobrancas(): HasMany
    {
        return $this->hasMany(Cobranca::class);
    }

    public function documentos(): HasMany
    {
        return $this->hasMany(Documento::class);
    }

    public function ativo(): bool
    {
        return $this->status_paciente === 'ativo';
    }

    public function rotuloStatus(): string
    {
        return self::STATUS[$this->status_paciente] ?? 'Inativo';
    }

    /** O status vem do contrato: ativo, bloqueado (inadimplente) ou inativo (sem contrato em vigor). */
    public function sincronizarStatus(): void
    {
        $contrato = $this->contratoAberto();
        $this->update(['status_paciente' => match ($contrato?->status) {
            'ativo' => 'ativo',
            'bloqueado' => 'bloqueado',
            default => 'inativo',
        }]);
    }

    /** Sessões realizadas, última e próxima sessão, matrícula e cobranças em aberto. */
    public function scopeComResumo(Builder $query): void
    {
        $query
            ->withCount(['consultas as sessoes' => fn ($q) => $q->where('status', 'realizado')])
            ->withMax(['consultas as ultima_sessao' => fn ($q) => $q->where('status', 'realizado')], 'data_hora_consulta')
            ->withMin(['consultas as proxima_sessao' => fn ($q) => $q
                ->whereIn('status', ['agendado', 'confirmado'])
                ->where('data_hora_consulta', '>=', now()->startOfDay())], 'data_hora_consulta')
            ->with(['responsavel', 'contratos' => fn ($q) => $q->abertos(), 'matriculas' => fn ($q) => $q->orderBy('id'), 'cobrancas' => fn ($q) => $q->where('situacao', 'pendente')->orderBy('vencimento')->with('pagamentos')])
            ->orderBy('nome');
    }

    /** Converte os campos do formulário do front para as colunas do banco. */
    public static function dadosDoFormulario(array $f): array
    {
        return [
            'nome' => $f['name'],
            'cpf' => $f['cpf'],
            'telefone' => $f['phone'],
            'email' => $f['email'] ?? null,
            'data_nascimento' => Tela::lerData($f['nascimento']),
            'endereco' => $f['endereco'] ?? null,
            'endereco_cidade' => $f['cidade'] ?? null,
            'endereco_uf' => isset($f['uf']) ? mb_strtoupper($f['uf']) : null,
            'contato_emergencia_nome' => $f['emergenciaNome'] ?? null,
            'contato_emergencia_telefone' => $f['emergenciaTelefone'] ?? null,
            'observacoes' => $f['observacoes'] ?? null,
            'responsavel_id' => ($f['responsavelId'] ?? null) ?: null,
            'responsavel_parentesco' => ($f['responsavelId'] ?? null) ? ($f['parentesco'] ?? null) : null,
        ];
    }

    /** Formato que as telas do front esperam (ver resources/js/data/patients.js original). */
    public function paraTela(): array
    {
        $pendente = $this->relationLoaded('cobrancas') ? $this->cobrancas->first() : null;
        $ultima = $this->ultima_sessao ? Carbon::parse($this->ultima_sessao) : null;
        $proxima = $this->proxima_sessao ? Carbon::parse($this->proxima_sessao) : null;
        $contrato = $this->relationLoaded('contratos') ? $this->contratos->sortByDesc('id')->first(fn ($c) => $c->aberto()) : null;
        $responsavel = $this->relationLoaded('responsavel') ? $this->responsavel : null;

        return [
            'id' => $this->id,
            'name' => $this->nome,
            'initials' => Tela::iniciais($this->nome),
            'color' => Tela::cor($this->id),
            'photo' => $this->foto ? Storage::url($this->foto) : null,
            'phone' => Tela::telefone($this->telefone),
            'email' => $this->email,
            'status' => $this->rotuloStatus(),
            'statusKey' => $this->status_paciente,
            'sessions' => (int) ($this->sessoes ?? 0),
            'lastSession' => Tela::data($ultima) ?? '—',
            'nextSession' => Tela::data($proxima) ?? '—',
            'cpf' => Tela::cpf($this->cpf),
            'nascimento' => Tela::data($this->data_nascimento),
            'sexo' => $this->sexo,
            'genero' => $this->sexo ? Tela::SEXOS[$this->sexo] : null,
            'cadastro' => Tela::data($this->criado_em),
            'endereco' => $this->endereco,
            'cidade' => $this->endereco_cidade,
            'uf' => $this->endereco_uf,
            'diaVencimento' => (int) ($this->dia_vencimento ?: 10),
            'emergenciaNome' => $this->contato_emergencia_nome,
            'emergenciaTelefone' => Tela::telefone($this->contato_emergencia_telefone),
            'observacoes' => $this->observacoes,
            'responsavelId' => $this->responsavel_id,
            'parentesco' => $this->responsavel_parentesco,
            'responsavel' => $responsavel ? [
                'id' => $responsavel->id,
                'name' => $responsavel->nome,
                'phone' => Tela::telefone($responsavel->telefone),
                'parentesco' => $this->responsavel_parentesco,
            ] : null,
            'contrato' => $contrato ? [
                'id' => $contrato->id,
                'status' => $contrato->status,
                'sessoes' => $contrato->sessoes_pacote,
                'valor' => (float) $contrato->valor_pacote,
                'cicloFim' => Tela::data($contrato->ciclo_fim),
            ] : null,
            'matriculas' => $this->matriculas->map->paraTela()->values(),
            'cobrancaPendente' => $pendente?->paraTela(),
        ];
    }
}
