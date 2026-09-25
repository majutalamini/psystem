<?php

namespace App\Models;

use App\Support\Tela;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

class Paciente extends Model
{
    protected $table = 'pacientes';

    const CREATED_AT = 'criado_em';

    const UPDATED_AT = 'atualizado_em';

    protected $fillable = [
        'nome', 'cpf', 'telefone', 'email', 'data_nascimento', 'sexo', 'endereco',
        'endereco_cidade', 'endereco_uf', 'convenio', 'contato_emergencia_nome',
        'contato_emergencia_telefone', 'observacoes', 'status_paciente', 'foto',
    ];

    protected function casts(): array
    {
        return ['data_nascimento' => 'date'];
    }

    public function matricula(): HasOne
    {
        return $this->hasOne(Matricula::class);
    }

    public function consultas(): HasMany
    {
        return $this->hasMany(Consulta::class);
    }

    public function prontuarios(): HasMany
    {
        return $this->hasMany(Prontuario::class);
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

    /** Sessões realizadas, última e próxima sessão, matrícula e cobranças em aberto. */
    public function scopeComResumo(Builder $query): void
    {
        $query
            ->withCount(['consultas as sessoes' => fn ($q) => $q->where('status', 'realizado')])
            ->withMax(['consultas as ultima_sessao' => fn ($q) => $q->where('status', 'realizado')], 'data_hora_consulta')
            ->withMin(['consultas as proxima_sessao' => fn ($q) => $q
                ->whereIn('status', ['agendado', 'confirmado'])
                ->where('data_hora_consulta', '>=', now()->startOfDay())], 'data_hora_consulta')
            ->with(['matricula', 'cobrancas' => fn ($q) => $q->where('situacao', 'pendente')->orderBy('vencimento')])
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
            'sexo' => $f['sexo'] ?? null,
            'endereco' => $f['endereco'] ?? null,
            'endereco_cidade' => $f['cidade'] ?? null,
            'endereco_uf' => isset($f['uf']) ? mb_strtoupper($f['uf']) : null,
            'convenio' => $f['convenio'] ?? null,
            'contato_emergencia_nome' => $f['emergenciaNome'] ?? null,
            'contato_emergencia_telefone' => $f['emergenciaTelefone'] ?? null,
            'observacoes' => $f['observacoes'] ?? null,
            'status_paciente' => $f['status'] === 'Ativo' ? 'ativo' : 'inativo',
        ];
    }

    /** Formato que as telas do front esperam (ver resources/js/data/patients.js original). */
    public function paraTela(): array
    {
        $pendente = $this->relationLoaded('cobrancas') ? $this->cobrancas->first() : null;
        $ultima = $this->ultima_sessao ? Carbon::parse($this->ultima_sessao) : null;
        $proxima = $this->proxima_sessao ? Carbon::parse($this->proxima_sessao) : null;

        return [
            'id' => $this->id,
            'name' => $this->nome,
            'initials' => Tela::iniciais($this->nome),
            'color' => Tela::cor($this->id),
            'photo' => $this->foto ? Storage::url($this->foto) : null,
            'phone' => $this->telefone,
            'email' => $this->email,
            'status' => $this->ativo() ? 'Ativo' : 'Inativo',
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
            'convenio' => $this->convenio,
            'emergenciaNome' => $this->contato_emergencia_nome,
            'emergenciaTelefone' => $this->contato_emergencia_telefone,
            'observacoes' => $this->observacoes,
            'matricula' => $this->matricula?->paraTela(),
            'cobrancaPendente' => $pendente?->paraTela(),
        ];
    }
}
